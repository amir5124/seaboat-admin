import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { FaFileExcel, FaInfoCircle, FaShip, FaGlobe, FaFish, FaYacht } from 'react-icons/fa';
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const API_URL = "https://api.seaboat.my.id";

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
        case 'sukses':
            return 'bg-green-100 text-green-800';
        case 'booked':
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'inquiry':
            return 'bg-blue-100 text-blue-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

const BookingDetailModal = ({ show, handleClose, detailBookingData }) => {
    if (!show || !detailBookingData) return null;

    const isFastboat = detailBookingData.source_type === 'FASTBOAT';
    const isTourBooking = !isFastboat;

    let serviceTypeDisplay;
    if (isFastboat) {
        const tripCount = detailBookingData.trip_details ? detailBookingData.trip_details.length : 0;
        serviceTypeDisplay = tripCount === 2 ? 'Roundtrip' : (tripCount === 1 ? 'Oneway' : 'FASTBOAT');
    } else {
        serviceTypeDisplay = (detailBookingData.trip_type || 'TOUR').toUpperCase();
    }

    const agentName = detailBookingData.agent_name || detailBookingData.customer_name || '-';
    const userId = detailBookingData.user_id || detailBookingData.customer_email || '-';
    const mobile = detailBookingData.mobile || detailBookingData.customer_whatsapp || '-';


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
                            <p><strong>Nama Pemesan:</strong> {agentName}</p>
                            <p><strong>Email:</strong> {userId}</p>
                            <p><strong>Nomor HP:</strong> {mobile}</p>
                            <p><strong>Status:</strong> <span className={`font-semibold ${getStatusStyle(detailBookingData.status || '-')}`}>{detailBookingData.status || '-'}</span></p>
                            <p><strong>Tanggal Order:</strong> {formatDate(detailBookingData.created_at, true)}</p>
                            <p>
                                <strong>Total Harga:</strong> Rp {parseInt(detailBookingData.total_price || 0).toLocaleString('id-ID', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                })}
                            </p>

                            <p>
                                <strong>Tipe Layanan:</strong>
                                <span className="font-semibold">{serviceTypeDisplay}</span>
                            </p>

                            {isTourBooking && detailBookingData.customer_message && (
                                <p><strong>Pesan/Permintaan:</strong> {detailBookingData.customer_message}</p>
                            )}
                        </div>
                    </div>
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-xl font-semibold mb-2">Item Perjalanan ({serviceTypeDisplay})</h3>
                        {detailBookingData.trip_details && detailBookingData.trip_details.length > 0 ? (
                            <div className="space-y-4">
                                {detailBookingData.trip_details.map((item, index) => {
                                    const routeDisplay = `${item.route_from || '-'} \u2192 ${item.route_to || '-'}`;
                                    const itemTripType = item.trip_type || detailBookingData.trip_type || 'TOUR';
                                    const tripName = isTourBooking ? item.tour_name || '-' : routeDisplay;

                                    return (
                                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-semibold text-base">
                                                    Trip {index + 1}: {tripName}
                                                </p>
                                                <span className="text-sm font-medium px-2 py-1 rounded-full text-blue-800 bg-blue-100">{itemTripType.toUpperCase() || '-'}</span>
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
                                                        <span className="text-gray-500 italic text-sm">Tidak ada data penumpang (atau ini adalah Inquiry).</span>
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

const Dashboard = () => {
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [allFastboatBookings, setAllFastboatBookings] = useState([]);

    const [allGeneralTourBookings, setAllGeneralTourBookings] = useState([]);
    const [allFishingBookings, setAllFishingBookings] = useState([]);
    const [allYachtBookings, setAllYachtBookings] = useState([]);
    const [allTourBookings, setAllTourBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('FASTBOAT');

    const [selectedBoatOrTour, setSelectedBoatOrTour] = useState("");
    const [selectedTripOrService, setSelectedTripOrService] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [passengerNameFilter, setPassengerNameFilter] = useState("");

    const [boatOrTourOptions, setBoatOrTourOptions] = useState([]);
    const [tripOrServiceOptions, setTripOrServiceOptions] = useState([]);
    const [dateOptions, setDateOptions] = useState([]);

    const [isUpdating, setIsUpdating] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailBookingData, setDetailBookingData] = useState(null);

    const fetchAllBookings = async () => {
        setLoading(true);
        try {
            const fastboatResponse = await axios.get(`${API_URL}/api/booking_orders/all`);
            const fastboatData = fastboatResponse.data
                .filter(b => (b.boat_name && b.boat_name !== '-'))
                .map(b => ({ ...b, source_type: 'FASTBOAT', trip_type: 'FASTBOAT' }));
            setAllFastboatBookings(fastboatData);

            const tourResponse = await axios.get(`${API_URL}/api/booking_orders/alltour`);
            const generalTourData = tourResponse.data
                .filter(b => (b.trip_type || '').toUpperCase() === 'TOUR')
                .map(b => ({
                    ...b,
                    source_type: 'TOUR',
                    trip_type: 'TOUR',
                    agent_name: b.customer_name || b.agent_name,
                    user_id: b.customer_email || b.user_id,
                    mobile: b.customer_whatsapp || b.mobile,
                    trip_route: b.tour_name,
                    status: b.status || 'Booked',
                }));
            setAllGeneralTourBookings(generalTourData);

            const inquiryResponse = await axios.get(`${API_URL}/api/booking_orders/allpackage`);

            const allInquiryData = inquiryResponse.data.map(b => {
                const tripType = (b.trip_type || 'INQUIRY').toUpperCase();

                return {
                    ...b,
                    source_type: tripType,
                    trip_type: tripType,
                    booking_id: b.booking_id || b.id,
                    agent_name: b.customer_name || b.agent_name,
                    user_id: b.customer_email || b.user_id,
                    mobile: b.customer_whatsapp || b.mobile,
                    trip_route: b.tour_name,
                    seats: b.seats,
                    trip_date: b.trip_date,
                    status: 'Inquiry',
                    total_price: b.total_price || 0,

                    trip_details: [{
                        tour_name: b.tour_name,
                        service_type: b.trip_type || 'Inquiry',
                        route_from: b.start_pickup,
                        route_to: b.end_dropoff,
                        departure_date: b.trip_date,
                        trip_type: tripType,
                        passengers: [],
                    }]
                };
            });

            const fishingData = allInquiryData.filter(b => b.trip_type === 'FISHING');
            const yachtData = allInquiryData.filter(b => b.trip_type === 'YACHT');

            setAllFishingBookings(fishingData);
            setAllYachtBookings(yachtData);

            const combinedTourData = [...generalTourData, ...fishingData, ...yachtData];
            setAllTourBookings(combinedTourData);

            const allBookingsForFilter = [...fastboatData, ...combinedTourData];

            const boats = [...new Set(fastboatData.map(b => b.boat_name || '-').filter(Boolean))];
            const allTourNames = [...new Set(combinedTourData.map(b => b.trip_route || '-').filter(Boolean))];

            const fastboatTrips = [...new Set(fastboatData.map(b => `${b.trip_route || '-'} (${b.etd || 'N/A'})`).filter(Boolean))];
            const tourServices = [...new Set(combinedTourData.map(b => b.service_type || '-').filter(Boolean))];

            const dates = [...new Set(allBookingsForFilter.map(b => b.trip_date).filter(Boolean))].sort();

            setBoatOrTourOptions([...boats, ...allTourNames]);
            setTripOrServiceOptions([...fastboatTrips, ...tourServices]);
            setDateOptions(dates);

        } catch (err) {
            setError("Gagal memuat riwayat pemesanan. Coba lagi nanti.");
            console.error("Error fetching all bookings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllBookings();
    }, []);

    useEffect(() => {
        let baseData = [];

        switch (activeTab) {
            case 'FASTBOAT':
                baseData = allFastboatBookings;
                break;
            case 'TOUR':
                baseData = allGeneralTourBookings;
                break;
            case 'FISHING':
                baseData = allFishingBookings;
                break;
            case 'YACHT':
                baseData = allYachtBookings;
                break;
            default:
                baseData = [];
        }

        let filtered = baseData;

        const currentSourceType = activeTab;

        if (selectedBoatOrTour) {
            filtered = filtered.filter(booking => {
                let name;
                if (currentSourceType === 'FASTBOAT') {
                    name = booking.boat_name;
                } else {
                    name = booking.trip_route || booking.tour_name;
                }
                return (name || '-') === selectedBoatOrTour;
            });
        }

        if (selectedTripOrService) {
            filtered = filtered.filter(booking => {
                if (currentSourceType === 'FASTBOAT') {
                    const optionValue = `${booking.trip_route || '-'} (${booking.etd || 'N/A'})`;
                    return optionValue === selectedTripOrService;
                }
                if (currentSourceType !== 'FASTBOAT') {
                    return (booking.service_type || '-') === selectedTripOrService ||
                        (booking.trip_route || '-') === selectedTripOrService;
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
                return (booking.agent_name || booking.customer_name || '').toLowerCase().includes(searchName) ||
                    (Array.isArray(booking.all_passenger_data) && booking.all_passenger_data.some(pax => (pax.fullName || '').toLowerCase().includes(searchName)));
            });
        }
        setBookings(filtered);
    }, [activeTab, allFastboatBookings, allGeneralTourBookings, allFishingBookings, allYachtBookings, selectedBoatOrTour, selectedTripOrService, selectedDate, passengerNameFilter, allTourBookings]);

    useEffect(() => {
        setSelectedBoatOrTour("");
        setSelectedTripOrService("");
        setSelectedDate("");
        setPassengerNameFilter("");
    }, [activeTab]);


    const handleUpdateStatus = async (bookingId, currentStatus) => {
        if (isUpdating) return;
        setIsUpdating(true);
        const newStatus = (currentStatus.toLowerCase() === 'booked' || currentStatus.toLowerCase() === 'pending' || currentStatus.toLowerCase() === 'sukses') ? 'Cek-in' : 'Booked';

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
        const allBookings = [...allFastboatBookings, ...allTourBookings];
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

        const bookingsToExport = bookings.filter(booking => {
            const status = (booking.status || '').toLowerCase();
            const type = booking.trip_type;
            const isExportableStatus = status === 'cek-in' || status === 'sukses';
            const isPackageInquiry = type === 'FISHING' || type === 'YACHT';

            return isPackageInquiry || isExportableStatus;
        });

        if (bookingsToExport.length === 0) {
            Swal.fire('Gagal!', 'Tidak ada pemesanan yang berstatus "Cek-in" atau "Sukses" yang cocok (atau tidak ada Inquiry Fishing/Yacht).', 'warning');
            return;
        }

        const exportData = [];
        bookingsToExport.forEach(booking => {
            const sourceType = booking.trip_type || booking.source_type;
            const isFastboat = sourceType === 'FASTBOAT';
            const isInquiry = sourceType === 'FISHING' || sourceType === 'YACHT';

            const nameForExport = isFastboat
                ? booking.boat_name || '-'
                : booking.trip_route || 'NAMA TRIP KOSONG';

            const routeName = isFastboat
                ? booking.trip_route || '-'
                : booking.start_pickup || booking.service_type || 'N/A';

            const agentName = booking.agent_name || booking.customer_name || '-';
            const customerEmail = booking.user_id || booking.customer_email || '-';

            const passengers = booking.all_passenger_data;

            if (Array.isArray(passengers) && passengers.length > 0) {
                passengers.forEach((pax) => {
                    const nationalityType = (pax.nationality || '').toLowerCase() === 'indonesian' ? 'Domestik' : 'Mancanegara';
                    exportData.push({
                        'No.': '',
                        'Nama Penumpang': pax.fullName || '-',
                        'Kategori Penumpang': `${pax.type || '-'} (${nationalityType})`,
                        'Tipe Layanan': sourceType,
                        'Nama Kapal/Trip': nameForExport,
                        'Rute/Layanan': routeName,
                        'Tanggal Trip': formatDate(booking.trip_date),
                        'Jam Keberangkatan': isFastboat ? booking.etd || '-' : 'N/A',
                        'Nama Agen/Pemesan': agentName,
                        'Email Pemesan': customerEmail,
                        'Status': booking.status || '-',
                    });
                });
            } else {
                exportData.push({
                    'No.': '',
                    'Nama Penumpang': agentName,
                    'Kategori Penumpang': isInquiry ? `Inquiry (${booking.seats || 0} Pax)` : 'Data Penumpang Kosong',
                    'Tipe Layanan': sourceType,
                    'Nama Kapal/Trip': nameForExport,
                    'Rute/Layanan': routeName,
                    'Tanggal Trip': formatDate(booking.trip_date),
                    'Jam Keberangkatan': isFastboat ? booking.etd || '-' : 'N/A',
                    'Nama Agen/Pemesan': agentName,
                    'Email Pemesan': customerEmail,
                    'Status': booking.status || '-',
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
        const filename = `manifest_data_${activeTab.toLowerCase()}_${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}.xlsx`;
        saveAs(dataBlob, filename);
        Swal.fire('Berhasil!', 'Laporan Excel berhasil diunduh.', 'success');
    };

    const getBookingCount = (type) => {
        switch (type) {
            case 'FASTBOAT': return allFastboatBookings.length;
            case 'TOUR': return allGeneralTourBookings.length;
            case 'FISHING': return allFishingBookings.length;
            case 'YACHT': return allYachtBookings.length;
            default: return 0;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
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

            <div className="mb-4 sticky top-16 z-20 bg-gray-100 rounded-xl shadow-md p-2 flex space-x-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('FASTBOAT')}
                    className={`py-2 px-6 font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'FASTBOAT' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100'
                        }`}
                >
                    <FaShip className="inline mr-2" /> Fastboat ({getBookingCount('FASTBOAT')})
                </button>
                <button
                    onClick={() => setActiveTab('TOUR')}
                    className={`py-2 px-6 font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'TOUR' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100'
                        }`}
                >
                    <FaGlobe className="inline mr-2" /> Tour General ({getBookingCount('TOUR')})
                </button>
                <button
                    onClick={() => setActiveTab('FISHING')}
                    className={`py-2 px-6 font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'FISHING' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100'
                        }`}
                >
                    <FaFish className="inline mr-2" /> Fishing ({getBookingCount('FISHING')})
                </button>
                <button
                    onClick={() => setActiveTab('YACHT')}
                    className={`py-2 px-6 font-semibold rounded-lg transition-all duration-200 whitespace-nowrap ${activeTab === 'YACHT' ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100'
                        }`}
                >
                    <FaShip className="inline mr-2" /> Yacht ({getBookingCount('YACHT')})
                </button>
            </div>

            <div className="mb-8 p-4 bg-white rounded-xl shadow-md sticky top-32 z-10">
                <div className="flex flex-wrap gap-4 items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Filter:</h3>

                    <select
                        className="form-select border rounded-md p-2 w-full sm:w-auto"
                        value={selectedBoatOrTour}
                        onChange={(e) => setSelectedBoatOrTour(e.target.value)}
                    >
                        <option value="">
                            Semua {activeTab === 'FASTBOAT' ? 'Kapal' : 'Trip'}
                        </option>
                        {boatOrTourOptions
                            .filter(name => {
                                const currentBookings = activeTab === 'FASTBOAT' ? allFastboatBookings :
                                    activeTab === 'FISHING' ? allFishingBookings :
                                        activeTab === 'YACHT' ? allYachtBookings : allGeneralTourBookings;

                                return currentBookings.some(b => (b.boat_name || b.trip_route || '-') === name);
                            })
                            .map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                    </select>

                    <select
                        className="form-select border rounded-md p-2 w-full sm:w-auto"
                        value={selectedTripOrService}
                        onChange={(e) => setSelectedTripOrService(e.target.value)}
                    >
                        <option value="">
                            Semua {activeTab === 'FASTBOAT' ? 'Rute/Jam' : 'Service/Pickup'}
                        </option>
                        {tripOrServiceOptions
                            .filter(option => {
                                if (activeTab === 'FASTBOAT') {
                                    return allFastboatBookings.some(b => `${b.trip_route || '-'} (${b.etd || 'N/A'})` === option);
                                }
                                return allTourBookings.some(b =>
                                    (b.trip_type === activeTab && (b.service_type || b.start_pickup || '-') === option) ||
                                    (activeTab === 'TOUR' && b.trip_type === 'TOUR' && (b.service_type || '-') === option)
                                );
                            })
                            .map(option => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                    </select>

                    <input
                        type="date"
                        className="form-input border rounded-md p-2 w-full sm:w-auto"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />

                    <input
                        type="text"
                        className="form-input border rounded-md p-2 w-full sm:w-auto sm:mt-0"
                        placeholder="Cari nama pemesan/penumpang..."
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
                    bookings.map((booking, index) => {

                        const isFastboat = activeTab === 'FASTBOAT';
                        const sourceType = booking.trip_type || booking.source_type || 'TOUR';

                        let Icon = FaGlobe;
                        if (sourceType === 'FASTBOAT') Icon = FaShip;
                        if (sourceType === 'FISHING') Icon = FaFish;
                        if (sourceType === 'YACHT') Icon = FaShip;


                        let nameLabel, routeLabel, primaryName, secondaryInfo;
                        let tripTypeLabel;

                        if (isFastboat) {
                            nameLabel = 'Nama Kapal:';
                            routeLabel = 'Rute Trip:';
                            primaryName = booking.boat_name || '-';
                            secondaryInfo = booking.trip_route || '-';
                            const tripCount = booking.trip_details ? booking.trip_details.length : 0;
                            tripTypeLabel = tripCount === 2 ? 'Roundtrip' : (tripCount === 1 ? 'Oneway' : 'FASTBOAT');
                        } else {
                            nameLabel = `Nama ${sourceType}:`;
                            routeLabel = sourceType === 'FISHING' || sourceType === 'YACHT' ? 'Pickup Point:' : 'Service:';
                            primaryName = booking.trip_route || 'NAMA TRIP KOSONG';
                            secondaryInfo = booking.start_pickup || booking.service_type || 'N/A';
                            tripTypeLabel = sourceType;
                        }

                        const participantCount = booking.seats || (booking.all_passenger_data?.length || 0);
                        const isFinalBooking = isFastboat || sourceType === 'TOUR';
                        const displayStatus = booking.status || 'Booked';

                        return (
                            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 border-l-4 border-indigo-500">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                        <Icon className="mr-3 text-indigo-600" size={24} />
                                        {tripTypeLabel.toUpperCase()}
                                    </h3>
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusStyle(displayStatus)}`}>
                                        {displayStatus.toUpperCase()}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-700">
                                    <p><strong>ID Booking:</strong> {booking.booking_id || '-'}</p>
                                    <p><strong>{nameLabel}</strong> <span className="font-semibold text-indigo-700">{primaryName}</span></p>
                                    <p><strong>Tanggal Trip:</strong> {formatDate(booking.trip_date)}</p>
                                    <p><strong>{routeLabel}</strong> {secondaryInfo}</p>
                                    <p><strong>Pemesan:</strong> {booking.agent_name || booking.customer_name || '-'}</p>
                                    <p><strong>Total Peserta:</strong> <span className="font-bold">{participantCount} Pax</span></p>
                                </div>

                                <div className="mt-4 flex justify-between items-center space-x-2">
                                    <button
                                        onClick={() => handleViewDetails(booking.booking_id)}
                                        className="w-full text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg py-2 flex items-center justify-center transition-colors duration-200 shadow-md"
                                    >
                                        <FaInfoCircle className="mr-2" /> Lihat Detail
                                    </button>

                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="md:col-span-2 lg:col-span-3 text-center p-10 bg-white rounded-xl shadow-md">
                        <p className="text-gray-500 text-lg">
                            Tidak ada data pemesanan yang ditemukan untuk tab/filter ini.
                        </p>
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