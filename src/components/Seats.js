import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";

const API_URL = "https://maruti.linku.co.id";

const Seats = () => {
    const [boats, setBoats] = useState([]);
    const [trips, setTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [selectedBoat, setSelectedBoat] = useState("");
    const [selectedTrip, setSelectedTrip] = useState("");
    const [seats, setSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState("");
    const [seatsPerRow, setSeatsPerRow] = useState("");
    const [showForm, setShowForm] = useState(false);

    // Fetch boats
    useEffect(() => {
        axios.get(`${API_URL}/api/boats`)
            .then(res => setBoats(res.data))
            .catch(() => swal("Gagal!", "Tidak bisa mengambil data kapal", "error"));
    }, []);

    // Fetch trips
    useEffect(() => {
        axios.get(`${API_URL}/api/trips`)
            .then(res => setTrips(res.data))
            .catch(() => swal("Gagal!", "Tidak bisa mengambil data trips", "error"));
    }, []);

    // Filter trips saat pilih boat
    const handleBoatChange = (e) => {
        const boatId = e.target.value;
        setSelectedBoat(boatId);
        setSelectedTrip("");
        setSeats([]);
        setShowForm(false);

        const filtered = trips.filter(t => t.boat_id.toString() === boatId);
        setFilteredTrips(filtered);

        // Set default rows & seatsPerRow sesuai kapasitas kapal
        const boat = boats.find(b => b.boat_id.toString() === boatId);
        if (boat) {
            const defaultSeatsPerRow = 2; // bisa diubah sesuai layout
            const calculatedRows = Math.ceil(boat.capacity / defaultSeatsPerRow);
            setRows(calculatedRows);
            setSeatsPerRow(defaultSeatsPerRow);
        }
    };

    // Fetch seats ketika pilih trip
    useEffect(() => {
        if (!selectedTrip) return;
        fetchSeats();
    }, [selectedTrip]);

    const fetchSeats = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/seats/trip/${selectedTrip}`);
            setSeats(res.data);
        } catch {
            swal("Gagal!", "Tidak bisa mengambil kursi", "error");
        } finally {
            setLoading(false);
        }
    };

    const getRowLetter = (index) => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (index < alphabet.length) return alphabet[index];
        let result = "";
        let n = index;
        while (n >= 0) {
            result = alphabet[n % 26] + result;
            n = Math.floor(n / 26) - 1;
        }
        return result;
    };

    // Generate & simpan kursi baru
    const handleGenerateSeats = async (e) => {
        e.preventDefault();
        if (!selectedBoat || !selectedTrip || !rows || !seatsPerRow) {
            return swal("Gagal!", "Lengkapi semua pilihan dan jumlah kursi", "error");
        }

        const generatedSeats = [];
        for (let i = 0; i < parseInt(rows); i++) {
            const rowLetter = getRowLetter(i);
            for (let j = 1; j <= parseInt(seatsPerRow); j++) {
                generatedSeats.push({
                    seat_number: `${rowLetter}${j}`,
                    is_available: true,
                    trip_id: selectedTrip,
                });
            }
        }

        try {
            setLoading(true);
            for (const seat of generatedSeats) {
                await axios.post(`${API_URL}/api/seats`, seat);
            }
            swal("Sukses!", "Kursi berhasil dibuat dan disimpan", "success");
            fetchSeats();
            setShowForm(false);
        } catch {
            swal("Gagal!", "Tidak bisa menyimpan kursi", "error");
        } finally {
            setLoading(false);
        }
    };

    // Reset / hapus semua kursi
    const handleResetSeats = async () => {
        swal({
            title: "Apakah Anda yakin?",
            text: "Semua kursi untuk trip ini akan dihapus!",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                try {
                    setLoading(true);
                    await axios.delete(`${API_URL}/api/seats/trip/${selectedTrip}`);
                    swal("Sukses!", "Semua kursi telah dihapus", "success");
                    setSeats([]);
                } catch {
                    swal("Gagal!", "Tidak bisa menghapus kursi", "error");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const seatStyle = (isAvailable) => ({
        border: "1px solid #2b87e0",
        borderRadius: "6px",
        width: "50px",         // width tetap
        height: "50px",        // height tetap
        display: "flex",
        alignItems: "center",  // vertical center
        justifyContent: "center", // horizontal center
        backgroundColor: isAvailable ? "#e6f7ff" : "#ff4d4f",
        textAlign: "center",
        fontSize: "14px",
        boxSizing: "border-box", // padding dan border masuk hitungan width/height
    });

    const renderSeats = () => {
        if (!seats.length) return <p className="mt-3 text-center"></p>;

        const numRows = Math.ceil(seats.length / 4);
        const rowsArr = [];

        for (let i = 0; i < numRows; i++) {
            const leftSeats = seats.slice(i * 4, i * 4 + 2);
            const rightSeats = seats.slice(i * 4 + 2, i * 4 + 4);

            rowsArr.push(
                <div key={i} style={{ display: "flex", gap: "40px", justifyContent: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {leftSeats.map((s, idx) => (
                            <div key={idx} style={seatStyle(s.is_available)}>
                                {s.seat_number}
                            </div>
                        ))}
                    </div>

                    <div style={{ width: "40px" }}></div>

                    <div style={{ display: "flex", gap: "8px" }}>
                        {rightSeats.map((s, idx) => (
                            <div key={idx} style={seatStyle(s.is_available)}>
                                {s.seat_number}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return <div style={{ marginTop: "20px" }}>{rowsArr}</div>;
    };


    return (
        <div>
            <h3>Seats Management</h3>

            {!selectedBoat && <p>Silakan pilih kapal terlebih dahulu untuk melihat trip dan generate kursi</p>}

            <div className="form-group">
                <label>Pilih Kapal</label>
                <select className="form-control" value={selectedBoat} onChange={handleBoatChange}>
                    <option value="">-- Pilih Kapal --</option>
                    {boats.map(b => (
                        <option key={b.boat_id} value={b.boat_id}>
                            {b.boat_name} (Kapasitas: {b.capacity})
                        </option>
                    ))}
                </select>
            </div>

            {selectedBoat && (
                <div className="form-group">
                    <label>Pilih Trip</label>
                    <select className="form-control" value={selectedTrip} onChange={e => setSelectedTrip(e.target.value)}>
                        <option value="">-- Pilih Trip --</option>
                        {filteredTrips.map(t => (
                            <option key={t.trip_id} value={t.trip_id}>
                                {t.route_from} → {t.route_to}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedTrip && (
                <>
                    {seats.length > 0 ? (
                        <button className="btn btn-danger mt-3" onClick={handleResetSeats} disabled={loading}>
                            {loading ? "Menghapus..." : "Reset Data"}
                        </button>
                    ) : (
                        <button className="btn btn-primary mt-3" onClick={() => setShowForm(!showForm)}>
                            {showForm ? "Tutup Form Generate" : "Generate & Simpan Kursi"}
                        </button>
                    )}
                </>
            )}

            {showForm && selectedTrip && (
                <form onSubmit={handleGenerateSeats} className="mt-3">
                    <div className="form-group">
                        <label>
                            Jumlah Baris (total kapasitas kapal: {boats.find(b => b.boat_id.toString() === selectedBoat)?.capacity})
                        </label>
                        <input type="number" className="form-control" value={rows} min="1" onChange={e => setRows(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Kursi per Baris</label>
                        <input type="number" className="form-control" value={seatsPerRow} min="1" onChange={e => setSeatsPerRow(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-info" disabled={loading}>
                        {loading ? "Menyimpan..." : "Generate & Simpan"}
                    </button>
                </form>
            )}

            {loading ? <p>Loading seats...</p> : renderSeats()}
        </div>
    );
};

export default Seats;
