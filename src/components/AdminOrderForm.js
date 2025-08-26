import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";

const API_URL = "https://maruti.linku.co.id";

const AdminOrderForm = () => {
    const [formData, setFormData] = useState({
        user_id: "",
        agent_name: "",
        trip_id: "",
        trip_date: new Date(),
        boat_id: "",
        route_from: "",
        route_to: "",
        etd: "",
        adult_seats: 0,
        child_seats: 0,
        passenger_type: "domestic",
        boat_name: "",
        trip_route: "",
        status: "Cek-in",
        passengers_data: "",
    });

    const [agents, setAgents] = useState([]);
    const [boats, setBoats] = useState([]);
    const [trips, setTrips] = useState([]);
    const [availableSeats, setAvailableSeats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [passengers, setPassengers] = useState([]);
    const [isTripPassed, setIsTripPassed] = useState(false); // State baru untuk cek waktu ETD

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [agentsRes, boatsRes, tripsRes] = await Promise.all([
                    axios.get(`${API_URL}/api/agens`),
                    axios.get(`${API_URL}/api/boats`),
                    axios.get(`${API_URL}/api/trips`)
                ]);
                setAgents(agentsRes.data);
                setBoats(boatsRes.data);
                setTrips(tripsRes.data);
            } catch (error) {
                console.error("Gagal mengambil data:", error);
                Swal.fire("Error", "Gagal mengambil data agen, kapal, atau trip.", "error");
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const totalSeats = formData.adult_seats + formData.child_seats;
        const newPassengers = [];
        let adultCount = 0;
        let childCount = 0;

        for (let i = 0; i < totalSeats; i++) {
            const isAdult = i < formData.adult_seats;
            const type = isAdult ? "adult" : "child";
            if (isAdult) {
                adultCount++;
                newPassengers.push({
                    name: passengers[i]?.name || "",
                    label: `Penumpang Dewasa #${adultCount}`,
                    type: type
                });
            } else {
                childCount++;
                newPassengers.push({
                    name: passengers[i]?.name || "",
                    label: `Penumpang Anak #${childCount}`,
                    type: type
                });
            }
        }
        setPassengers(newPassengers);
    }, [formData.adult_seats, formData.child_seats]);

    useEffect(() => {
        const checkAvailability = async () => {
            const { boat_id, route_from, route_to, trip_date, etd } = formData;
            if (boat_id && route_from && route_to && trip_date && etd) {
                setLoading(true);
                setAvailableSeats(null);
                setIsTripPassed(false); // Reset status ETD

                const formattedDate = `${trip_date.getFullYear()}-${String(trip_date.getMonth() + 1).padStart(2, '0')}-${String(trip_date.getDate()).padStart(2, '0')}`;

                // Validasi Waktu ETD di sisi klien
                const now = new Date();
                const etdTime = new Date(`${formattedDate}T${etd}`);

                if (now > etdTime) {
                    Swal.fire("Gagal", "Maaf, waktu keberangkatan sudah lewat.", "error");
                    setIsTripPassed(true); // Set state ETD sudah lewat
                    setAvailableSeats(0);
                    setLoading(false);
                    return;
                }

                try {
                    const params = {
                        boat_id,
                        route_from,
                        route_to,
                        trip_date: formattedDate,
                        etd,
                    };
                    const res = await axios.get(`${API_URL}/api/availability`, { params });
                    const selectedTrip = trips.find(t => t.trip_id === res.data.trip_id);

                    // Validasi Sisa Kursi
                    if (res.data.available_seats === 0) {
                        Swal.fire("Gagal", "Maaf, kursi sudah habis.", "error");
                    }

                    setAvailableSeats(res.data.available_seats);
                    setFormData(prevData => ({
                        ...prevData,
                        trip_id: res.data.trip_id,
                        trip_route: selectedTrip ? `${selectedTrip.route_from} ke ${selectedTrip.route_to}` : "",
                    }));
                } catch (error) {
                    console.error("Gagal mendapatkan ketersediaan trip:", error);
                    setAvailableSeats(0);
                    Swal.fire("Gagal", `Trip tidak tersedia: ${error.response?.data?.message || "Terjadi kesalahan."}`, "error");
                } finally {
                    setLoading(false);
                }
            }
        };
        checkAvailability();
    }, [formData.trip_date, formData.boat_id, formData.route_from, formData.route_to, formData.etd]);

    const handlePassengerCountChange = (category, type) => {
        setFormData(prevData => {
            const newCount = type === 'increment' ? prevData[category] + 1 : Math.max(0, prevData[category] - 1);
            return {
                ...prevData,
                [category]: newCount
            };
        });
    };

    const handleTypeChange = (e) => {
        setFormData(prevData => ({
            ...prevData,
            passenger_type: e.target.value
        }));
    };

    const handleAgentChange = (e) => {
        const agentId = e.target.value;
        const selectedAgent = agents.find((agent) => agent.kode_agen === agentId);
        setFormData((prevData) => ({
            ...prevData,
            user_id: agentId,
            agent_name: selectedAgent ? selectedAgent.nama : "",
        }));
    };

    const handleBoatChange = (e) => {
        const boatId = e.target.value;
        const selectedBoat = boats.find((boat) => boat.boat_id === parseInt(boatId));
        setFormData((prevData) => ({
            ...prevData,
            boat_id: boatId,
            boat_name: selectedBoat ? selectedBoat.boat_name : "",
            route_from: "",
            route_to: "",
            etd: "",
            trip_id: "",
            trip_route: "",
        }));
        setAvailableSeats(null);
        setIsTripPassed(false);
    };

    const handleRouteFromChange = (e) => {
        const { value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            route_from: value,
            route_to: "",
            etd: "",
            trip_id: "",
            trip_route: "",
        }));
        setAvailableSeats(null);
        setIsTripPassed(false);
    };

    const handleRouteToChange = (e) => {
        const { value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            route_to: value,
            etd: "",
            trip_id: "",
            trip_route: "",
        }));
        setAvailableSeats(null);
        setIsTripPassed(false);
    };

    const handleETDChange = (e) => {
        const { value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            etd: value,
            trip_id: "",
            trip_route: "",
        }));
        setAvailableSeats(null);
        setIsTripPassed(false);
    };

    const handleDateChange = (date) => {
        setFormData((prevData) => ({
            ...prevData,
            trip_date: date,
            boat_id: "",
            route_from: "",
            route_to: "",
            etd: "",
            trip_id: "",
            trip_route: "",
        }));
        setAvailableSeats(null);
        setIsTripPassed(false);
    };

    const handlePassengerNameChange = (index, e) => {
        const { value } = e.target;
        const newPassengers = [...passengers];
        newPassengers[index].name = value;
        setPassengers(newPassengers);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const totalSeats = formData.adult_seats + formData.child_seats;

        try {
            if (!formData.user_id || !formData.trip_id || totalSeats < 1) {
                Swal.fire("Error", "Mohon lengkapi semua data.", "error");
                setLoading(false);
                return;
            }
            if (!formData.agent_name) {
                Swal.fire("Error", "Nama Agen tidak ditemukan. Mohon pilih ulang agen.", "error");
                setLoading(false);
                return;
            }

            // Validasi Ketersediaan Kursi sebelum mengirim
            if (availableSeats < totalSeats) {
                Swal.fire("Error", `Jumlah kursi yang diminta (${totalSeats}) melebihi sisa kursi yang tersedia (${availableSeats}).`, "error");
                setLoading(false);
                return;
            }

            // Validasi Waktu ETD (tambahan)
            const formattedDate = `${formData.trip_date.getFullYear()}-${String(formData.trip_date.getMonth() + 1).padStart(2, '0')}-${String(formData.trip_date.getDate()).padStart(2, '0')}`;
            const now = new Date();
            const etdTime = new Date(`${formattedDate}T${formData.etd}`);

            if (now > etdTime) {
                Swal.fire("Gagal", "Maaf, waktu keberangkatan sudah lewat.", "error");
                setLoading(false);
                return;
            }


            const passengerCategory = formData.adult_seats > 0 && formData.child_seats > 0
                ? "adult_and_child"
                : formData.adult_seats > 0
                    ? "adult"
                    : formData.child_seats > 0
                        ? "child"
                        : "";

            const formattedPassengersData = passengers.map(p => ({
                fullName: p.name,
                type: p.type
            }));

            const payload = {
                user_id: formData.user_id,
                agent_name: formData.agent_name,
                trip_id: formData.trip_id,
                trip_date: formattedDate,
                seats: totalSeats,
                passenger_category: passengerCategory,
                passenger_type: formData.passenger_type,
                boat_name: formData.boat_name,
                trip_route: formData.trip_route,
                etd: formData.etd,
                status: formData.status,
                passengers_data: JSON.stringify(formattedPassengersData),
                is_admin_order: true,
            };

            const res = await axios.post(`${API_URL}/api/cart/admin/create-order`, payload);

            if (res.status === 201) {
                Swal.fire("Berhasil!", `Pemesanan berhasil dibuat.`, "success");

                setFormData({
                    user_id: "",
                    agent_name: "",
                    trip_id: "",
                    trip_date: new Date(),
                    boat_id: "",
                    route_from: "",
                    route_to: "",
                    etd: "",
                    adult_seats: 0,
                    child_seats: 0,
                    passenger_type: "domestic",
                    boat_name: "",
                    trip_route: "",
                    status: "Cek-in",
                    passengers_data: "",
                });
                setPassengers([]);
                setAvailableSeats(null);
            } else {
                Swal.fire("Gagal!", "Pemesanan gagal dibuat. Silakan coba lagi.", "error");
            }
        } catch (error) {
            console.error("Gagal mengirim data:", error.response?.data?.message || error.message);
            Swal.fire("Gagal!", `Pemesanan gagal: ${error.response?.data?.message || "Terjadi kesalahan."}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const filteredByBoat = trips.filter(trip => trip.boat_id === parseInt(formData.boat_id));
    const uniqueFromRoutes = [...new Set(filteredByBoat.map(t => t.route_from))];
    const filteredByFromRoute = filteredByBoat.filter(t => t.route_from === formData.route_from);
    const uniqueToRoutes = [...new Set(filteredByFromRoute.map(t => t.route_to))];
    const filteredByToRoute = filteredByFromRoute.filter(t => t.route_to === formData.route_to);
    const uniqueEtds = [...new Set(filteredByToRoute.map(t => t.etd))];

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-100 min-h-screen">
            <div className="bg-white rounded-lg shadow-xl p-6 md:p-10 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">Form Order Admin</h1>
                <p className="text-center text-gray-600 mb-8">Buat pemesanan manual untuk agen dan pelanggan.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-1">Pilih Agen</label>
                        <select
                            id="user_id"
                            name="user_id"
                            value={formData.user_id}
                            onChange={handleAgentChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">-- Pilih Agen --</option>
                            {agents.map((agent) => (
                                <option key={agent.kode_agen} value={agent.kode_agen}>
                                    {agent.nama} ({agent.kode_agen})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="trip_date" className="block text-sm font-medium text-gray-700 mb-1">Tanggal Trip</label>
                            <DatePicker
                                selected={formData.trip_date}
                                onChange={handleDateChange}
                                dateFormat="dd/MM/yyyy"
                                minDate={new Date()}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="boat_id" className="block text-sm font-medium text-gray-700 mb-1">Pilih Kapal</label>
                            <select
                                id="boat_id"
                                name="boat_id"
                                value={formData.boat_id}
                                onChange={handleBoatChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Pilih Kapal --</option>
                                {boats.map((boat) => (
                                    <option key={boat.boat_id} value={boat.boat_id}>
                                        {boat.boat_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="route_from" className="block text-sm font-medium text-gray-700 mb-1">Rute Keberangkatan</label>
                            <select
                                id="route_from"
                                name="route_from"
                                value={formData.route_from}
                                onChange={handleRouteFromChange}
                                required
                                disabled={!formData.boat_id}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                            >
                                <option value="">-- Pilih Rute --</option>
                                {uniqueFromRoutes.map((route) => (
                                    <option key={route} value={route}>
                                        {route}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="route_to" className="block text-sm font-medium text-gray-700 mb-1">Rute Tujuan</label>
                            <select
                                id="route_to"
                                name="route_to"
                                value={formData.route_to}
                                onChange={handleRouteToChange}
                                required
                                disabled={!formData.route_from}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                            >
                                <option value="">-- Pilih Rute --</option>
                                {uniqueToRoutes.map((route) => (
                                    <option key={route} value={route}>
                                        {route}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="etd" className="block text-sm font-medium text-gray-700 mb-1">Jam Keberangkatan (ETD)</label>
                        <select
                            id="etd"
                            name="etd"
                            value={formData.etd}
                            onChange={handleETDChange}
                            required
                            disabled={!formData.route_to}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                        >
                            <option value="">-- Pilih Jam --</option>
                            {uniqueEtds.map((etd) => (
                                <option key={etd} value={etd}>
                                    {etd}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">Jenis Penumpang</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg border transition-colors ${formData.passenger_type === 'domestic' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'
                                    }`}
                                onClick={() => handleTypeChange({ target: { value: 'domestic' } })}
                            >
                                Domestic
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg border transition-colors ${formData.passenger_type === 'foreign' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 border-gray-300 hover:bg-gray-300'
                                    }`}
                                onClick={() => handleTypeChange({ target: { value: 'foreign' } })}
                            >
                                Foreign
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mt-4">
                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dewasa</label>
                                <div className="flex items-center justify-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => handlePassengerCountChange('adult_seats', 'decrement')}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center text-lg font-semibold">{formData.adult_seats}</span>
                                    <button
                                        type="button"
                                        onClick={() => handlePassengerCountChange('adult_seats', 'increment')}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div className="text-center">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Anak</label>
                                <div className="flex items-center justify-center space-x-2">
                                    <button
                                        type="button"
                                        onClick={() => handlePassengerCountChange('child_seats', 'decrement')}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
                                    >
                                        -
                                    </button>
                                    <span className="w-12 text-center text-lg font-semibold">{formData.child_seats}</span>
                                    <button
                                        type="button"
                                        onClick={() => handlePassengerCountChange('child_seats', 'increment')}
                                        className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-lg font-bold hover:bg-gray-200"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {availableSeats !== null && (
                        <div className="mt-4 p-4 bg-blue-100 text-blue-800 rounded-md text-center">
                            Sisa Kursi Tersedia: <span className="font-bold">{availableSeats}</span>
                        </div>
                    )}

                    {passengers.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Penumpang</h3>
                            <div className="space-y-4">
                                {passengers.map((passenger, index) => (
                                    <div key={index}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{passenger.label}</label>
                                        <input
                                            type="text"
                                            name={`passenger-name-${index}`}
                                            placeholder="Masukkan nama"
                                            value={passenger.name}
                                            onChange={(e) => handlePassengerNameChange(index, e)}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status Pemesanan</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={(e) => setFormData(prevData => ({ ...prevData, status: e.target.value }))}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >

                            <option value="Cek-in">Cek-in</option>
                            <option value="Booked">Booked</option>
                        </select>
                    </div>

                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={loading || availableSeats === null || availableSeats < (formData.adult_seats + formData.child_seats) || isTripPassed}
                            className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-gray-400"
                        >
                            {loading ? "Menyimpan..." : "Buat Pemesanan"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminOrderForm;