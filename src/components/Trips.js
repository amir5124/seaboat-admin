import React, { useState, useEffect, useMemo } from "react";
import { useParams } from 'react-router-dom';
import axios from "axios";
import swal from "sweetalert";
import { Modal } from 'react-bootstrap';

// URL API. Disarankan tanpa /api di belakang
const API_URL = "https://api.seaboat.my.id";

// --------------------------------------------------------
// --- STRUKTUR DATA RUTE BERDASARKAN REMARK (HARDCODED) ---
// --------------------------------------------------------

// Data untuk Harbour Transfer (Remark: HARBOUR)
const pickupAreas = {
    'Bali': [
        'Sanur, East & South Denpasar',
        'West & North Denpasar',
        'Kuta, Seminyak, Legian, Kerobokan',
        'Jimbaran',
        'Nusa Dua, Ungasan',
        'Uluwatu',
        'Canggu, Pererenan',
        'Ubud Center',
        'Tegalalang',
        'Tanah Lot, Kedungu',
        'Payangan'
    ],
    'Harbor in Bali': [
        'Sanur Harbour',
        'Padang Bai Harbour',
        'Kusamba Harbour',
        'Serangan Harbour'
    ],
};
const baliAreas = pickupAreas['Bali'];
const baliHarbors = pickupAreas['Harbor in Bali'];

// Data untuk Seaboat (Remark: Direct)
const seaboatRoutesList = ['Canggu', 'Uluwatu', 'Jimbaran'];

// Data untuk Tiketboat (Remark: TIKETBOAT)
const harborRoutes = {
    'Bali': ['Sanur', 'Kusamba', 'Padang Bai', 'Serangan'],
    'Nusa Penida': ['Banjar Nyuh', 'Sampalan', 'Buyuk'],
    'Gili Islands / Lombok': ['Gili Trawangan', 'Gili Air', 'Bangsal', 'Senggigi', 'Gili Meno'],
    'Nusa Ceningan': ['Bias Munjul'],
    'Lembongan': ['Jungut Batu', 'Mushroom Bay', 'Yellow Bridge', 'Telatak'],
    'Gili Gede': ['Gili Gede'],
};
const routeRules = {
    // Bali
    'Sanur': ['Gili Islands / Lombok', 'Lembongan', 'Nusa Penida'],
    'Kusamba': ['Lembongan', 'Nusa Ceningan', 'Nusa Penida'],
    'Padang Bai': ['Gili Islands / Lombok', 'Lembongan', 'Nusa Penida'],
    'Serangan': ['Gili Gede', 'Gili Islands / Lombok', 'Lembongan', 'Nusa Penida'],

    // Nusa Penida
    'Banjar Nyuh': ['Bali', 'Gili Islands / Lombok', 'Lembongan'],
    'Sampalan': ['Bali', 'Gili Islands / Lombok'],
    'Buyuk': ['Bali', 'Gili Gede', 'Gili Islands / Lombok'],

    // Gili Islands / Lombok
    'Gili Trawangan': ['Bali', 'Lembongan', 'Nusa Penida'],
    'Gili Air': ['Bali', 'Lembongan', 'Nusa Penida'],
    'Bangsal': ['Bali', 'Lembongan', 'Nusa Penida'],
    'Senggigi': ['Bali', 'Lembongan', 'Nusa Penida'],
    'Gili Meno': ['Bali', 'Lembongan', 'Nusa Penida'],

    // Nusa Ceningan
    'Bias Munjul': ['Bali', 'Lembongan', 'Nusa Penida'],

    // Lembongan
    'Jungut Batu': ['Bali', 'Gili Islands / Lombok'],
    'Mushroom Bay': ['Bali', 'Gili Islands / Lombok'],
    'Yellow Bridge': ['Bali', 'Gili Islands / Lombok', 'Nusa Penida'],
    'Telatak': ['Bali'],

    // Gili Gede
    'Gili Gede': ['Bali', 'Nusa Penida'],
};

// --------------------------------------------------------
// --- FUNGSI UTILITY RUTE DINAMIS ---
// --------------------------------------------------------

const generateHarbourRoutes = (areas, harbors) => {
    const routes = [];
    areas.forEach(area => {
        harbors.forEach(harbor => {
            routes.push({ from: area, to: harbor });
            routes.push({ from: harbor, to: area });
        });
    });
    return routes;
};

const generateSeaboatRoutes = (list) => {
    const routes = [];
    for (let i = 0; i < list.length; i++) {
        for (let j = 0; j < list.length; j++) {
            if (i !== j) {
                routes.push({ from: list[i], to: list[j] });
            }
        }
    }
    return routes;
};

