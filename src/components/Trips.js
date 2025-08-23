import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";

const API_URL = "https://maruti.linku.co.id";

const Trips = () => {
    const [tripData, setTripData] = useState({
        boat_id: "",
        route_from: "",
        route_to: "",
        etd: "",
        remark: ""
    });
    const [boats, setBoats] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loadingBoats, setLoadingBoats] = useState(false);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const routes = [
        { from: "Sanur", to: "Nusa Penida" },
        { from: "Nusa Penida", to: "Sanur" },
        { from: "Sanur", to: "Lembongan" },
        { from: "Lembongan", to: "Sanur" },
        { from: "Nusa Penida", to: "Lembongan" },
        { from: "Lembongan", to: "Nusa Penida" }
    ];

    useEffect(() => {
        const fetchBoats = async () => {
            setLoadingBoats(true);
            try {
                const res = await axios.get(`${API_URL}/api/boats`);
                setBoats(res.data);
            } catch (err) {
                console.error(err);
                swal("Gagal!", "Tidak bisa mengambil data kapal", "error");
            } finally {
                setLoadingBoats(false);
            }
        };
        fetchBoats();
    }, []);

    const fetchTrips = async () => {
        setLoadingTrips(true);
        try {
            const res = await axios.get(`${API_URL}/api/trips`);
            const uniqueTrips = Object.values(
                res.data.reduce((acc, trip) => {
                    const key = `${trip.boat_id}-${trip.route_from}-${trip.route_to}-${trip.etd}`;
                    if (!acc[key]) {
                        acc[key] = { ...trip, count: 0 };
                    }
                    acc[key].count += 1;
                    return acc;
                }, {})
            );
            setTrips(uniqueTrips);
        } catch (err) {
            console.error(err);
            swal("Gagal!", "Tidak bisa mengambil data trips", "error");
        } finally {
            setLoadingTrips(false);
        }
    };

    useEffect(() => {
        fetchTrips();
    }, []);

    const handleChange = (e) => {
        setTripData({ ...tripData, [e.target.name]: e.target.value });
    };

    const handleRouteChange = (e) => {
        const [from, to] = e.target.value.split("|");
        setTripData({ ...tripData, route_from: from, route_to: to });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tripData.boat_id || !tripData.route_from || !tripData.route_to || !tripData.etd) {
            swal("Gagal!", "Data wajib diisi", "error");
            return;
        }

        try {
            swal({
                title: editingId ? "Mengupdate..." : "Menyimpan...",
                text: "Mohon tunggu sebentar",
                icon: "https://res.cloudinary.com/dgsdmgcc7/image/upload/v1755188126/spinner-icon-gif-10_b1hqoa.gif",
                buttons: false,
                closeOnClickOutside: false,
                closeOnEsc: false
            });

            if (editingId) {
                await axios.put(`${API_URL}/api/trips/${editingId}`, tripData);
                swal.close();
                swal("Sukses!", "Trip berhasil diperbarui", "success");
            } else {
                await axios.post(`${API_URL}/api/trips`, tripData);
                swal.close();
                swal("Sukses!", `Trip ${tripData.route_from} - ${tripData.route_to} berhasil ditambahkan`, "success");
            }

            setTripData({ boat_id: "", route_from: "", route_to: "", etd: "", remark: "" });
            setShowForm(false);
            setEditingId(null);

            fetchTrips();
        } catch (err) {
            console.error(err);
            swal.close();
            swal("Gagal!", "Tidak bisa menyimpan trip", "error");
        }
    };

    const handleEdit = (trip) => {
        setTripData({
            boat_id: trip.boat_id,
            route_from: trip.route_from,
            route_to: trip.route_to,
            etd: trip.etd,
            remark: trip.remark || ""
        });
        setEditingId(trip.trip_id);
        setShowForm(true);
    };

    // --- Fungsi handleDelete yang sudah diperbarui ---
    const handleDelete = async (trip) => {
        const { boat_id, route_from, route_to, etd } = trip;

        const confirm = await swal({
            title: "Hapus Semua Trip?",
            text: "Anda akan menghapus semua trip harian untuk rute dan jam ini. Aksi ini tidak dapat dikembalikan!",
            icon: "warning",
            buttons: ["Batal", "Hapus Semua"],
            dangerMode: true
        });

        if (!confirm) return;

        try {
            swal({
                title: "Menghapus...",
                text: "Mohon tunggu sebentar, ini akan memakan waktu.",
                icon: "https://res.cloudinary.com/dgsdmgcc7/image/upload/v1755188126/spinner-icon-gif-10_b1hqoa.gif",
                buttons: false,
                closeOnClickOutside: false,
                closeOnEsc: false
            });

            const response = await axios.delete(`${API_URL}/api/trips/series`, {
                params: {
                    boat_id,
                    route_from,
                    route_to,
                    etd
                }
            });

            swal.close();
            swal("Sukses!", `Trip berhasil dihapus.`, "success");

            if (editingId === trip.trip_id) {
                setShowForm(false);
                setEditingId(null);
                setTripData({ boat_id: "", route_from: "", route_to: "", etd: "", remark: "" });
            }

            fetchTrips();
        } catch (err) {
            console.error(err);
            swal.close();
            swal("Gagal!", "Tidak bisa menghapus trip", "error");
        }
    };
    // --- Akhir dari fungsi yang diperbarui ---

    return (
        <div className="container pt-20">
            <h3>Manajemen Trips</h3>

            <button
                className="btn btn-primary mt-2 mb-3"
                onClick={() => {
                    setShowForm(!showForm);
                    if (!showForm) {
                        setEditingId(null);
                        setTripData({ boat_id: "", route_from: "", route_to: "", etd: "", remark: "" });
                    }
                }}
            >
                {showForm ? "Tutup Form" : "Tambah Trip"}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="mt-3 card card-body shadow-sm">
                    <h5>{editingId ? "Edit Trip" : "Tambah Trip"}</h5>

                    <div className="form-group">
                        <label>Nama Kapal</label>
                        <select
                            className="form-control"
                            name="boat_id"
                            value={tripData.boat_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">-- Pilih Kapal --</option>
                            {loadingBoats ? (
                                <option>Loading...</option>
                            ) : (
                                boats.map((boat) => (
                                    <option key={boat.boat_id} value={boat.boat_id}>
                                        {boat.boat_name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Rute</label>
                        <select
                            className="form-control"
                            onChange={handleRouteChange}
                            value={
                                tripData.route_from && tripData.route_to
                                    ? `${tripData.route_from}|${tripData.route_to}`
                                    : ""
                            }
                            required
                        >
                            <option value="">-- Pilih Rute --</option>
                            {routes.map((r, idx) => (
                                <option key={idx} value={`${r.from}|${r.to}`}>
                                    {r.from} → {r.to}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Jam Keberangkatan</label>
                        <input
                            type="time"
                            className="form-control"
                            name="etd"
                            value={tripData.etd}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Remark</label>
                        <input
                            type="text"
                            className="form-control"
                            name="remark"
                            value={tripData.remark}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="btn btn-success">
                        {editingId ? "Update" : "Simpan"}
                    </button>
                </form>
            )}

            <h3 className="mt-5">Daftar Trips</h3>

            {loadingTrips ? (
                <div className="text-center mt-3">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p>Sedang mengambil data trips...</p>
                </div>
            ) : (
                <div className="row mt-3">
                    {trips.length > 0 ? (
                        trips.map((trip) => (
                            <div className="col-md-4" key={trip.trip_id}>
                                <div className="card mb-3 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title">{trip.boat_name}</h5>
                                        <p className="card-text">
                                            {trip.route_from} → {trip.route_to}
                                            <br />
                                            Jam: {trip.etd}
                                            <br />
                                            Remark: {trip.remark || "-"}
                                            <br />
                                            {/* <span className="font-weight-bold">{trip.count} Hari</span> */}
                                        </p>
                                        <button
                                            className="btn btn-primary btn-sm mr-2"
                                            onClick={() => handleEdit(trip)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(trip)} // Pastikan memanggil dengan objek trip lengkap
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Belum ada data trip.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Trips;