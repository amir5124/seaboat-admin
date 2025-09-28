import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { FaFileExcel, FaInfoCircle, FaShip, FaGlobe } from 'react-icons/fa';
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = "https://api.seaboat.my.id";

// =================================================================
// UTILITY FUNCTIONS (TIDAK BERUBAH)
// =================================================================
const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(new Date(dateString).getTime())) return '-';

        const dateObj = new Date(dateString);
        const options = {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return dateObj.toLocaleDateString('id-ID', options);
    } catch (e) {
        return '-';
    }
};

const getStatusStyle = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
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

// =================================================================
// MODAL DETAIL (TIDAK BERUBAH)
// =================================================================
const BookingDetailModal = ({ show, handleClose, detailBookingData }) => {
    if (!show || !detailBookingData) return null;

    const isTourBooking = detailBookingData.source_type === 'TOUR';

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative bg-white p-8 rounded-lg shadow-xl w-11/12 md:w-2/3 max-h-[90vh] overflow-y-auto">
                <button
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl"
                    onClick={handleClose}
                >
                    &times;
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Detail Pemesanan #{detailBookingData.booking_id || '-'}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm md:text-base">
                        <div>
                            <p><strong>Nama Pemesan:</strong> {detailBookingData.agent_name || '-'}</p>
                            <p><strong>Email:</strong> {detailBookingData.user_id || '-'}</p>
                            <p><strong>Nomor HP:</strong> {detailBookingData.mobile || '-'}</p>
                            <p><strong>Status:</strong> <span className={`font-semibold ${getStatusStyle(detailBookingData.status || '-')}`}>{detailBookingData.status || '-'}</span></p>
                            <p><strong>Tanggal Order:</strong> {formatDate(detailBookingData.created_at, true)}</p>
                            <p>
                                <strong>Total Harga:</strong> Rp {parseInt(detailBookingData.total_price || 0).toLocaleString('id-ID', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}
                            </p>
                            <p><strong>Tipe Layanan:</strong> <span className="font-semibold">{isTourBooking ? 'TOUR' : 'FASTBOAT'}</span></p>
                        </div>
                    </div>
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-2">Item Perjalanan ({isTourBooking ? 'TOUR' : 'FASTBOAT'})</h3>
                        {detailBookingData.trip_details && detailBookingData.trip_details.length > 0 ? (
                            <div className="space-y-4">
                                {detailBookingData.trip_details.map((item, index) => {
                                    const routeDisplay = `${item.route_from || '-'} \u2192 ${item.route_to || '-'}`;
                                    return (
                                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-semibold text-base">
                                                    Trip {index + 1}: {isTourBooking ? item.tour_name || '-' : routeDisplay}
                                                </p>
                                                <span className="text-sm font-medium px-2 py-1 rounded-full text-blue-800 bg-blue-100">{item.trip_type || '-'}</span>
                                            </div>
                                            <div className="text-sm">
                                                <p><strong>Tanggal:</strong> {formatDate(item.departure_date)}</p>
                                                {isTourBooking ? (
                                                    <>
                                                        <p><strong>Service:</strong> {item.service_type || '-'}</p>
                                                        <p><strong>Rute (Pickup/Dropoff):</strong> {routeDisplay}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p><strong>Kapal:</strong> {item.boat_name || '-'}</p>
                                                        <p><strong>Jam Keberangkatan:</strong> {item.etd || '-'}</p>
                                                    </>
                                                )}
                                            </div>
                                            <div className="mt-4">
                                                <p className="font-semibold text-sm mb-2">Daftar Penumpang ({item.passengers ? item.passengers.length : 0})</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.passengers && item.passengers.length > 0 ? (
                                                        item.passengers.map((pax, paxIndex) => (
                                                            <span key={paxIndex} className="bg-blue-200 text-blue-900 text-xs font-medium px-2.5 py-1 rounded-full">
                                                                {pax.fullName || '-'} ({pax.type || '-'}) - {(pax.nationality || '').toLowerCase() === 'indonesian' ? 'Domestik' : 'Mancanegara'}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-500 italic text-sm">Tidak ada data penumpang.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
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

// =================================================================
// DASHBOARD COMPONENT (Perubahan Utama di fetchAllBookings)
// =================================================================
const Dashboard = () => {
    const navigate = useNavigate();

    // State data utama, sekarang dipisah
    const [bookings, setBookings] = useState([]);
    const [allFastboatBookings, setAllFastboatBookings] = useState([]);
    const [allTourBookings, setAllTourBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State Tab Aktif
    const [activeTab, setActiveTab] = useState('FASTBOAT');

    // Filter states
    const [selectedBoatOrTour, setSelectedBoatOrTour] = useState("");
    const [selectedTripOrService, setSelectedTripOrService] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [passengerNameFilter, setPassengerNameFilter] = useState("");

    // Filter options
    const [boatOrTourOptions, setBoatOrTourOptions] = useState([]);
    const [tripOrServiceOptions, setTripOrServiceOptions] = useState([]);
    const [dateOptions, setDateOptions] = useState([]);

    const [isUpdating, setIsUpdating] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailBookingData, setDetailBookingData] = useState(null);

    // =================================================================
    // FUNGSI FETCH UTAMA (Sudah Diperbaiki)
    // =================================================================
    const fetchAllBookings = async () => {
        try {
            const fastboatResponse = await axios.get(`${API_URL}/api/booking_orders/all`);

            // FILTER KETAT: Membuang data yang kosong/error dari endpoint Fastboat,
            // yang kemungkinan adalah data Tour yang seharusnya di endpoint /alltour.
            const filteredFastboatData = fastboatResponse.data.filter(b =>
                (b.boat_name && b.boat_name !== '-') && (b.etd && b.etd !== '-')
            );

            // Beri label source_type
            const fastboatData = filteredFastboatData.map(b => ({ ...b, source_type: 'FASTBOAT' }));
            setAllFastboatBookings(fastboatData);

            // Ambil data Tour dari endpoint khusus
            const tourResponse = await axios.get(`${API_URL}/api/booking_orders/alltour`);
            const tourData = tourResponse.data.map(b => ({ ...b, source_type: 'TOUR' }));
            setAllTourBookings(tourData);

            const combinedBookings = [...fastboatData, ...tourData];

            // Filter options
            const boats = [...new Set(fastboatData.map(b => b.boat_name || '-').filter(Boolean))];
            const tours = [...new Set(tourData.map(b => b.trip_route || b.tour_name || '-').filter(Boolean))];

            const fastboatTrips = [...new Set(fastboatData.map(b => `${b.trip_route || '-'} (${b.etd || 'N/A'})`).filter(Boolean))];
            const tourServices = [...new Set(tourData.map(b => b.service_type || '-').filter(Boolean))];

            const dates = [...new Set(combinedBookings.map(b => b.trip_date).filter(Boolean))];

            setBoatOrTourOptions([...boats, ...tours]);
            setTripOrServiceOptions([...fastboatTrips, ...tourServices]);
            setDateOptions(dates);

        } catch (err) {
            setError("Gagal memuat riwayat pemesanan. Coba lagi nanti.");
        } finally {
            setLoading(false);
        }
    };
    // =================================================================

    // Efek untuk Filtering saat ada perubahan state
    useEffect(() => {
        // 1. Tentukan data dasar berdasarkan tab aktif
        let baseData = activeTab === 'FASTBOAT' ? allFastboatBookings : allTourBookings;

        let filtered = baseData;

        // 2. Terapkan Filter
        if (selectedBoatOrTour) {
            filtered = filtered.filter(booking => {
                const name = booking.source_type === 'TOUR' ? booking.trip_route || booking.tour_name : booking.boat_name;
                return (name || '-') === selectedBoatOrTour;
            });
        }

        if (selectedTripOrService) {
            filtered = filtered.filter(booking => {
                if (booking.source_type === 'FASTBOAT') {
                    const optionValue = `${booking.trip_route || '-'} (${booking.etd || 'N/A'})`;
                    return optionValue === selectedTripOrService;
                }
                if (booking.source_type === 'TOUR') {
                    return (booking.service_type || '-') === selectedTripOrService;
                }
                return false;
            });
        }

        if (selectedDate) {
            filtered = filtered.filter(booking => booking.trip_date === selectedDate);
        }

        if (passengerNameFilter) {
            const searchName = passengerNameFilter.toLowerCase();
            filtered = filtered.filter(booking => {
                return Array.isArray(booking.all_passenger_data) && booking.all_passenger_data.some(pax => (pax.fullName || '').toLowerCase().includes(searchName));
            });
        }
        setBookings(filtered);
    }, [activeTab, allFastboatBookings, allTourBookings, selectedBoatOrTour, selectedTripOrService, selectedDate, passengerNameFilter]);

    useEffect(() => {
        fetchAllBookings();
    }, []);

    // Reset filter saat tab berganti
    useEffect(() => {
        setSelectedBoatOrTour("");
        setSelectedTripOrService("");
        setSelectedDate("");
        setPassengerNameFilter("");
    }, [activeTab]);


    const handleUpdateStatus = async (bookingId, currentStatus) => {
        if (isUpdating) return;
        setIsUpdating(true);
        const newStatus = currentStatus.toLowerCase() === 'booked' ? 'Cek-in' : 'Booked';

        try {
            await axios.put(`${API_URL}/api/booking/update-status/${bookingId}`, { status: newStatus });
            await fetchAllBookings();
            Swal.fire('Berhasil!', `Status diubah menjadi ${newStatus}.`, 'success');
        } catch (err) {
            Swal.fire('Gagal!', 'Gagal memperbarui status.', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setDetailBookingData(null);
    };

    const handleViewDetails = (bookingId) => {
        // Cari di kedua array
        const booking = [...allFastboatBookings, ...allTourBookings].find(b => b.booking_id === bookingId);
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

        const checkedInBookings = bookings.filter(booking => (booking.status || '').toLowerCase() === 'cek-in');

        if (checkedInBookings.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada pemesanan yang berstatus "Cek-in" dalam filter ini.', 'warning');
            return;
        }

        const exportData = [];
        checkedInBookings.forEach(booking => {
            const passengers = booking.all_passenger_data;

            const isTour = booking.source_type === 'TOUR';

            const nameForExport = isTour
                ? booking.trip_route || booking.tour_name || 'TOUR DATA KOSONG'
                : booking.boat_name || '-';

            const routeName = isTour
                ? `${nameForExport} (${booking.service_type || 'N/A'})`
                : booking.trip_route || '-';

            if (Array.isArray(passengers)) {
                passengers.forEach((pax) => {
                    const nationalityType = (pax.nationality || '').toLowerCase() === 'indonesian' ? 'Domestik' : 'Mancanegara';
                    exportData.push({
                        'No.': '',
                        'Nama Penumpang': pax.fullName || '-',
                        'Kategori Penumpang': `${pax.type || '-'} (${nationalityType})`,
                        'Tipe Layanan': isTour ? 'TOUR' : 'FASTBOAT',
                        'Nama Kapal/Tour': nameForExport,
                        'Rute/Layanan': routeName,
                        'Tanggal Trip': formatDate(booking.trip_date),
                        'Jam Keberangkatan': isTour ? 'N/A' : booking.etd || '-',
                        'Nama Agen': booking.agent_name || '-',
                        'Kode Pemesanan': booking.user_id || '-',
                        'Status': booking.status || '-',
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
        const filename = `manifest_checkin_${activeTab.toLowerCase()}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.xlsx`;
        saveAs(dataBlob, filename);
        Swal.fire('Berhasil!', 'Laporan Excel berhasil diunduh.', 'success');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
                <p className="ml-4 text-gray-500">Memuat data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center mt-20 p-4 bg-red-100 text-red-700 rounded-lg col-span-full max-w-lg mx-auto">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="pt-20 container mx-auto p-4 md:p-8">

            {/* --- KOMPONEN TAB --- */}
            <div className="mb-4 sticky top-16 z-20 bg-gray-100 rounded-xl shadow-md p-2 flex space-x-2">
                <button
                    onClick={() => setActiveTab('FASTBOAT')}
                    className={`py-2 px-6 font-semibold rounded-lg transition-all duration-200 ${activeTab === 'FASTBOAT' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100'
                        }`}
                >
                    Fastboat ({allFastboatBookings.length})
                </button>
                <button
                    onClick={() => setActiveTab('TOUR')}
                    className={`py-2 px-6 font-semibold rounded-lg transition-all duration-200 ${activeTab === 'TOUR' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100'
                        }`}
                >
                    Tour ({allTourBookings.length})
                </button>
            </div>
            {/* --- AKHIR KOMPONEN TAB --- */}

            <div className="mb-8 p-4 bg-white rounded-xl shadow-md sticky top-32 z-10">
                <div className="flex flex-wrap gap-4 items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Filter:</h3>

                    {/* Filter Kapal/Tour */}
                    <select
                        className="form-select border rounded-md p-2 w-full sm:w-auto"
                        value={selectedBoatOrTour}
                        onChange={(e) => setSelectedBoatOrTour(e.target.value)}
                    >
                        <option value="">Semua {activeTab === 'FASTBOAT' ? 'Kapal' : 'Tour'}</option>
                        {boatOrTourOptions
                            .filter(name => {
                                if (activeTab === 'FASTBOAT') {
                                    return allFastboatBookings.some(b => (b.boat_name || '-') === name);
                                }
                                if (activeTab === 'TOUR') {
                                    return allTourBookings.some(b => (b.trip_route || b.tour_name || '-') === name);
                                }
                                return false;
                            })
                            .map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                    </select>

                    {/* Filter Rute/Service */}
                    <select
                        className="form-select border rounded-md p-2 w-full sm:w-auto"
                        value={selectedTripOrService}
                        onChange={(e) => setSelectedTripOrService(e.target.value)}
                    >
                        <option value="">Semua {activeTab === 'FASTBOAT' ? 'Rute' : 'Service'}</option>
                        {tripOrServiceOptions
                            .filter(option => {
                                if (activeTab === 'FASTBOAT') {
                                    return allFastboatBookings.some(b => `${b.trip_route || '-'} (${b.etd || 'N/A'})` === option);
                                }
                                if (activeTab === 'TOUR') {
                                    return allTourBookings.some(b => (b.service_type || '-') === option);
                                }
                                return false;
                            })
                            .map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                    </select>

                    {/* Filter Tanggal */}
                    <input
                        type="date"
                        className="form-input border rounded-md p-2 w-full sm:w-auto"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    {/* Filter Nama Penumpang */}
                    <input
                        type="text"
                        className="form-input border rounded-md p-2 w-full sm:w-auto sm:mt-0"
                        placeholder="Cari nama penumpang..."
                        value={passengerNameFilter}
                        onChange={(e) => setPassengerNameFilter(e.target.value)}
                    />

                    {/* Tombol Export */}
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
                    bookings.map((booking, index) => {

                        const isTour = activeTab === 'TOUR';
                        const Icon = isTour ? FaGlobe : FaShip;

                        let nameLabel, routeLabel, primaryName, secondaryInfo;

                        if (isTour) {
                            nameLabel = 'Nama Tour/Layanan:';
                            routeLabel = 'Service:';
                            primaryName = booking.trip_route || booking.tour_name || 'NAMA TOUR KOSONG';
                            secondaryInfo = booking.service_type || 'N/A';
                        } else {
                            nameLabel = 'Nama Kapal:';
                            routeLabel = 'Rute Trip:';
                            primaryName = booking.boat_name || '-';
                            secondaryInfo = booking.trip_route || '-';
                        }

                        return (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 p-6 border-t-4 border-indigo-500"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center space-x-2">
                                        <Icon size={24} className="text-indigo-500" />
                                        <h2 className="text-xl font-bold text-gray-900">{isTour ? 'TOUR' : 'FASTBOAT'}</h2>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusStyle(booking.status || '-')}`}>
                                        {booking.status || '-'}
                                    </span>
                                </div>

                                <div className="space-y-3 text-gray-700">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">{nameLabel}</span>
                                        <span className="font-semibold text-gray-900">{primaryName}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">{routeLabel}</span>
                                        <span>{secondaryInfo}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">Trip Date:</span>
                                        <span>{formatDate(booking.trip_date)}</span>
                                    </div>

                                    {!isTour && (
                                        <div className="flex items-center space-x-2">
                                            <span className="font-medium">Jam Keberangkatan:</span>
                                            <span>{booking.etd || '-'}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">Jumlah Peserta:</span>
                                        <span>{booking.seats || 0}</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">Detail Penumpang:</span>
                                        <span className="capitalize text-sm">
                                            {getPassengerSummary(booking.all_passenger_data)}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">Tanggal Order:</span>
                                        <span>{formatDate(booking.created_at)}</span>
                                    </div>

                                </div>

                                <div className="mt-4 flex space-x-2">
                                    <button
                                        className="btn btn-primary w-full flex items-center justify-center space-x-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-full py-2 px-6 transition-colors duration-200 shadow-md"
                                        onClick={() => handleViewDetails(booking.booking_id)}
                                    >
                                        <FaInfoCircle size={16} />
                                        <span>Lihat Detail</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center mt-20 p-4 bg-yellow-100 text-yellow-700 rounded-lg col-span-full">
                        <p>Tidak ada pemesanan {activeTab.toLowerCase()} yang cocok dengan filter yang dipilih.</p>
                    </div>
                )}
            </div>

            <BookingDetailModal
                show={showDetailModal}
                handleClose={handleCloseDetailModal}
                detailBookingData={detailBookingData}
            />
        </div>
    );
};

export default Dashboard;