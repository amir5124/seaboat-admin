import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { FaTrashAlt, FaFilePdf, FaFileExcel, FaInfoCircle } from 'react-icons/fa';
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Modal } from 'react-bootstrap';

// API_URL tetap
const API_URL = "https://api.seaboat.my.id";

// Fungsi untuk mendapatkan kelas styling berdasarkan status
const getStatusStyle = (status) => {
    switch (status.toLowerCase()) {
        case 'cek-in':
            return 'bg-green-100 text-green-800';
        case 'booked':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
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
    // Menghapus state terkait agen:
    // const [selectedAgent, setSelectedAgent] = useState("");
    const [passengerNameFilter, setPassengerNameFilter] = useState("");

    const [boatOptions, setBoatOptions] = useState([]);
    const [tripOptions, setTripOptions] = useState([]);
    const [dateOptions, setDateOptions] = useState([]);
    // Menghapus state opsi agen:
    // const [agentOptions, setAgentOptions] = useState([]);
    const [isUpdating, setIsUpdating] = useState(false);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailBookingData, setDetailBookingData] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const fetchAllBookings = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/booking_orders/all`);
            setAllBookings(response.data);

            const boats = [...new Set(response.data.map(b => b.boat_name))];
            const trips = [...new Set(response.data.map(b => `${b.trip_route}|${b.etd}`))];
            const dates = [...new Set(response.data.map(b => b.trip_date))];
            // Menghapus baris yang mendapatkan data agen:
            // const agents = [...new Set(response.data.map(b => b.agent_name))];

            setBoatOptions(boats);
            setTripOptions(trips);
            setDateOptions(dates);
            // Menghapus baris yang mengatur opsi agen:
            // setAgentOptions(agents);

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
        // Menghapus logika filter agen:
        // if (selectedAgent) {
        //     filtered = filtered.filter(booking => booking.agent_name === selectedAgent);
        // }
        if (passengerNameFilter) {
            const searchName = passengerNameFilter.toLowerCase();
            filtered = filtered.filter(booking => {
                return Array.isArray(booking.all_passenger_data) && booking.all_passenger_data.some(pax => pax.fullName.toLowerCase().includes(searchName));
            });
        }
        setBookings(filtered);
    }, [allBookings, selectedBoat, selectedTrip, selectedDate, passengerNameFilter]); // Menghapus selectedAgent dari dependencies

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const handleUpdateStatus = async (bookingId, currentStatus) => {
        if (isUpdating) return;
        setIsUpdating(true);
        const newStatus = currentStatus === 'Booked' ? 'Cek-in' : 'Booked';

        try {
            await axios.put(`${API_URL}/api/booking/update-status/${bookingId}`, { status: newStatus });
            await fetchAllBookings();
            Swal.fire('Berhasil!', `Status diubah menjadi ${newStatus}.`, 'success');
        } catch (err) {
            console.error("Error updating status:", err);
            Swal.fire('Gagal!', 'Gagal memperbarui status.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteBooking = async (bookingId) => {
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
                await axios.delete(`${API_URL}/api/booking_orders/${bookingId}`);
                fetchAllBookings();
                Swal.fire('Dihapus!', 'Pemesanan berhasil dihapus.', 'success');
            } catch (err) {
                console.error("Error deleting booking:", err);
                Swal.fire('Gagal!', 'Gagal menghapus pemesanan.', 'error');
            }
        }
    };

    const handleViewDetails = (bookingId) => {
        const booking = allBookings.find(b => b.booking_id === bookingId);
        if (booking) {
            setDetailBookingData(booking);
            setShowDetailModal(true);
        } else {
            Swal.fire("Gagal!", "Data tidak ditemukan.", "error");
        }
    };

    const handleExportFilteredExcel = () => {
        if (bookings.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada data yang cocok dengan filter. Tidak ada yang bisa diekspor.', 'warning');
            return;
        }

        const checkedInBookings = bookings.filter(booking => booking.status.toLowerCase() === 'cek-in');

        if (checkedInBookings.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada pemesanan yang berstatus "Cek-in" dalam filter ini.', 'warning');
            return;
        }

        const exportData = [];
        checkedInBookings.forEach(booking => {
            const passengers = booking.all_passenger_data;

            if (Array.isArray(passengers)) {
                passengers.forEach((pax) => {
                    const nationalityType = pax.nationality === 'Indonesian' ? 'Domestik' : 'Mancanegara';
                    exportData.push({
                        'No.': '',
                        'Nama Penumpang': pax.fullName,
                        'Kategori Penumpang': `${pax.type} (${nationalityType})`,
                        'Tipe Trip': `${booking.trip_type}`,
                        'Rute': booking.trip_route,
                        'Tanggal Trip': booking.trip_date,
                        'Jam Keberangkatan': booking.etd,
                        'Nama Agen': booking.agent_name,
                        'Kode Pemesanan': booking.user_id,
                        'Status': booking.status,
                    });
                });
            }
        });

        let no = 1;
        exportData.forEach(row => { row['No.'] = no++; });
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

    const BookingDetailModal = () => {
        if (!showDetailModal || !detailBookingData) return null;

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
                <div className="relative bg-white p-8 rounded-lg shadow-xl w-11/12 md:w-2/3 max-h-[90vh] overflow-y-auto">
                    <button
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
                        onClick={() => {
                            setShowDetailModal(false);
                            setDetailBookingData(null);
                        }}
                    >
                        &times;
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Detail Pemesanan #{detailBookingData.booking_id}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
                            <div>
                                <p><strong>Nama Pemesan:</strong> {detailBookingData.agent_name}</p>
                                <p><strong>Email:</strong> {detailBookingData.user_id}</p>
                                <p><strong>Nomor HP:</strong> {detailBookingData.mobile}</p>
                                <p><strong>Status:</strong> <span className={`font-semibold ${getStatusStyle(detailBookingData.status)}`}>{detailBookingData.status}</span></p>
                                <p><strong>Tanggal Order:</strong> {new Date(detailBookingData.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                <p>
                                    <strong>Total Harga:</strong> Rp {parseInt(detailBookingData.total_price).toLocaleString('id-ID', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    })}
                                </p>
                            </div>
                        </div>
                        <div className="mt-6 border-t pt-4">
                            <h3 className="text-xl font-semibold mb-2">Item Perjalanan ({detailBookingData.trip_type})</h3>
                            {detailBookingData.trip_details && detailBookingData.trip_details.length > 0 ? (
                                <div className="space-y-4">
                                    {detailBookingData.trip_details.map((item, index) => (
                                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-semibold text-base">Trip {index + 1}: {item.route_from} &rarr; {item.route_to}</p>
                                                <span className="text-sm font-medium px-2 py-1 rounded-full text-blue-800 bg-blue-100">{item.trip_type}</span>
                                            </div>
                                            <div className="text-sm">
                                                <p><strong>Tanggal:</strong> {new Date(item.departure_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                <p><strong>Kapal:</strong> {item.boat_name}</p>
                                                <p><strong>Jam Keberangkatan:</strong> {item.etd.substring(0, 5)}</p>
                                            </div>
                                            <div className="mt-4">
                                                <p className="font-semibold text-sm mb-2">Daftar Penumpang ({item.passengers ? item.passengers.length : 0})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.passengers && item.passengers.length > 0 ? (
                                                        item.passengers.map((pax, paxIndex) => (
                                                            <span key={paxIndex} className="bg-blue-200 text-blue-900 text-xs font-medium px-2.5 py-1 rounded-full">
                                                                {pax.fullName} ({pax.type}) - {pax.nationality === 'Indonesian' ? 'Domestik' : 'Mancanegara'}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-500 italic text-sm">Tidak ada data penumpang.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">Tidak ada item perjalanan untuk pemesanan ini.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
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
            <div className="text-center mt-20 p-4 bg-red-100 text-red-700 rounded-lg max-w-lg mx-auto">
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
                    {/* Hapus elemen select untuk filter agen */}
                    {/*
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
                    */}
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
                                    <h2 className="text-2xl font-bold text-gray-900">{booking.trip_type}</h2>

                                </div>

                            </div>

                            <div className="space-y-3 text-gray-700">
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Trip Date:</span>
                                    <span>{new Date(booking.trip_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Jam Keberangkatan:</span>
                                    <span>{booking.etd.substring(0, 5)}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Jumlah Kursi:</span>
                                    <span>{booking.seats}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Detail Penumpang:</span>
                                    <span className="capitalize">
                                        {getPassengerSummary(booking.all_passenger_data)}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Tanggal Order:</span>
                                    <span>{booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>

                            </div>

                            <div className="mt-6 border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-md font-semibold text-gray-800">Status</h3>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>

                            </div>
                            <div className="mt-4">
                                <button
                                    className="btn btn-primary w-full flex items-center justify-center space-x-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-full py-2 px-6 transition-colors duration-200 shadow-md"
                                    onClick={() => handleViewDetails(booking.booking_id)}
                                >
                                    <FaInfoCircle size={16} />
                                    <span>Lihat Detail</span>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center mt-20 p-4 bg-yellow-100 text-yellow-700 rounded-lg col-span-full">
                        <p>Tidak ada pemesanan yang cocok dengan filter yang dipilih.</p>
                    </div>
                )}
            </div>

            <BookingDetailModal />
        </div>
    );
};

export default Dashboard;