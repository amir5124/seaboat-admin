import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import { FaTrash, FaEdit, FaPlus, FaTimes } from "react-icons/fa";

// Ganti dengan URL API backend Anda yang sebenarnya
const API_URL = "https://api.seaboat.my.id";

// --- Fungsi formatPrice tetap sama ---
const formatPrice = (price) => {
    // Memastikan harga adalah angka (atau string yang bisa dikonversi)
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || !price) return '0';

    return new Intl.NumberFormat('id-ID').format(numericPrice).replace(/,00$/, '');
};


const TourManagement = () => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Inisialisasi state formData
    const [formData, setFormData] = useState({
        id: null,
        name: "",
        service_type: "TOUR", // <--- Tambahkan service_type dengan default TOUR
        overview: "",
        highlights: [""],
        itinerary: [""],
        inclusions: [""],
        exclusions: [""],
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
            setTours(response.data);
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
        // Gabungkan file baru ke array images
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
            name: tour.name,
            service_type: tour.service_type || "TOUR", // <--- Pastikan service_type dimuat saat edit
            overview: tour.overview,
            highlights: tour.highlights || [""],
            itinerary: tour.trip_itinerary || [""], // Sesuaikan dengan nama kolom di model
            inclusions: tour.inclusions || [""],
            exclusions: tour.exclusions || [""],
            price_domestic_adult: tour.price_domestic_adult,
            price_domestic_child: tour.price_domestic_child,
            price_foreigner_adult: tour.price_foreigner_adult,
            price_foreigner_child: tour.price_foreigner_child,
            images: [],
            existingImages: tour.images || [],
        });
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
        data.append("name", formData.name);
        data.append("service_type", formData.service_type); // <--- Kirim service_type
        data.append("overview", formData.overview);

        // Stringify Array Data untuk backend
        data.append("highlights", JSON.stringify(formData.highlights.filter(item => item !== "")));
        data.append("itinerary", JSON.stringify(formData.itinerary.filter(item => item !== "")));
        data.append("inclusions", JSON.stringify(formData.inclusions.filter(item => item !== "")));
        data.append("exclusions", JSON.stringify(formData.exclusions.filter(item => item !== "")));

        data.append("price_domestic_adult", formData.price_domestic_adult);
        data.append("price_domestic_child", formData.price_domestic_child);
        data.append("price_foreigner_adult", formData.price_foreigner_adult);
        data.append("price_foreigner_child", formData.price_foreigner_child);

        // Append new image files
        for (let i = 0; i < formData.images.length; i++) {
            data.append("images", formData.images[i]);
        }

        // Append existing image URLs
        data.append("existingImages", JSON.stringify(formData.existingImages));

        // Tambahkan method override untuk PUT karena formData
        if (formData.id) {
            data.append("_method", "PUT");
        }


        try {
            if (formData.id) {
                // UPDATE: Gunakan axios.put() agar sesuai dengan Express router.put('/:id')
                await axios.put(`${API_URL}/api/tours/${formData.id}`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "Tur berhasil diperbarui.", "success");
            } else {
                // CREATE: Tetap gunakan axios.post()
                await axios.post(`${API_URL}/api/tours`, data, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "Tur berhasil ditambahkan.", "success");
            }
            setShowModal(false);
            fetchTours();
        } catch (error) {
            console.error("Error submitting form:", error);
            // Log error response dari server jika ada
            if (error.response && error.response.data) {
                console.error("Server Response:", error.response.data);
            }
            swal("Error", "Gagal menyimpan data tur. Cek koneksi API dan log server.", "error");
        }
    };

    const resetForm = () => {
        setFormData({
            id: null,
            name: "",
            service_type: "TOUR", // <--- Reset ke default TOUR
            overview: "",
            highlights: [""],
            itinerary: [""],
            inclusions: [""],
            exclusions: [""],
            price_domestic_adult: "",
            price_domestic_child: "",
            price_foreigner_adult: "",
            price_foreigner_child: "",
            images: [],
            existingImages: [],
        });
        setShowModal(false);
    };

    // --- Tampilan Komponen Tetap Sama ---

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
                    <span className="ml-3 text-gray-600">Memuat data...</span>
                </div>
            ) : (
                // Wrapper overflow-x-auto untuk tabel responsif di mobile
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">Nama Tur</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Tipe Layanan</th> {/* <--- Tambahkan kolom Tipe Layanan */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Harga Dewasa (Domestik)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tours.map((tour) => (
                                <tr key={tour.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tour.name}</td>

                                    {/* Tampilan Tipe Layanan */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tour.service_type === 'FISHING' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>
                                            {tour.service_type}
                                        </span>
                                    </td>

                                    {/* Tampilan Harga dengan format Rupiah */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        Rp {formatPrice(tour.price_domestic_adult)}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {tour.images && tour.images.slice(0, 3).map((image, index) => (
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
                            <h2 className="text-2xl font-semibold text-gray-800">{formData.id ? "Edit Paket Tur" : "Tambah Paket Tur"}</h2>
                            <button onClick={resetForm} className="text-gray-500 hover:text-gray-800">
                                <FaTimes className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {/* Detail Utama */}
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700">Nama Tur</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div className="col-span-1"> {/* <--- Tambahkan input service_type */}
                                    <label className="block text-sm font-medium text-gray-700">Tipe Layanan</label>
                                    <select
                                        name="service_type"
                                        value={formData.service_type}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
                                        required
                                    >
                                        <option value="TOUR">TOUR</option>
                                        <option value="FISHING">FISHING</option>

                                    </select>
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Overview</label>
                                    <textarea
                                        name="overview"
                                        value={formData.overview}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        rows="3"
                                        required
                                    ></textarea>
                                </div>

                                {/* Bagian Array Inputs (Highlights, Itinerary, Inclusions, Exclusions) */}
                                <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {/* Highlights */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                                        {formData.highlights.map((highlight, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={highlight}
                                                    onChange={(e) => handleArrayChange(e, index, "highlights")}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder={`Highlight ${index + 1}`}
                                                />
                                                {formData.highlights.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveArrayItem(index, "highlights")}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => handleAddArrayItem("highlights")}
                                            className="mt-2 text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            <FaPlus className="inline-block mr-1" /> Tambah Highlight
                                        </button>
                                    </div>

                                    {/* Itinerary */}
                                    <div>
                                        {/* Sesuaikan label agar lebih umum */}
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Itinerary / Detail Waktu/Durasi</label>
                                        {formData.itinerary.map((item, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleArrayChange(e, index, "itinerary")}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder={`Detail ${index + 1}`}
                                                />
                                                {formData.itinerary.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveArrayItem(index, "itinerary")}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => handleAddArrayItem("itinerary")}
                                            className="mt-2 text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            <FaPlus className="inline-block mr-1" /> Tambah Detail Waktu
                                        </button>
                                    </div>

                                    {/* Inclusions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions</label>
                                        {formData.inclusions.map((item, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleArrayChange(e, index, "inclusions")}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder={`Inclusions ${index + 1}`}
                                                />
                                                {formData.inclusions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveArrayItem(index, "inclusions")}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => handleAddArrayItem("inclusions")}
                                            className="mt-2 text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            <FaPlus className="inline-block mr-1" /> Tambah Inclusions
                                        </button>
                                    </div>

                                    {/* Exclusions */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions</label>
                                        {formData.exclusions.map((item, index) => (
                                            <div key={index} className="flex items-center space-x-2 mb-2">
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleArrayChange(e, index, "exclusions")}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder={`Exclusions ${index + 1}`}
                                                />
                                                {formData.exclusions.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveArrayItem(index, "exclusions")}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <FaTimes />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => handleAddArrayItem("exclusions")}
                                            className="mt-2 text-blue-500 hover:text-blue-700 font-medium"
                                        >
                                            <FaPlus className="inline-block mr-1" /> Tambah Exclusions
                                        </button>
                                    </div>
                                </div>

                                {/* Bagian Harga (2 kolom) */}
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


                                {/* Bagian Gambar */}
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
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveExistingImage(image)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-transform hover:scale-110"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Preview gambar baru yang diunggah */}
                                    {formData.images.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {formData.images.map((image, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={URL.createObjectURL(image)}
                                                        alt={`Gambar baru ${index + 1}`}
                                                        className="w-24 h-24 object-cover rounded-md border border-gray-300"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveNewImage(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transition-transform hover:scale-110"
                                                    >
                                                        <FaTimes size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input file */}
                                    <label className="mt-4 flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors duration-300">
                                        <FaPlus className="mr-2" />
                                        <span>Pilih atau Tambah Gambar</span>
                                        <input
                                            type="file"
                                            name="images"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            multiple
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                                >
                                    {formData.id ? "Simpan Perubahan" : "Buat Tur"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TourManagement;