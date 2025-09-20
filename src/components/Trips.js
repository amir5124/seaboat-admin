import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";
import { Modal } from 'react-bootstrap';

const API_URL = "https://api.seaboat.my.id";

const Trips = () => {
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
        remark: ""
    });
    const [boats, setBoats] = useState([]);
    const [tripTemplates, setTripTemplates] = useState([]);
    const [loadingBoats, setLoadingBoats] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const routes = [
        { from: "Canggu", to: "Uluwatu" },
        { from: "Uluwatu", to: "Canggu" },
        { from: "Canggu", to: "Jimbaran" },
        { from: "Jimbaran", to: "Canggu" },
        { from: "Sanur", to: "Banjar Nyuh" },
        { from: "Banjar Nyuh", to: "Sanur" },
        { from: "Sanur", to: "Buyuk" },
        { from: "Sanur", to: "Sampalan" },
        { from: "Nusa Penida", to: "Sanur" },
    ];

    useEffect(() => {
        const fetchBoats = async () => {
            setLoadingBoats(true);
            try {
                const res = await axios.get(`${API_URL}/api/boats`);
                setBoats(res.data);
            } catch (err) {
                console.error(err);
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
            const res = await axios.get(`${API_URL}/api/trips/templates`);
            setTripTemplates(res.data);
        } catch (err) {
            console.error(err);
            swal("Gagal!", "Tidak bisa mengambil data templates", "error");
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        fetchTripTemplates();
    }, []);

    const handleChange = (e) => {
        // Mengubah nilai string dari input number menjadi numerik
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
        const { boat_id, route_from, route_to, etd, eta, price } = templateData;
        if (!boat_id || !route_from || !route_to || !etd || !eta || !price) {
            swal("Gagal!", "Data wajib diisi (Kapal, Rute, Jam & Harga Dewasa WNI)", "error");
            return;
        }

        try {
            swal({
                title: editingId ? "Mengupdate..." : "Menyimpan...",
                text: "Mohon tunggu sebentar",
                icon: "info",
                buttons: false,
                closeOnClickOutside: false,
                closeOnEsc: false
            });

            if (editingId) {
                await axios.put(`${API_URL}/api/trips/templates/${editingId}`, templateData);
                swal("Sukses!", "Template berhasil diperbarui", "success");
            } else {
                await axios.post(`${API_URL}/api/trips/templates`, templateData);
                swal("Sukses!", `Template ${route_from} - ${route_to} berhasil ditambahkan`, "success");
            }

            setTemplateData({
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
                remark: ""
            });
            setShowModal(false);
            setEditingId(null);
            fetchTripTemplates();
        } catch (err) {
            console.error(err);
            swal("Gagal!", "Tidak bisa menyimpan template", "error");
        }
    };

    const handleEdit = (template) => {
        setTemplateData({
            boat_id: template.boat_id,
            trip_type: template.trip_type,
            route_from: template.route_from,
            route_to: template.route_to,
            etd: template.etd.substring(0, 5),
            eta: template.eta.substring(0, 5),
            price: template.price,
            price_child_indo: template.price_child_indo || "",
            price_adult_foreigner: template.price_adult_foreigner || "",
            price_child_foreigner: template.price_child_foreigner || "",
            remark: template.remark || ""
        });
        setEditingId(template.template_id);
        setShowModal(true);
    };

    const handleAddClick = () => {
        setTemplateData({
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
            remark: ""
        });
        setEditingId(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setTemplateData({
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
            remark: ""
        });
    };

    const handleDelete = async (templateId) => {
        const confirm = await swal({
            title: "Hapus Template?",
            text: "Ini akan menghapus template jadwal dan tidak bisa dikembalikan!",
            icon: "warning",
            buttons: ["Batal", "Ya, Hapus!"],
            dangerMode: true
        });

        if (!confirm) return;

        try {
            await axios.delete(`${API_URL}/api/trips/templates/${templateId}`);
            swal("Sukses!", "Template berhasil dihapus", "success");
            fetchTripTemplates();

            if (editingId === templateId) {
                setShowModal(false);
                setEditingId(null);
                setTemplateData({
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
                    remark: ""
                });
            }
        } catch (err) {
            console.error(err);
            swal("Gagal!", "Tidak bisa menghapus template", "error");
        }
    };

    const formatPrice = (price) => {
        return price ? `Rp ${parseInt(price).toLocaleString('id-ID', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        })}` : "-";
    };

    return (
        <div className="container pt-20">
            <h3>Manajemen Trip </h3>

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
                            <label>Nama Kapal</label>
                            <select
                                className="form-control"
                                name="boat_id"
                                value={templateData.boat_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">-- Pilih Kapal --</option>
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
                            <label>Rute</label>
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
                                {routes.map((r, idx) => (
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

                        {/* --- Tambah Input Fields Harga Baru --- */}
                        <div className="form-group">
                            <label>Harga Dewasa (WNI)</label>
                            <input
                                type="number"
                                className="form-control"
                                name="price"
                                value={templateData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
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

                        <div className="form-group">
                            <label>Remark</label>
                            <select
                                className="form-control"
                                name="remark"
                                value={templateData.remark}
                                onChange={handleChange}
                            >
                                <option value="">Pilih Remark</option>
                                <option value="Direct">SEABOAT</option>
                                <option value="TIKETBOAT">TIKETBOAT</option>
                            </select>
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
                                            Tipe: {template.trip_type}<br />
                                            Rute: {template.route_from} → {template.route_to}<br />
                                            Jam: {template.etd.substring(0, 5)} - {template.eta.substring(0, 5)}<br />
                                            Kapasitas: {template.capacity} kursi<br />
                                            Harga Dewasa (WNI): {formatPrice(template.price)}<br />
                                            Harga Anak (WNI): {formatPrice(template.price_child_indo)}<br />
                                            Harga Dewasa (Asing): {formatPrice(template.price_adult_foreigner)}<br />
                                            Harga Anak (Asing): {formatPrice(template.price_child_foreigner)}<br />
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
                        <p>Belum ada data template.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Trips;