const generateTiketboatRoutes = (harbors, rules) => {
    const routes = [];

    for (const [originHarbor, allowedRegions] of Object.entries(rules)) {
        allowedRegions.forEach(region => {
            const destinations = harbors[region];

            if (destinations) {
                destinations.forEach(destHarbor => {
                    if (originHarbor !== destHarbor) {
                        routes.push({ from: originHarbor, to: destHarbor });
                    }
                });
            } else if (region === 'Bali') {
                harbors['Bali'].forEach(destHarbor => {
                    if (originHarbor !== destHarbor) {
                        routes.push({ from: originHarbor, to: destHarbor });
                    }
                });
            }
        });
    }

    const uniqueRoutesMap = {};
    routes.forEach(r => {
        uniqueRoutesMap[`${r.from}|${r.to}`] = r;
    });
    return Object.values(uniqueRoutesMap);
};

// --- FUNGSI UTILITY REMARK ---

const getDbRemarkValue = (urlRemarkType) => {
    switch (urlRemarkType?.toLowerCase()) {
        case 'seaboat':
            return 'Direct';
        case 'tiketboat':
            return 'TIKETBOAT';
        case 'harbour':
            return 'HARBOUR';
        default:
            return '';
    }
};

const getNormalizedRemarkName = (urlRemarkType) => {
    switch (urlRemarkType?.toLowerCase()) {
        case 'seaboat': return 'Direct';
        case 'tiketboat': return 'TIKETBOAT';
        case 'harbour': return 'HARBOUR';
        default: return 'Pilih Remark';
    }
};

// --------------------------------------------------------
// --- KOMPONEN UTAMA ---
// --------------------------------------------------------

