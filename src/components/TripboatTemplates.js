import React, { useState, useEffect } from "react";
import axios from "axios";
import swal from "sweetalert";

// Sesuaikan URL API dengan yang sudah kita buat
const API_URL = "https://api.seaboat.my.id";

const TripboatTemplates = () => {
    // Sesuaikan state untuk menyimpan data template tiket kapal
    const [templateData, setTemplateData] = useState({
        boat_id: "",
        trip_type: "",
        route_from: "",
        route_to: "",
        etd: "",
        eta: "",
        price: "",
        remark: ""
    });
    // Menggunakan nama boats yang lebih spesifik untuk tiket kapal
    const [tiketBoats, setTiketBoats] = useState([]);
    const [tripboatTemplates, setTripboatTemplates] = useState([]);
    const [loadingTiketBoats, setLoadingTiketBoats] = useState(false);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Contoh rute, bisa disesuaikan
    const routes = [
        { from: "Sanur", to: "Banjar Nyuh" },
        { from: "Banjar Nyuh", to: "Sanur" },
        { from: "Canggu", to: "Jimbaran" },
        { from: "Jimbaran", to: "Canggu" }
    ];

    useEffect(() => {
        const fetchTiketBoats = async () => {
            setLoadingTiketBoats(true);
            try {
                // Endpoint untuk mengambil data kapal tiket
                const res = await axios.get(`${API_URL}/api/tiketboats`);
                setTiketBoats(res.data);
            } catch (err) {
                console.error(err);
                swal("Gagal!", "Tidak bisa mengambil data kapal tiket", "error");
            } finally {
                setLoadingTiketBoats(false);
            }
        };
        fetchTiketBoats();
    }, []);

    const fetchTripboatTemplates = async () => {
        setLoadingTemplates(true);
        try {
            // Endpoint yang sudah kita buat
            const res = await axios.get(`${API_URL}/api/tripboats/templates`);
            setTripboatTemplates(res.data);
        } catch (err) {
            console.error(err);
            swal("Gagal!", "Tidak bisa mengambil data templates", "error");
        } finally {
            setLoadingTemplates(false);
        }
    };

    useEffect(() => {
        fetchTripboatTemplates();
    }, []);

    const handleChange = (e) => {
        setTemplateData({ ...templateData, [e.target.name]: e.target.value });
    };

    const handleRouteChange = (e) => {
        const [from, to] = e.target.value.split("|");
        setTemplateData({ ...templateData, route_from: from, route_to: to });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { boat_id, route_from, route_to, etd, eta, price } = templateData;
        if (!boat_id || !route_from || !route_to || !etd || !eta || !price) {
            swal("Gagal!", "Data wajib diisi", "error");
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
                // Endpoint untuk update
                await axios.put(`${API_URL}/api/tripboats/templates/${editingId}`, templateData);
                swal("Sukses!", "Template berhasil diperbarui", "success");
            } else {
                // Endpoint untuk membuat
                await axios.post(`${API_URL}/api/tripboats/templates`, templateData);
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
                remark: ""
            });
            setShowForm(false);
            setEditingId(null);
            fetchTripboatTemplates();
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
            eta: template.eta ? template.eta.substring(0, 5) : "",
            price: template.price,
            remark: template.remark || ""
        });
        setEditingId(template.template_id);
        setShowForm(true);
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
            // Endpoint untuk delete
            await axios.delete(`${API_URL}/api/tripboats/templates/${templateId}`);
            swal("Sukses!", "Template berhasil dihapus", "success");
            fetchTripboatTemplates();

            if (editingId === templateId) {
                setShowForm(false);
                setEditingId(null);
                setTemplateData({
                    boat_id: "",
                    trip_type: "",
                    route_from: "",
                    route_to: "",
                    etd: "",
                    eta: "",
                    price: "",
                    remark: ""
                });
            }
        } catch (err) {
            console.error(err);
            swal("Gagal!", "Tidak bisa menghapus template", "error");
        }
    };

    return (
        <div className="container pt-20">
            <h3>Manajemen trip tiket boat</h3>

            <button
                className="btn btn-primary mt-2 mb-3"
                onClick={() => {
                    setShowForm(!showForm);
                    if (!showForm) {
                        setEditingId(null);
                        setTemplateData({
                            boat_id: "",
                            trip_type: "",
                            route_from: "",
                            route_to: "",
                            etd: "",
                            eta: "",
                            price: "",
                            remark: ""
                        });
                    }
                }}
            >
                {showForm ? "Tutup Form" : "Tambah Template trip tiket"}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="mt-3 card card-body shadow-sm">
                    <h5>{editingId ? "Edit Template Trip" : "Tambah Template Trip"}</h5>

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
                            {loadingTiketBoats ? (
                                <option disabled>Memuat...</option>
                            ) : (
                                tiketBoats.map((boat) => (
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
                        />
                    </div>

                    <div className="form-group">
                        <label>Harga</label>
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
                        <label>Remark</label>
                        <input
                            type="text"
                            className="form-control"
                            name="remark"
                            value={templateData.remark}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="btn btn-success">
                        {editingId ? "Update" : "Simpan"}
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary ms-2 ml-2"
                        onClick={() => {
                            setShowForm(false);
                            setEditingId(null);
                            setTemplateData({
                                boat_id: "",
                                trip_type: "",
                                route_from: "",
                                route_to: "",
                                etd: "",
                                eta: "",
                                price: "",
                                remark: ""
                            });
                        }}
                    >
                        Batal
                    </button>
                </form>
            )}

            <h3 className="mt-5">Daftar Trip Templates Tiket Boat</h3>

            {loadingTemplates ? (
                <div className="text-center mt-3">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p>Sedang mengambil data templates...</p>
                </div>
            ) : (
                <div className="row mt-3">
                    {tripboatTemplates.length > 0 ? (
                        tripboatTemplates.map((template) => (
                            <div className="col-md-4" key={template.template_id}>
                                <div className="card mb-3 shadow-sm">
                                    <div className="card-body">
                                        <h5 className="card-title">{template.boat_name}</h5>
                                        <p className="card-text">
                                            Tipe: {template.trip_type}<br />
                                            Rute: {template.route_from} → {template.route_to}<br />
                                            Jam: {template.etd.substring(0, 5)} - {template.eta ? template.eta.substring(0, 5) : '-'}<br />
                                            Kapasitas: {template.capacity} kursi<br />
                                            Harga: Rp {parseInt(template.price).toLocaleString('id-ID', {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0
                                            })}<br />
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
                        <p>Belum ada data template tiket boat.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default TripboatTemplates;