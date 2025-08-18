import React, { useState, useEffect } from "react";
import swal from "sweetalert";
import axios from "axios";

const Boats = () => {
    const [boats, setBoats] = useState([]);
    const [boatName, setBoatName] = useState("");
    const [capacity, setCapacity] = useState("");
    const [image, setImage] = useState(null);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false); // 👉 state untuk loading

    const API_URL = "https://maruti.linku.co.id";

    useEffect(() => {
        fetchBoats();
    }, []);

    const fetchBoats = async () => {
        try {
            setLoading(true); // mulai loading
            const { data } = await axios.get(`${API_URL}/api/boats`);
            setBoats(data);
        } catch (err) {
            console.error("Error fetching boats:", err);
        } finally {
            setLoading(false); // selesai loading
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
            // tampilkan loading swal
            swal({
                title: "Mohon tunggu...",
                text: "Sedang menyimpan data kapal",
                buttons: false,
                closeOnClickOutside: false,
                closeOnEsc: false,
                content: {
                    element: "div",
                    attributes: {
                        innerHTML: '<img src="https://res.cloudinary.com/dgsdmgcc7/image/upload/v1755188126/spinner-icon-gif-10_b1hqoa.gif" style="width:50px; height:50px;" />',
                    },
                },
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
            fetchBoats();
        } catch (err) {
            console.error("Error saving boat:", err);
            swal("Gagal!", "Tidak bisa terhubung ke server", "error");
        }
    };


    const handleEdit = (boat) => {
        setEditId(boat.boat_id);
        setBoatName(boat.boat_name);
        setCapacity(boat.capacity);
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
                // Tampilkan loading
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
                    fetchBoats();

                    // Tutup form edit kalau kapal yang dihapus adalah yang sedang di-edit
                    if (editId === id) {
                        setEditId(null);
                        setBoatName("");
                        setCapacity("");
                        setShowForm(false);
                    }
                } catch (err) {
                    console.error("Error deleting boat:", err);
                    swal("Gagal!", "Tidak bisa menghapus kapal", "error");
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
        <div className="container mt-4">
            <h3 className="mb-3">Manajement Kapal</h3>

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
                Tambah Kapal
            </button>

            {showForm && (
                <div className="card mb-4 p-3">
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
                        {/* Bootstrap spinner */}
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden"></span>
                        </div>
                        <p className="mt-2">Mengambil data kapal...</p>
                    </div>
                ) : boats.length > 0 ? (
                    boats.map((boat) => (
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
                                    <p className="card-text">
                                        Kapasitas: {boat.capacity} kursi
                                    </p>
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

export default Boats;
