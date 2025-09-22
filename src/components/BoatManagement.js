import React, { useState, useEffect } from "react";
import swal from "sweetalert";
import axios from "axios";
import './BoatManagement.css'

const BoatManagement = ({ serviceType, title }) => {
    const [filteredBoats, setFilteredBoats] = useState([]);
    const [boatName, setBoatName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [image, setImage] = useState(null);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [currentServiceType, setCurrentServiceType] = useState(serviceType);

    const API_URL = "https://api.seaboat.my.id";

    useEffect(() => {
        const fetchAndFilterBoats = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(`${API_URL}/api/boats`);
                const filtered = data.filter(boat => boat.service_type === serviceType);
                setFilteredBoats(filtered);
            } catch (err) {
                console.error(`Error fetching boats for service_type ${serviceType}:`, err);
                swal("Gagal", "Tidak dapat mengambil data kapal. Cek koneksi server.", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchAndFilterBoats();
    }, [serviceType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!boatName || !capacity) {
            swal("Gagal!", "Nama kapal & kapasitas wajib diisi", "error");
            return;
        }

        const formData = new FormData();
        formData.append("boat_name", boatName);
        formData.append("capacity", capacity);
        formData.append("service_type", currentServiceType);
        if (image) formData.append("image", image);

        try {
            swal({
                title: "Mohon tunggu...",
                text: "Sedang menyimpan data kapal",
                buttons: false,
                closeOnClickOutside: false,
                closeOnEsc: false,
            });

            if (editId) {
                await axios.put(`${API_URL}/api/boats/${editId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "Kapal berhasil diperbarui", "success");
            } else {
                await axios.post(`${API_URL}/api/boats`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "Kapal berhasil ditambahkan", "success");
            }

            resetForm();
            const { data } = await axios.get(`${API_URL}/api/boats`);
            const filtered = data.filter(boat => boat.service_type === serviceType);
            setFilteredBoats(filtered);
        } catch (err) {
            console.error("Error saving boat:", err);
            swal("Gagal!", "Terjadi kesalahan saat menyimpan data. Pastikan semua data valid.", "error");
        }
    };

    const handleEdit = (boat) => {
        setEditId(boat.boat_id);
        setBoatName(boat.boat_name);
        setCapacity(boat.capacity);
        setShowForm(true);
        setCurrentServiceType(boat.service_type);
    };

    const handleDelete = async (id) => {
        swal({
            title: "Apakah kamu yakin?",
            text: "Data kapal yang dihapus tidak bisa dikembalikan!",
            icon: "warning",
            buttons: ["Batal", "Ya, Hapus!"],
            dangerMode: true,
        }).then(async (willDelete) => {
            if (willDelete) {
                swal({
                    title: "Menghapus...",
                    text: "Mohon tunggu sebentar",
                    buttons: false,
                    closeOnClickOutside: false,
                    closeOnEsc: false,
                    content: {
                        element: "div",
                        attributes: {
                            innerHTML: `<img src="https://res.cloudinary.com/dgsdmgcc7/image/upload/v1755188126/spinner-icon-gif-10_b1hqoa.gif" width="60" />`,
                        },
                    },
                });

                try {
                    await axios.delete(`${API_URL}/api/boats/${id}`);
                    swal("Sukses!", "Kapal berhasil dihapus", "success");
                    const { data } = await axios.get(`${API_URL}/api/boats`);
                    const filtered = data.filter(boat => boat.service_type === serviceType);
                    setFilteredBoats(filtered);

                    if (editId === id) {
                        setEditId(null);
                        setBoatName("");
                        setCapacity("");
                        setShowForm(false);
                    }
                } catch (err) {
                    console.error("Error deleting boat:", err);
                    swal("Gagal!", "Terjadi kesalahan saat menghapus kapal", "error");
                }
            }
        });
    };

    const resetForm = () => {
        setBoatName("");
        setCapacity("");
        setImage(null);
        setEditId(null);
        setShowForm(false);
        setCurrentServiceType(serviceType);
    };

    return (
        <div className="container pt-20">
            <h3 className="mb-3">{title}</h3>
            <button
                className="btn btn-success mb-3"
                onClick={() => {
                    setShowForm(true);
                    setEditId(null);
                    setBoatName("");
                    setCapacity("");
                    setImage(null);
                    setCurrentServiceType(serviceType);
                }}
            >
                Tambah Kapal
            </button>
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h4>{editId ? "Edit Kapal" : "Tambah Kapal"}</h4>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group mb-2">
                                <label>Nama Kapal</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={boatName}
                                    onChange={(e) => setBoatName(e.target.value)}
                                />
                            </div>
                            <div className="form-group mb-2">
                                <label>Kapasitas (Kursi)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                />
                            </div>
                            <div className="form-group mb-2">
                                <label>Jenis Layanan</label>
                                <select
                                    className="form-control"
                                    value={currentServiceType}
                                    onChange={(e) => setCurrentServiceType(e.target.value)}
                                >
                                    <option value="jukung">Kapal Seaboat</option>
                                    <option value="tiketboat">Kapal Tiketboat</option>
                                    <option value="carharbour">Car Harbour</option>
                                </select>
                            </div>
                            <div className="form-group mb-2">
                                <label>Gambar Kapal</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => setImage(e.target.files[0])}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary">
                                {editId ? "Update" : "Simpan"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary ms-2 ml-2"
                                onClick={resetForm}
                            >
                                Batal
                            </button>
                        </form>
                    </div>
                </div>
            )}
            <div className="row">
                {loading ? (
                    <div className="col-12 text-center my-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden"></span>
                        </div>
                        <p className="mt-2">Mengambil data kapal...</p>
                    </div>
                ) : filteredBoats.length > 0 ? (
                    filteredBoats.map((boat) => (
                        <div className="col-md-4 mb-4" key={boat.boat_id}>
                            <div className="card shadow-sm h-100">
                                {boat.image_url ? (
                                    <img
                                        src={`${API_URL}${boat.image_url.startsWith("/") ? boat.image_url : "/" + boat.image_url}`}
                                        alt={boat.boat_name}
                                        className="card-img-top"
                                        style={{ height: "200px", objectFit: "cover" }}
                                    />
                                ) : (
                                    <div
                                        style={{
                                            height: "200px",
                                            background: "#f0f0f0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#888",
                                        }}
                                    >
                                        Tidak ada gambar
                                    </div>
                                )}
                                <div className="card-body text-center">
                                    <h5 className="card-title">{boat.boat_name}</h5>
                                    <p className="card-text">Kapasitas: {boat.capacity} kursi</p>
                                    <p className="card-text">Service Type: {boat.service_type}</p>
                                    <button
                                        className="btn btn-sm btn-warning me-2"
                                        onClick={() => handleEdit(boat)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger ml-2"
                                        onClick={() => handleDelete(boat.boat_id)}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center">
                        <p>Tidak ada data kapal</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BoatManagement;