const Trips = () => {
    const { remarkType } = useParams();

    // Nilai remark DB dan Display
    const dbRemarkValue = useMemo(() => getDbRemarkValue(remarkType), [remarkType]);
    const normalizedRemarkName = getNormalizedRemarkName(remarkType);

    // State Form
    const [templateData, setTemplateData] = useState({
        boat_id: "",
        trip_type: "",
        route_from: "",
        route_to: "",
        etd: "",
        eta: "",
        price: "",
        price_child_indo: "",
        price_adult_foreigner: "",
        price_child_foreigner: "",
        remark: dbRemarkValue
    });

    // State Data
    const [boats, setBoats] = useState([]);
    const [tripTemplates, setTripTemplates] = useState([]);
    const [loadingBoats, setLoadingBoats] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const isHarbourTransfer = normalizedRemarkName === 'HARBOUR';

    // Penentuan Rute Dinamis berdasarkan Remark Type
    const currentRoutes = useMemo(() => {
        if (normalizedRemarkName === 'HARBOUR') {
            return generateHarbourRoutes(baliAreas, baliHarbors);
        }
        if (normalizedRemarkName === 'Direct') {
            return generateSeaboatRoutes(seaboatRoutesList);
        }
        if (normalizedRemarkName === 'TIKETBOAT') {
            return generateTiketboatRoutes(harborRoutes, routeRules);
        }
        return [];
    }, [normalizedRemarkName]);

    // Konfigurasi Axios umum
    const axiosConfig = {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    };

    // --- Efek dan Fetch Data ---

    useEffect(() => {
        const fetchBoats = async () => {
            setLoadingBoats(true);
            try {
                const res = await axios.get(`${API_URL}/api/boats`, axiosConfig);
                setBoats(res.data);
            } catch (err) {
                console.error("Error fetching boats:", err);
                swal("Gagal!", "Tidak bisa mengambil data kapal", "error");
            } finally {
                setLoadingBoats(false);
            }
        };
        fetchBoats();
    }, []);

    const fetchTripTemplates = async () => {
        setLoadingTemplates(true);
        try {
            let url = `${API_URL}/api/trips/templates`;
            if (dbRemarkValue) {
                url = `${API_URL}/api/trips/templates?remark=${dbRemarkValue}`;
            }
            const res = await axios.get(url, axiosConfig);
            setTripTemplates(res.data);
        } catch (err) {
            console.error("Error fetching trip templates:", err.response?.data || err.message);
            swal("Gagal!", "Tidak bisa mengambil data templates. Cek konsol peramban.", "error");
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        fetchTripTemplates();

        // Reset state
        setTemplateData(prev => ({
            ...prev,
            trip_type: "", // Reset agar user selalu memilih
            remark: dbRemarkValue,
            route_from: "",
            route_to: ""
        }));
    }, [dbRemarkValue]);

    // --- Handler Form ---

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setTemplateData({
            ...templateData,
            [name]: type === 'number' ? (value === '' ? null : Number(value)) : value
        });
    };

    const handleRouteChange = (e) => {
        const [from, to] = e.target.value.split("|");
        setTemplateData({ ...templateData, route_from: from, route_to: to });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { boat_id, route_from, route_to, etd, eta, price, trip_type } = templateData;

        // Validasi wajib (trip_type sekarang selalu dicek)
        if (!boat_id || !route_from || !route_to || !etd || !eta || !price || !trip_type) {
            swal("Gagal!", "Data wajib diisi (Armada, Rute, Jam, Tipe Trip & Harga)", "error");
            return;
        }

        let submissionData = templateData;
        submissionData.remark = dbRemarkValue;

        if (isHarbourTransfer) {
            // Hapus data harga kapal (WNI/Asing) jika ini Harbour Transfer
            submissionData = {
                ...submissionData,
                price_child_indo: null,
                price_adult_foreigner: null,
                price_child_foreigner: null,
            };
        }

        try {
            swal({
                title: editingId ? "Mengupdate..." : "Menyimpan...", text: "Mohon tunggu sebentar",
                icon: "info", buttons: false, closeOnClickOutside: false, closeOnEsc: false
            });

            if (editingId) {
                await axios.put(`${API_URL}/api/trips/templates/${editingId}`, submissionData, axiosConfig);
                swal("Sukses!", "Template berhasil diperbarui", "success");
            } else {
                await axios.post(`${API_URL}/api/trips/templates`, submissionData, axiosConfig);
                swal("Sukses!", `Template ${route_from} - ${route_to} berhasil ditambahkan`, "success");
            }

            // Reset state
            setTemplateData({
                boat_id: "", trip_type: "", route_from: "", route_to: "", etd: "", eta: "",
                price: "", price_child_indo: "", price_adult_foreigner: "", price_child_foreigner: "",
                remark: dbRemarkValue
            });
            setShowModal(false);
            setEditingId(null);
            fetchTripTemplates();
        } catch (err) {
            console.error("Error submitting template:", err.response?.data || err.message);
            swal("Gagal!", "Tidak bisa menyimpan template. Cek koneksi atau detail error.", "error");
        }
    };

    const handleEdit = (template) => {
        setTemplateData({
            boat_id: template.boat_id, trip_type: template.trip_type, route_from: template.route_from,
            route_to: template.route_to, etd: template.etd?.substring(0, 5) || "", eta: template.eta?.substring(0, 5) || "",
            price: template.price, price_child_indo: template.price_child_indo || "",
            price_adult_foreigner: template.price_adult_foreigner || "",
            price_child_foreigner: template.price_child_foreigner || "",
            remark: template.remark || ""
        });
        setEditingId(template.template_id);
        setShowModal(true);
    };

    const handleAddClick = () => {
        setTemplateData({
            boat_id: "", trip_type: "", route_from: "", route_to: "", etd: "", eta: "",
            price: "", price_child_indo: "", price_adult_foreigner: "", price_child_foreigner: "",
            remark: dbRemarkValue
        });
        setEditingId(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setTemplateData({
            boat_id: "", trip_type: "", route_from: "", route_to: "", etd: "", eta: "",
            price: "", price_child_indo: "", price_adult_foreigner: "", price_child_foreigner: "",
            remark: dbRemarkValue
        });
    };

    const handleDelete = async (templateId) => {
        const confirm = await swal({
            title: "Hapus Template?", text: "Ini akan menghapus template jadwal dan tidak bisa dikembalikan!",
            icon: "warning", buttons: ["Batal", "Ya, Hapus!"], dangerMode: true
        });

        if (!confirm) return;

        try {
            await axios.delete(`${API_URL}/api/trips/templates/${templateId}`, axiosConfig);
            swal("Sukses!", "Template berhasil dihapus", "success");
            fetchTripTemplates();
            if (editingId === templateId) handleCloseModal();
        } catch (err) {
            console.error("Error deleting template:", err.response?.data || err.message);
            swal("Gagal!", "Tidak bisa menghapus template", "error");
        }
    };

    // --- Utility Display ---

    const formatPrice = (price) => {
        return price ? `Rp ${parseInt(price).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}` : "-";
    };

    const getTitle = () => {
        switch (normalizedRemarkName) {
            case 'Direct': return 'Trip Seaboat';
            case 'TIKETBOAT': return 'Trip Tiketboat';
            case 'HARBOUR': return 'Trip Harbour Transfer';
            default: return 'Manajemen Trip';
        }
    };



    return (
        <div className="container pt-20">
            <h3>{getTitle()}</h3>

            <button
                className="btn btn-primary mt-2 mb-3"
                onClick={handleAddClick}
            >
                Tambah Template Trip
            </button>

            {/* --- Modal untuk Form Tambah/Edit --- */}
            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editingId ? "Edit Template Trip" : "Tambah Template Trip"}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit} className="card card-body shadow-sm">

                        <div className="form-group">
                            <label>{isHarbourTransfer ? 'Nama Mobil' : 'Nama Kapal'}</label>
                            <select
                                className="form-control"
                                name="boat_id"
                                value={templateData.boat_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- Pilih Armada --</option>
                                {loadingBoats ? (
                                    <option disabled>Memuat...</option>
                                ) : (
                                    boats.map((boat) => (
                                        <option key={boat.boat_id} value={boat.boat_id}>
                                            {boat.boat_name}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        {/* Tipe Trip: Selalu ditampilkan dan wajib diisi */}
                        <div className="form-group">
                            <label>Tipe Trip</label>
                            <select
                                className="form-control"
                                name="trip_type"
                                value={templateData.trip_type}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- Pilih Tipe Trip --</option>
                                <option value="one_way">One Way</option>
                                <option value="return">Return</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Rute ({currentRoutes.length} Rute Tersedia)</label>
                            <select
                                className="form-control"
                                onChange={handleRouteChange}
                                value={
                                    templateData.route_from && templateData.route_to
                                        ? `${templateData.route_from}|${templateData.route_to}`
                                        : ""
                                }
                                required
                            >
                                <option value="">-- Pilih Rute --</option>
                                {currentRoutes.map((r, idx) => (
                                    <option key={idx} value={`${r.from}|${r.to}`}>
                                        {r.from} → {r.to}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Jam Keberangkatan (ETD)</label>
                            <input
                                type="time"
                                className="form-control"
                                name="etd"
                                value={templateData.etd}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Jam Tiba (ETA)</label>
                            <input
                                type="time"
                                className="form-control"
                                name="eta"
                                value={templateData.eta}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* --- Input Fields Harga Dinamis --- */}
                        <div className="form-group">
                            <label>
                                {isHarbourTransfer ? 'Harga Per Mobil (Per Trip Type)' : 'Harga Dewasa (WNI)'}
                            </label>
                            <input
                                type="number"
                                className="form-control"
                                name="price"
                                value={templateData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {!isHarbourTransfer && (
                            <>
                                <div className="form-group">
                                    <label>Harga Anak (WNI)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="price_child_indo"
                                        value={templateData.price_child_indo}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Harga Dewasa (Asing)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="price_adult_foreigner"
                                        value={templateData.price_adult_foreigner}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Harga Anak (Asing)</label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="price_child_foreigner"
                                        value={templateData.price_child_foreigner}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Remark</label>
                            <input
                                type="text"
                                className="form-control"
                                name="remark"
                                value={normalizedRemarkName}
                                disabled={true}
                            />
                        </div>
                        <div className="mt-3">
                            <button type="submit" className="btn btn-success me-2">
                                {editingId ? "Update" : "Simpan"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCloseModal}
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            {/* --- Tampilan Daftar Template (Tanda Bintang/Bold Dihilangkan) --- */}
            <h3 className="mt-5">Daftar Trip Templates</h3>
            {loadingTemplates ? (
                <div className="text-center mt-3">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p>Sedang mengambil data templates...</p>
                </div>
            ) : (
                <div className="row mt-3">
                    {tripTemplates.length > 0 ? (
                        tripTemplates.map((template) => (
                            <div className="col-md-4" key={template.template_id}>
                                <div className="card mb-3 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title">{template.boat_name}</h5>
                                        <p className="card-text">
                                            Tipe: {template.trip_type || '-'}<br />
                                            Rute: {template.route_from} → {template.route_to}<br />
                                            Jam: {template.etd?.substring(0, 5)} - {template.eta?.substring(0, 5)}<br />
                                            Kapasitas: {template.capacity} kursi<br />

                                            {isHarbourTransfer ? (
                                                <>Harga Per Mobil: {formatPrice(template.price)}</>
                                            ) : (
                                                <>
                                                    Harga Dewasa (WNI): {formatPrice(template.price)}<br />
                                                    Harga Anak (WNI): {formatPrice(template.price_child_indo)}<br />
                                                    Harga Dewasa (Asing): {formatPrice(template.price_adult_foreigner)}<br />
                                                    Harga Anak (Asing): {formatPrice(template.price_child_foreigner)}
                                                </>
                                            )}
                                            <br />
                                            Remark: {template.remark || "-"}
                                        </p>
                                        <button
                                            className="btn btn-primary btn-sm me-2"
                                            onClick={() => handleEdit(template)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(template.template_id)}
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Belum ada data template untuk remark **{normalizedRemarkName}**.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Trips;