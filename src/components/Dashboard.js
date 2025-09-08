import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { FaTrashAlt, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = "https://maruti.linku.co.id";

// Helper untuk parsing JSON sederhana
const safeJsonParse = (data) => {
    if (typeof data === 'string') {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Failed to parse JSON string:", e);
            return null;
        }
    }
    return data;
};

// Helper baru untuk parsing agent_notes yang di-stringfy satu atau dua kali
const safeParseNotes = (notesString) => {
    // Jika data bukan string, kembalikan array kosong
    if (typeof notesString !== 'string') {
        return [];
    }

    try {
        let notes = JSON.parse(notesString);
        // Jika hasil parse pertama adalah string, coba parse lagi
        if (typeof notes === 'string') {
            notes = JSON.parse(notes);
        }
        // Pastikan hasil akhir adalah array
        if (Array.isArray(notes)) {
            return notes;
        }
    } catch (e) {
        console.error("Failed to parse agent notes:", e);
    }

    // Jika semua percobaan gagal, kembalikan array kosong
    return [];
};

const getPassengerSummary = (passengers) => {
    const summary = {};
    if (Array.isArray(passengers)) {
        passengers.forEach(pax => {
            const type = pax.type;
            if (type) {
                summary[type] = (summary[type] || 0) + 1;
            }
        });
    }
    return Object.entries(summary).map(([type, count]) => {
        const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1);
        return `${count} ${capitalizedType}`;
    }).join(', ');
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedBoat, setSelectedBoat] = useState("");
    const [selectedTrip, setSelectedTrip] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedAgent, setSelectedAgent] = useState("");
    const [passengerNameFilter, setPassengerNameFilter] = useState("");

    const [boatOptions, setBoatOptions] = useState([]);
    const [tripOptions, setTripOptions] = useState([]);
    const [dateOptions, setDateOptions] = useState([]);
    const [agentOptions, setAgentOptions] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const groupBookingsByTrip = (data) => {
        const grouped = {};
        data.forEach(booking => {
            const groupKey = booking.is_admin_order
                ? `admin-${booking.cart_id}`
                : `agent-${booking.trip_date}-${booking.etd}-${booking.boat_name}-${booking.trip_route}-${booking.user_id}-${booking.created_at}`;

            if (!grouped[groupKey]) {
                grouped[groupKey] = {
                    ...booking,
                    all_seats: 0,
                    all_passenger_data: [],
                    cart_ids: [],
                    // Catatan agen akan disimpan dalam array
                    agentNotes: []
                };
            }

            const passengers = safeJsonParse(booking.passengers_data);
            if (Array.isArray(passengers)) {
                grouped[groupKey].all_passenger_data.push(...passengers);
            }
            grouped[groupKey].all_seats += booking.seats;
            grouped[groupKey].cart_ids.push(booking.cart_id);

            // Gunakan helper safeParseNotes yang baru di sini
            const parsedNotes = safeParseNotes(booking.agent_notes);
            if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
                // Hanya tambahkan catatan jika belum ada di dalam array
                parsedNotes.forEach(note => {
                    if (!grouped[groupKey].agentNotes.includes(note)) {
                        grouped[groupKey].agentNotes.push(note);
                    }
                });
            }
        });

        return Object.values(grouped);
    };

    const fetchAllBookings = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/booking/booking_orders/all`);
            const parsedBookings = response.data.map(booking => ({
                ...booking,
                // Mengonversi nilai 0/1 dari database ke boolean
                is_admin_order: !!booking.is_admin_order,
                passengers_data: safeJsonParse(booking.passengers_data) || []
            }));
            setAllBookings(parsedBookings);

            const boats = [...new Set(parsedBookings.map(b => b.boat_name))];
            const trips = [...new Set(parsedBookings.map(b => `${b.trip_route}|${b.etd}`))];
            const dates = [...new Set(parsedBookings.map(b => b.trip_date))];
            const agents = [...new Set(parsedBookings.map(b => b.agent_name))];

            setBoatOptions(boats);
            setTripOptions(trips);
            setDateOptions(dates);
            setAgentOptions(agents);

        } catch (err) {
            console.error("Error fetching all booking data:", err);
            setError("Failed to load booking history. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = allBookings;

        if (selectedBoat) {
            filtered = filtered.filter(booking => booking.boat_name === selectedBoat);
        }
        if (selectedTrip) {
            const [route, etd] = selectedTrip.split("|");
            filtered = filtered.filter(booking => booking.trip_route === route && booking.etd === etd);
        }
        if (selectedDate) {
            filtered = filtered.filter(booking => booking.trip_date === selectedDate);
        }
        if (selectedAgent) {
            filtered = filtered.filter(booking => booking.agent_name === selectedAgent);
        }
        if (passengerNameFilter) {
            const searchName = passengerNameFilter.toLowerCase();
            filtered = filtered.filter(booking => {
                const passengers = safeJsonParse(booking.passengers_data);
                return Array.isArray(passengers) && passengers.some(pax => pax.fullName.toLowerCase().includes(searchName));
            });
        }
        const groupedBookings = groupBookingsByTrip(filtered);
        setBookings(groupedBookings);
    }, [allBookings, selectedBoat, selectedTrip, selectedDate, selectedAgent, passengerNameFilter]);

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const handleUpdateStatus = async (cartIds, currentStatus) => {
        if (isUpdating) {
            return;
        }

        setIsUpdating(true);

        const newStatus = currentStatus === 'Booked' ? 'Cek-in' : 'Booked';

        try {
            await axios.put(`${API_URL}/api/booking/update-status/bulk-update`, {
                cart_ids: cartIds,
                status: newStatus
            });

            await fetchAllBookings();

            Swal.fire('Berhasil!', `Status diubah menjadi ${newStatus}.`, 'success');
        } catch (err) {
            console.error("Error updating status:", err);
            Swal.fire('Gagal!', 'Gagal memperbarui status.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteBooking = async (cartIds) => {
        const result = await Swal.fire({
            title: 'Konfirmasi Penghapusan',
            text: "Apakah Anda yakin ingin menghapus pesanan ini? Aksi ini tidak dapat dibatalkan.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            try {
                await axios.delete(`${API_URL}/api/booking/booking_orders/bulk-delete`, {
                    data: { cart_ids: cartIds }
                });

                fetchAllBookings();

                Swal.fire('Dihapus!', 'Pemesanan berhasil dihapus.', 'success');
            } catch (err) {
                console.error("Error deleting booking:", err);
                Swal.fire('Gagal!', 'Gagal menghapus pemesanan.', 'error');
            }
        }
    };

    const handleExportFilteredExcel = () => {
        if (bookings.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada data yang cocok dengan filter. Tidak ada yang bisa diekspor.', 'warning');
            return;
        }

        const checkedInBookings = bookings.filter(booking => booking.status === 'Cek-in');

        if (checkedInBookings.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada pemesanan yang berstatus "Cek-in" dalam filter ini.', 'warning');
            return;
        }

        const exportData = [];
        checkedInBookings.forEach(booking => {
            const passengers = booking.all_passenger_data;
            const agentNotes = booking.agentNotes.join(', ') || '';

            if (Array.isArray(passengers)) {
                passengers.forEach((pax, paxIndex) => {
                    exportData.push({
                        'No.': '',
                        'Nama Penumpang': pax.fullName,
                        'Kategori Penumpang': `${pax.type}`,
                        'Tipe Penumpang': `${booking.passenger_type}`,
                        'Trip': booking.trip_route,
                        'Tanggal Trip': booking.trip_date,
                        'Jam Keberangkatan': booking.etd,
                        'Nama Agen': booking.agent_name,
                        'Kode Pemesanan': booking.user_id,
                        'Status': booking.status,
                        // Tambahkan catatan hanya pada baris pertama per pemesanan
                        'Catatan Agen': paxIndex === 0 ? agentNotes : '',
                    });
                });
            }
        });

        let no = 1;
        exportData.forEach(row => {
            row['No.'] = no++;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        const now = new Date();
        const filename = `manifest_checkin_${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}.xlsx`;
        saveAs(dataBlob, filename);

        Swal.fire('Berhasil!', 'Laporan Excel berhasil diunduh.', 'success');
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Cek-in':
                return 'bg-green-100 text-green-800';
            case 'Booked':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-500"></p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center mt-20 p-4 bg-red-100 text-red-700 rounded-lg">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="pt-20 container mx-auto p-4 md:p-8">
            <div className="mb-8 p-4 bg-white rounded-xl shadow-md sticky top-20 z-10">
                <div className="flex flex-wrap gap-4 items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Filter:</h3>
                    <select
                        className="form-select border rounded-md p-2 w-full sm:w-auto"
                        value={selectedBoat}
                        onChange={(e) => setSelectedBoat(e.target.value)}
                    >
                        <option value="">Semua Kapal</option>
                        {boatOptions.map(boat => (
                            <option key={boat} value={boat}>{boat}</option>
                        ))}
                    </select>

                    <select
                        className="form-select border rounded-md p-2 w-full sm:w-auto"
                        value={selectedTrip}
                        onChange={(e) => setSelectedTrip(e.target.value)}
                    >
                        <option value="">Semua Trip</option>
                        {tripOptions.map(trip => (
                            <option key={trip} value={trip}>{trip.split('|')[0]} ({trip.split('|')[1]})</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        className="form-input border rounded-md p-2 w-full sm:w-auto"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    <select
                        className="form-select border rounded-md p-2 w-full sm:w-auto"
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                        <option value="">Semua Agen</option>
                        {agentOptions.map(agent => (
                            <option key={agent} value={agent}>{agent}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        className="form-input border rounded-md p-2 w-full sm:w-auto sm:mt-0"
                        placeholder="Cari nama penumpang..."
                        value={passengerNameFilter}
                        onChange={(e) => setPassengerNameFilter(e.target.value)}
                    />

                    <button
                        onClick={handleExportFilteredExcel}
                        className="text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-full py-2 px-6 flex items-center justify-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg w-full sm:w-auto mt-2 sm:mt-0"
                        title="Export Laporan Excel"
                    >
                        <FaFileExcel size={16} />
                        <span>Export Excel</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
                {bookings.length > 0 ? (
                    bookings.map((booking, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 border-t-4 border-indigo-500"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{booking.trip_route}</h2>
                                    <span className="text-lg text-indigo-600 font-semibold">{booking.boat_name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor={`status-toggle-${index}`} className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id={`status-toggle-${index}`}
                                                    className="sr-only"
                                                    checked={booking.status === 'Cek-in'}
                                                    onChange={() => handleUpdateStatus(booking.cart_ids, booking.status)}
                                                />
                                                <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${booking.status === 'Cek-in' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow transition-transform duration-200 ease-in-out ${booking.status === 'Cek-in' ? 'transform translate-x-6' : ''}`}></div>
                                            </div>
                                        </label>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteBooking(booking.cart_ids)}
                                        className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors duration-200"
                                        title="Hapus Pemesanan"
                                    >
                                        <FaTrashAlt size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Trip Date:</span>
                                    <span>{booking.trip_date}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Jam Keberangkatan:</span>
                                    <span>{booking.etd.substring(0, 5)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Jumlah Kursi:</span>
                                    <span>{booking.all_seats}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Jenis Penumpang:</span>
                                    <span>{booking.passenger_type}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Detail:</span>
                                    <span className="capitalize">
                                        {getPassengerSummary(booking.all_passenger_data)}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Tanggal Order:</span>
                                    <span>{booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Agen:</span>
                                    <span>{booking.agent_name}</span>
                                    {!!booking.is_admin_order && (
                                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 text-center">
                                            Pemesanan Admin
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Kode Agen:</span>
                                    <span>{booking.user_id}</span>
                                </div>
                                {booking.agentNotes && booking.agentNotes.length > 0 && (
                                    <div className="">
                                        <span className="font-medium">Catatan Agen</span>
                                        <ul className="list-disc list-inside text-sm text-gray-600">
                                            {booking.agentNotes.map((note, noteIndex) => (
                                                <li key={noteIndex}>{note}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            </div>



                            <div className="mt-6 border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-md font-semibold text-gray-800">Passengers</h3>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {booking.all_passenger_data && booking.all_passenger_data.map((pax, paxIndex) => (
                                        <span
                                            key={`${pax.fullName}-${paxIndex}`}
                                            className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200"
                                        >
                                            {pax.fullName}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center mt-20 p-4 bg-yellow-100 text-yellow-700 rounded-lg col-span-full">
                        <p>Tidak ada pemesanan yang cocok dengan filter yang dipilih.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;