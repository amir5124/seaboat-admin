import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import { FaTrash, FaEdit, FaPlus, FaTimes } from "react-icons/fa";

// Ganti dengan URL API backend Anda yang sebenarnya
const API_URL = "https://api.seaboat.my.id";

// --- Fungsi formatPrice tetap sama ---
const formatPrice = (price) => {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || !price) return '0';

    return new Intl.NumberFormat('id-ID').format(numericPrice).replace(/,00$/, '');
};

const TourManagement = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // ⭐ STATE UNTUK MULTILANGUAGE (ID & EN)
    const [activeLangTab, setActiveLangTab] = useState('id'); // State untuk mengontrol tab bahasa

    const [formData, setFormData] = useState({
        id: null,
        // ID Fields (Non-sufiks)
        name: "",
        short_overview: "",
        overview: "",
        highlights_id: [""],
        itinerary_id: [""],
        inclusions_id: [""],
        exclusions_id: [""],
        // EN Fields (Sufiks _en)
        name_en: "",
        short_overview_en: "",
        overview_en: "",
        highlights_en: [""],
        itinerary_en: [""],
        inclusions_en: [""],
        exclusions_en: [""],
        // Non-Content Fields
        service_type: "TOUR",
        price_domestic_adult: "",
        price_domestic_child: "",
        price_foreigner_adult: "",
        price_foreigner_child: "",
        images: [],
        existingImages: [],
    });

    useEffect(() => {
        fetchTours();
    }, []);

    const fetchTours = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/api/tours`);
            // Filter data hanya untuk 'TOUR'
            const filteredTours = response.data.filter(item => item.service_type === 'TOUR');
            setTours(filteredTours);
        } catch (error) {
            console.error("Error fetching tours:", error);
            swal("Error", "Gagal mengambil data tur.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleImageChange = (e) => {
        setFormData({ ...formData, images: [...formData.images, ...e.target.files] });
    };

    const handleRemoveNewImage = (index) => {
        const newImages = [...formData.images];
        newImages.splice(index, 1);
        setFormData({ ...formData, images: newImages });
    };

    const handleRemoveExistingImage = async (imageUrl) => {
        const willDelete = await swal({
            title: "Apakah Anda yakin?",
            text: "Gambar yang dihapus akan dihilangkan dari tur saat disimpan!",
            icon: "warning",
            buttons: ["Batal", "Ya, Hapus!"],
            dangerMode: true,
        });

        if (willDelete) {
            const updatedExistingImages = formData.existingImages.filter(img => img !== imageUrl);
            setFormData({ ...formData, existingImages: updatedExistingImages });
            swal("Sukses!", "Gambar akan dihapus saat pembaruan disimpan.", "success");
        }
    };

    // Fungsi Array (digunakan untuk ID dan EN, asalkan fieldName benar)
    const handleArrayChange = (e, index, fieldName) => {
        const newArray = [...formData[fieldName]];
        newArray[index] = e.target.value;
        setFormData({ ...formData, [fieldName]: newArray });
    };

    const handleAddArrayItem = (fieldName) => {
        setFormData({ ...formData, [fieldName]: [...formData[fieldName], ""] });
    };

    const handleRemoveArrayItem = (index, fieldName) => {
        const newArray = formData[fieldName].filter((_, i) => i !== index);
        setFormData({ ...formData, [fieldName]: newArray });
    };

    const handleEdit = (tour) => {
        setFormData({
            id: tour.id,
            // ID Fields
            name: tour.name || "",
            short_overview: tour.short_overview || "",
            overview: tour.overview || "",
            highlights_id: tour.highlights || [""],
            itinerary_id: tour.trip_itinerary || [""],
            inclusions_id: tour.inclusions || [""],
            exclusions_id: tour.exclusions || [""],
            // EN Fields (Ambil dari kolom sufiks _en)
            name_en: tour.name_en || "",
            short_overview_en: tour.short_overview_en || "",
            overview_en: tour.overview_en || "",
            highlights_en: tour.highlights_en || [""],
            itinerary_en: tour.trip_itinerary_en || [""],
            inclusions_en: tour.inclusions_en || [""],
            exclusions_en: tour.exclusions_en || [""],
            // Non-Content Fields
            service_type: tour.service_type || "TOUR",
            price_domestic_adult: tour.price_domestic_adult,
            price_domestic_child: tour.price_domestic_child,
            price_foreigner_adult: tour.price_foreigner_adult,
            price_foreigner_child: tour.price_foreigner_child,
            images: [],
            existingImages: tour.images || [],
        });
        setActiveLangTab('id'); // Reset tab ke ID saat edit
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const willDelete = await swal({
            title: "Apakah Anda yakin?",
            text: "Data tur yang dihapus tidak bisa dikembalikan!",
            icon: "warning",
            buttons: ["Batal", "Ya, Hapus!"],
            dangerMode: true,
        });

        if (willDelete) {
            try {
                await axios.delete(`${API_URL}/api/tours/${id}`);
                swal("Sukses!", "Tur berhasil dihapus.", "success");
                fetchTours();
            } catch (error) {
                console.error("Error deleting tour:", error);
                swal("Error", "Gagal menghapus tur.", "error");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();

        // ⭐ SUBMISSION: ID FIELDS
        data.append("name", formData.name);
        data.append("short_overview", formData.short_overview);
        data.append("overview", formData.overview);
        data.append("highlights", JSON.stringify(formData.highlights_id.filter(item => item !== "")));
        data.append("itinerary", JSON.stringify(formData.itinerary_id.filter(item => item !== "")));
        data.append("inclusions", JSON.stringify(formData.inclusions_id.filter(item => item !== "")));
        data.append("exclusions", JSON.stringify(formData.exclusions_id.filter(item => item !== "")));

        // ⭐ SUBMISSION: EN FIELDS
        data.append("name_en", formData.name_en);
        data.append("short_overview_en", formData.short_overview_en);
        data.append("overview_en", formData.overview_en);
        data.append("highlights_en", JSON.stringify(formData.highlights_en.filter(item => item !== "")));
        data.append("itinerary_en", JSON.stringify(formData.itinerary_en.filter(item => item !== "")));
        data.append("inclusions_en", JSON.stringify(formData.inclusions_en.filter(item => item !== "")));
        data.append("exclusions_en", JSON.stringify(formData.exclusions_en.filter(item => item !== "")));

        // Non-Content Fields
        data.append("service_type", "TOUR");
        data.append("price_domestic_adult", formData.price_domestic_adult);
        data.append("price_domestic_child", formData.price_domestic_child);
        data.append("price_foreigner_adult", formData.price_foreigner_adult);
        data.append("price_foreigner_child", formData.price_foreigner_child);

        // Images
        for (let i = 0; i < formData.images.length; i++) {
            data.append("images", formData.images[i]);
        }
        data.append("existingImages", JSON.stringify(formData.existingImages));

        // Method override untuk PUT
        if (formData.id) {
            data.append("_method", "PUT");
        }


        try {
            if (formData.id) {
                // UPDATE
                await axios.post(`${API_URL}/api/tours/${formData.id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "Tur berhasil diperbarui.", "success");
            } else {
                // CREATE
                await axios.post(`${API_URL}/api/tours`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "Tur berhasil ditambahkan.", "success");
            }
            setShowModal(false);
            fetchTours();
        } catch (error) {
            console.error("Error submitting form:", error);
            if (error.response && error.response.data) {
                console.error("Server Response:", error.response.data);
            }
            swal("Error", "Gagal menyimpan data tur. Cek koneksi API dan log server.", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            // ID Fields
            name: "",
            short_overview: "",
            overview: "",
            highlights_id: [""],
            itinerary_id: [""],
            inclusions_id: [""],
            exclusions_id: [""],
            // EN Fields
            name_en: "",
            short_overview_en: "",
            overview_en: "",
            highlights_en: [""],
            itinerary_en: [""],
            inclusions_en: [""],
            exclusions_en: [""],
            // Non-Content Fields
            service_type: "TOUR",
            price_domestic_adult: "",
            price_domestic_child: "",
            price_foreigner_adult: "",
            price_foreigner_child: "",
            images: [],
            existingImages: [],
        });
        setActiveLangTab('id'); // Reset tab ke ID
        setShowModal(false);
    };

    // --- Tampilan Komponen ---

    return (

        <div className="container pt-20 ">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Manajemen Paket Tur</h1>
            <button
                onClick={() => {
                    resetForm();
                    setShowModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-300 mb-6 flex items-center"
            >
                <FaPlus className="mr-2" />
                Tambah Tur Baru
            </button>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full text-blue-500"></div>

                </div>
            ) : (
                // Wrapper overflow-x-auto untuk tabel responsif di mobile
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Nama Tur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Tipe Layanan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Deskripsi Singkat</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Harga Dewasa (Domestik)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tours.map((tour) => (
                                <tr key={tour.id}>
                                    {/* Di tabel utama, kita asumsikan ditampilkan dalam Bahasa ID */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tour.name}</td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}>
                                            {tour.service_type}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden truncate" title={tour.short_overview}>
                                        {tour.short_overview}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        Rp {formatPrice(tour.price_domestic_adult)}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {tour.images &&
                                                tour.images.slice(0, 3).map((image, index) => (
                                                    <img
                                                        key={index}
                                                        className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover"
                                                        src={`${API_URL}${image}`}
                                                        alt={`Tour image ${index + 1}`}
                                                    />
                                                ))}
                                            {tour.images && tour.images.length > 3 && (
                                                <span className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 text-gray-600 text-xs font-bold ring-2 ring-white">
                                                    +{tour.images.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEdit(tour)}
                                                className="text-yellow-600 hover:text-yellow-900 transition-colors duration-200"
                                                title="Edit"
                                            >
                                                <FaEdit className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(tour.id)}
                                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                                title="Hapus"
                                            >
                                                <FaTrash className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-8 max-h-[90vh] overflow-y-auto max-w-4xl w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold text-gray-800">{formData.id ?
                                "Edit Paket Tur" : "Tambah Paket Tur"}</h2>
                            <button onClick={resetForm} className="text-gray-500 hover:text-gray-800">
                                <FaTimes className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>

                            {/* --- Kontrol Tab Bahasa --- */}
                            <div className="col-span-2 mb-4">
                                <div className="flex border-b border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setActiveLangTab('id')}
                                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeLangTab === 'id'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        🇮🇩 Bahasa Indonesia
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLangTab('en')}
                                        className={`py-2 px-4 text-sm font-medium transition-colors ${activeLangTab === 'en'
                                                ? 'border-b-2 border-blue-600 text-blue-600'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        🇬🇧 English
                                    </button>
                                </div>
                            </div>
                            {/* --- Akhir Kontrol Tab --- */}


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                                {/* Tipe Layanan (Selalu terlihat, di luar tab bahasa) */}
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Tipe Layanan</label>
                                    <select
                                        name="service_type"
                                        value={formData.service_type}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 bg-gray-100"
                                        required
                                        disabled
                                    >
                                        <option value="TOUR">TOUR</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">Tipe layanan ini adalah TOUR.</p>
                                </div>

                                {/* Placeholder untuk grid agar input berikutnya di kolom 2 */}
                                <div className="col-span-1"></div>

                                {/* --- INPUT BAHASA INDONESIA --- */}
                                {activeLangTab === 'id' && (
                                    <>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Nama Tur (ID)</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Deskripsi Singkat (ID - Max 255 Karakter)</label>
                                            <textarea
                                                name="short_overview"
                                                value={formData.short_overview}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                rows="2"
                                                maxLength="255"
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Deskripsi Lengkap (ID - Overview)</label>
                                            <textarea
                                                name="overview"
                                                value={formData.overview}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                rows="3"
                                                required
                                            ></textarea>
                                        </div>

                                        {/* Bagian Array Inputs (ID) */}
                                        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (ID)</label>
                                                {formData.highlights_id.map((highlight, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={highlight}
                                                            onChange={(e) => handleArrayChange(e, index, "highlights_id")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Highlight ID ${index + 1}`}
                                                        />
                                                        {formData.highlights_id.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "highlights_id")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("highlights_id")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Tambah Highlight ID
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Itinerary / Detail Waktu/Durasi (ID)</label>
                                                {formData.itinerary_id.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => handleArrayChange(e, index, "itinerary_id")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Detail ID ${index + 1}`}
                                                        />
                                                        {formData.itinerary_id.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "itinerary_id")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("itinerary_id")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Tambah Detail Waktu ID
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions (ID)</label>
                                                {formData.inclusions_id.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => handleArrayChange(e, index, "inclusions_id")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Inclusions ID ${index + 1}`}
                                                        />
                                                        {formData.inclusions_id.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "inclusions_id")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("inclusions_id")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Tambah Inclusions ID
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions (ID)</label>
                                                {formData.exclusions_id.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => handleArrayChange(e, index, "exclusions_id")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Exclusions ID ${index + 1}`}
                                                        />
                                                        {formData.exclusions_id.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "exclusions_id")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("exclusions_id")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Tambah Exclusions ID
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* --- INPUT BAHASA INGGRIS --- */}
                                {activeLangTab === 'en' && (
                                    <>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Nama Tur (EN)</label>
                                            <input
                                                type="text"
                                                name="name_en"
                                                value={formData.name_en}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                required
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Short Overview (EN - Max 255 Characters)</label>
                                            <textarea
                                                name="short_overview_en"
                                                value={formData.short_overview_en}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                rows="2"
                                                maxLength="255"
                                                required
                                            ></textarea>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700">Full Description (EN - Overview)</label>
                                            <textarea
                                                name="overview_en"
                                                value={formData.overview_en}
                                                onChange={handleInputChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                rows="3"
                                                required
                                            ></textarea>
                                        </div>

                                        {/* Bagian Array Inputs (EN) */}
                                        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Highlights (EN)</label>
                                                {formData.highlights_en.map((highlight, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={highlight}
                                                            onChange={(e) => handleArrayChange(e, index, "highlights_en")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Highlight EN ${index + 1}`}
                                                        />
                                                        {formData.highlights_en.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "highlights_en")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("highlights_en")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Add Highlight EN
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Itinerary / Time Detail (EN)</label>
                                                {formData.itinerary_en.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => handleArrayChange(e, index, "itinerary_en")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Detail EN ${index + 1}`}
                                                        />
                                                        {formData.itinerary_en.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "itinerary_en")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("itinerary_en")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Add Time Detail EN
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions (EN)</label>
                                                {formData.inclusions_en.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => handleArrayChange(e, index, "inclusions_en")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Inclusions EN ${index + 1}`}
                                                        />
                                                        {formData.inclusions_en.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "inclusions_en")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("inclusions_en")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Add Inclusions EN
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions (EN)</label>
                                                {formData.exclusions_en.map((item, index) => (
                                                    <div key={index} className="flex items-center space-x-2 mb-2">
                                                        <input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => handleArrayChange(e, index, "exclusions_en")}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                            placeholder={`Exclusions EN ${index + 1}`}
                                                        />
                                                        {formData.exclusions_en.length > 1 && (
                                                            <button type="button" onClick={() => handleRemoveArrayItem(index, "exclusions_en")} className="text-red-500 hover:text-red-700">
                                                                <FaTimes />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => handleAddArrayItem("exclusions_en")} className="mt-2 text-blue-500 hover:text-blue-700 font-medium">
                                                    <FaPlus className="inline-block mr-1" /> Add Exclusions EN
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                                {/* --- AKHIR INPUT BAHASA --- */}

                                {/* Bagian Harga (di luar tab bahasa) */}
                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Harga Dewasa Domestik</label>
                                        <input type="number" name="price_domestic_adult" value={formData.price_domestic_adult} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Harga Anak Domestik</label>
                                        <input type="number" name="price_domestic_child" value={formData.price_domestic_child} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Harga Dewasa Asing</label>
                                        <input type="number" name="price_foreigner_adult" value={formData.price_foreigner_adult} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Harga Anak Asing</label>
                                        <input type="number" name="price_foreigner_child" value={formData.price_foreigner_child} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
                                    </div>
                                </div>


                                {/* Bagian Gambar (di luar tab bahasa) */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Gambar Tur</label>

                                    {/* Preview gambar yang sudah ada (existingImages) */}
                                    {formData.existingImages.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2 border p-2 rounded-md bg-gray-50">
                                            <p className="w-full text-xs text-gray-500">Gambar Tersimpan (Klik X untuk hapus sebelum disimpan)</p>
                                            {formData.existingImages.map((image, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={`${API_URL}${image}`}
                                                        alt={`Gambar existing ${index + 1}`}
                                                        className="w-24 h-24 object-cover rounded-md border border-gray-300"
                                                    />
                                                    <button type="button" onClick={() => handleRemoveExistingImage(image)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-transform hover:scale-110"> <FaTimes className="w-4 h-4" /> </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <input
                                        type="file"
                                        name="images"
                                        onChange={handleImageChange}
                                        className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        multiple
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {Array.from(formData.images).map((file, index) => (
                                            <div key={index}
                                                className="relative">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`Preview ${index + 1}`}
                                                    className="w-24 h-24 object-cover rounded-md border border-dashed border-blue-400"
                                                />
                                                <button type="button" onClick={() => handleRemoveNewImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-transform hover:scale-110"> <FaTimes className="w-4 h-4" /> </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button type="button" onClick={resetForm} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"> Batal </button>
                                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"> {formData.id ?
                                    "Simpan Perubahan" : "Tambah Tur"} </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourManagement;