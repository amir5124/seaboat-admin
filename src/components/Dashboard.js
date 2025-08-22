import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { IoIosArrowBack } from 'react-icons/io';
import { FaTrashAlt, FaFilePdf } from 'react-icons/fa'; // Menghapus FaCheckSquare karena tidak digunakan
import Swal from "sweetalert2";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Definisikan URL API
const API_URL = "https://maruti.linku.co.id";

const Dashboard = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fungsi untuk mengambil semua data history (khusus admin)
    const fetchAllBookings = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/booking/booking_orders/all`);
            const parsedBookings = response.data.map(booking => ({
                ...booking,
                passengers_data: JSON.parse(booking.passengers_data)
            }));
            setBookings(parsedBookings);
        } catch (err) {
            console.error("Error fetching all booking data:", err);
            setError("Failed to load booking history. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

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
            setBookings(bookings.map(booking =>
                booking.cart_id === cartId ? { ...booking, status: newStatus } : booking
            ));
            Swal.fire('Berhasil!', `Status diubah menjadi ${newStatus}.`, 'success');
        } catch (err) {
            console.error("Error updating status:", err);
            Swal.fire('Gagal!', 'Gagal memperbarui status.', 'error');
        }
    };

    const handleExportPdf = (cartId) => {
        const input = document.getElementById(`booking-card-${cartId}`);
        if (!input) {
            Swal.fire('Gagal!', 'Elemen tidak ditemukan.', 'error');
            return;
        }

        html2canvas(input, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`pesanan_${cartId}.pdf`);
            Swal.fire('Berhasil!', 'PDF berhasil diunduh.', 'success');
        }).catch(err => {
            console.error("Error exporting PDF:", err);
            Swal.fire('Gagal!', 'Gagal mengekspor PDF.', 'error');
        });
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

    if (bookings.length === 0) {
        return (
            <div className="text-center mt-20 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
                <p>Belum ada history pemesanan.</p>
            </div>
        );
    }

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

    return (
        <>


            <div className="pt-20 container mx-auto p-4 md:p-8">
                {/* Menambahkan class grid-cols untuk tampilan yang responsif dan gap untuk spasi */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking) => (
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
                                    {/* Toggle Status */}
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

                                    {/* Tombol Hapus */}
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
                                    {/* --- Kode yang Diperbarui di bawah ini --- */}
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                    {/* --- Akhir dari Kode yang Diperbarui --- */}
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

                            {/* Tombol Export PDF, muncul hanya jika statusnya Cek-in */}
                            {booking.status === 'Cek-in' && (
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={() => handleExportPdf(booking.cart_id)}
                                        className="text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-full py-2 px-6 flex items-center space-x-2 transition-colors duration-200 shadow-md hover:shadow-lg"
                                        title="Export ke PDF"
                                    >
                                        <FaFilePdf size={16} />
                                        <span>Export PDF</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default Dashboard;