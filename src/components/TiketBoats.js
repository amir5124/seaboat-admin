import React, { useState, useEffect } from "react";
import swal from "sweetalert";
import axios from "axios";

const TiketBoats = () => {
    const [tiketBoats, setTiketBoats] = useState([]);
    const [boatName, setBoatName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [image, setImage] = useState(null);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);

    // Pastikan URL API sudah benar sesuai backend Anda.
    const API_URL = "https://api.seaboat.my.id";

    useEffect(() => {
        fetchTiketBoats();
    }, []);

    const fetchTiketBoats = async () => {
        try {
            setLoading(true);
            // SESUAIKAN ENDPOINT DENGAN YANG SUDAH KITA BUAT SEBELUMNYA
            const { data } = await axios.get(`${API_URL}/api/tiketboats`);
            setTiketBoats(data);
        } catch (err) {
            console.error("Error fetching tiket boats:", err);
            swal("Gagal", "Tidak dapat mengambil data kapal tiketboat. Cek koneksi server.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!boatName || !capacity) {
            swal("Gagal!", "Nama kapal & kapasitas wajib diisi", "error");
            return;
        }

        const formData = new FormData();
        formData.append("boat_name", boatName);
        formData.append("capacity", capacity);
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
                // SESUAIKAN ENDPOINT UNTUK UPDATE
                await axios.put(`${API_URL}/api/tiketboats/${editId}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "kapal berhasil diperbarui", "success");
            } else {
                // SESUAIKAN ENDPOINT UNTUK CREATE
                await axios.post(`${API_URL}/api/tiketboats`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                swal("Sukses!", "kapal berhasil ditambahkan", "success");
            }

            resetForm();
            fetchTiketBoats();
        } catch (err) {
            console.error("Error saving tiket boat:", err);
            swal("Gagal!", "Terjadi kesalahan saat menyimpan data. Pastikan semua data valid.", "error");
        }
    };

    const handleEdit = (tiketBoat) => {
        setEditId(tiketBoat.boat_id);
        setBoatName(tiketBoat.boat_name);
        setCapacity(tiketBoat.capacity);
        setShowForm(true);
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
                    // SESUAIKAN ENDPOINT UNTUK DELETE
                    await axios.delete(`${API_URL}/api/tiketboats/${id}`);
                    swal("Sukses!", "kapal berhasil dihapus", "success");
                    fetchTiketBoats();

                    if (editId === id) {
                        setEditId(null);
                        setBoatName("");
                        setCapacity("");
                        setShowForm(false);
                    }
                } catch (err) {
                    console.error("Error deleting tiket boat:", err);
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
    };

    return (
        <div className="container pt-20">
            <h3 className="mb-3">Manajemen kapal</h3>

            <button
                className="btn btn-success mb-3"
                onClick={() => {
                    setShowForm(true);
                    setEditId(null);
                    setBoatName("");
                    setCapacity("");
                    setImage(null);
                }}
            >
                Tambah kapal
            </button>

            {showForm && (
                <div className="card mb-4 p-3">
                    <h4>{editId ? "Edit kapal" : "Tambah kapal"}</h4>
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
            )}

            <div className="row">
                {loading ? (
                    <div className="col-12 text-center my-4">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden"></span>
                        </div>
                        <p className="mt-2">Mengambil data kapal...</p>
                    </div>
                ) : tiketBoats.length > 0 ? (
                    tiketBoats.map((tiketBoat) => (
                        <div className="col-md-4 mb-4" key={tiketBoat.boat_id}>
                            <div className="card shadow-sm h-100">
                                {tiketBoat.image_url ? (
                                    <img
                                        src={`${API_URL}${tiketBoat.image_url.startsWith("/") ? tiketBoat.image_url : "/" + tiketBoat.image_url}`}
                                        alt={tiketBoat.boat_name}
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
                                    <h5 className="card-title">{tiketBoat.boat_name}</h5>
                                    <p className="card-text">
                                        Kapasitas: {tiketBoat.capacity} kursi
                                    </p>
                                    <button
                                        className="btn btn-sm btn-warning me-2"
                                        onClick={() => handleEdit(tiketBoat)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger ml-2"
                                        onClick={() => handleDelete(tiketBoat.boat_id)}
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

export default TiketBoats;