import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { FaTrashAlt, FaFilePdf, FaFileExcel } from 'react-icons/fa';
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Definisikan URL API
const API_URL = "https://maruti.linku.co.id";

const Dashboard = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk filter
    const [selectedBoat, setSelectedBoat] = useState("");
    const [selectedTrip, setSelectedTrip] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedAgent, setSelectedAgent] = useState("");

    // State untuk menyimpan opsi filter unik
    const [boatOptions, setBoatOptions] = useState([]);
    const [tripOptions, setTripOptions] = useState([]);
    const [dateOptions, setDateOptions] = useState([]);
    const [agentOptions, setAgentOptions] = useState([]);

    const fetchAllBookings = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/booking/booking_orders/all`);
            const parsedBookings = response.data.map(booking => ({
                ...booking,
                passengers_data: JSON.parse(booking.passengers_data)
            }));
            setAllBookings(parsedBookings);
            setBookings(parsedBookings);

            const boats = [...new Set(parsedBookings.map(b => b.boat_name))];
            const trips = [...new Set(parsedBookings.map(b => b.trip_route))];
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
            filtered = filtered.filter(booking => booking.trip_route === selectedTrip);
        }
        if (selectedDate) {
            filtered = filtered.filter(booking => booking.trip_date === selectedDate);
        }
        if (selectedAgent) {
            filtered = filtered.filter(booking => booking.agent_name === selectedAgent);
        }
        setBookings(filtered);
    }, [allBookings, selectedBoat, selectedTrip, selectedDate, selectedAgent]);

    useEffect(() => {
        fetchAllBookings();
    }, []);

    const handleDeleteBooking = async (cartId) => {
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
                await axios.delete(`${API_URL}/api/booking/booking_orders/${cartId}`);
                setAllBookings(allBookings.filter(b => b.cart_id !== cartId));
                setBookings(bookings.filter(b => b.cart_id !== cartId));
                Swal.fire('Dihapus!', 'Pemesanan berhasil dihapus.', 'success');
            } catch (err) {
                console.error("Error deleting booking:", err);
                Swal.fire('Gagal!', 'Gagal menghapus pemesanan.', 'error');
            }
        }
    };

    const handleUpdateStatus = async (cartId, currentStatus) => {
        const newStatus = currentStatus === 'Booked' ? 'Cek-in' : 'Booked';
        try {
            await axios.put(`${API_URL}/api/booking/update-status/${cartId}`, { status: newStatus });
            setAllBookings(allBookings.map(booking =>
                booking.cart_id === cartId ? { ...booking, status: newStatus } : booking
            ));
            setBookings(bookings.map(booking =>
                booking.cart_id === cartId ? { ...booking, status: newStatus } : booking
            ));
            Swal.fire('Berhasil!', `Status diubah menjadi ${newStatus}.`, 'success');
        } catch (err) {
            console.error("Error updating status:", err);
            Swal.fire('Gagal!', 'Gagal memperbarui status.', 'error');
        }
    };

    const handleExportFilteredPdf = () => {
        // ... (Kode untuk ekspor PDF tetap sama) ...
        Swal.fire('Gagal!', 'Fungsi PDF sedang non-aktif. Mohon gunakan tombol Export Excel.', 'info');
        // Catatan: Jika Anda ingin kembali menggunakan PDF client-side,
        // aktifkan kembali kode di sini dan hapus baris Swal.fire() di atas.
    };

    const handleExportFilteredExcel = () => {
        if (bookings.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada data yang cocok dengan filter. Tidak ada yang bisa diekspor.', 'warning');
            return;
        }

        // Filter data yang akan diekspor, hanya yang berstatus "Cek-in"
        const checkedInBookings = bookings.filter(booking => booking.status === 'Cek-in');

        if (checkedInBookings.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada pemesanan yang berstatus "Cek-in" dalam filter ini.', 'warning');
            return;
        }

        // Flatten data untuk Excel
        const exportData = [];
        checkedInBookings.forEach(booking => {
            booking.passengers_data.forEach(pax => {
                exportData.push({
                    'No.': '',
                    'Nama Penumpang': pax.fullName,
                    'Kategori Penumpang': `${booking.passenger_category} (${booking.passenger_type})`, // <-- booking.passenger_category yang benar
                    'Trip': booking.trip_route,
                    'Tanggal Trip': booking.trip_date,
                    'Jam Keberangkatan': booking.etd,
                    'Nama Agen': booking.agent_name,
                    'Kode Pemesanan': booking.cart_id,
                    'Status': booking.status,
                });
            });
        });

        // Menambahkan nomor urut setelah data disiapkan
        let no = 1;
        exportData.forEach(row => {
            row['No.'] = no++;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");

        // Membuat file dan mengunduhnya
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

    if (bookings.length === 0 && !loading) {
        return (
            <div className="text-center mt-20 p-4 bg-yellow-100 text-yellow-700 rounded-lg col-span-full">
                <p>Tidak ada history pemesanan yang ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="pt-20 container mx-auto p-4 md:p-8">
            <div className="mb-8 p-4 bg-white rounded-xl shadow-md flex flex-col md:flex-row gap-4 items-center sticky top-20 z-10">
                <h3 className="text-lg font-semibold text-gray-800">Filter Pemesanan:</h3>

                <select
                    className="form-select border rounded-md p-2 w-full md:w-auto"
                    value={selectedBoat}
                    onChange={(e) => setSelectedBoat(e.target.value)}
                >
                    <option value="">Semua Kapal</option>
                    {boatOptions.map(boat => (
                        <option key={boat} value={boat}>{boat}</option>
                    ))}
                </select>

                <select
                    className="form-select border rounded-md p-2 w-full md:w-auto"
                    value={selectedTrip}
                    onChange={(e) => setSelectedTrip(e.target.value)}
                >
                    <option value="">Semua Trip</option>
                    {tripOptions.map(trip => (
                        <option key={trip} value={trip}>{trip}</option>
                    ))}
                </select>

                <input
                    type="date"
                    className="form-input border rounded-md p-2 w-full md:w-auto"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />

                <select
                    className="form-select border rounded-md p-2 w-full md:w-auto"
                    value={selectedAgent}
                    onChange={(e) => setSelectedAgent(e.target.value)}
                >
                    <option value="">Semua Agen</option>
                    {agentOptions.map(agent => (
                        <option key={agent} value={agent}>{agent}</option>
                    ))}
                </select>

                <button
                    onClick={handleExportFilteredExcel}
                    className="text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-full py-2 px-6 flex items-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg w-full md:w-auto"
                    title="Export Laporan Excel"
                >
                    <FaFileExcel size={16} />
                    <span>Export Excel</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-3">
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <div
                            key={booking.cart_id}
                            id={`booking-card-${booking.cart_id}`}
                            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 border-t-4 border-indigo-500"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{booking.trip_route}</h2>
                                    <span className="text-lg text-indigo-600 font-semibold">{booking.boat_name}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <div className="flex items-center space-x-2">
                                        <label htmlFor={`status-toggle-${booking.cart_id}`} className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    id={`status-toggle-${booking.cart_id}`}
                                                    className="sr-only"
                                                    checked={booking.status === 'Cek-in'}
                                                    onChange={() => handleUpdateStatus(booking.cart_id, booking.status)}
                                                />
                                                <div className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out ${booking.status === 'Cek-in' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow transition-transform duration-200 ease-in-out ${booking.status === 'Cek-in' ? 'transform translate-x-6' : ''}`}></div>
                                            </div>
                                        </label>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteBooking(booking.cart_id)}
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
                                    <span>{booking.etd}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Jumlah Kursi:</span>
                                    <span>{booking.seats}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Kategori:</span>
                                    <span className="capitalize">{booking.passenger_category} ({booking.passenger_type})</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Tanggal Order:</span>
                                    <span>{booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Nama Agen:</span>
                                    <span>{booking.agent_name}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="font-medium">Kode Agen:</span>
                                    <span>{booking.user_id}</span>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-gray-200 pt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-md font-semibold text-gray-800">Passengers</h3>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {booking.passengers_data.map((pax, index) => (
                                        <span
                                            key={`${pax.fullName}-${index}`}
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