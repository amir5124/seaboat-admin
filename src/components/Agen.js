import React, { useState, useEffect } from "react";
import swal from "sweetalert";
import axios from "../api/axios.js";

const Agen = () => {
    const [agens, setAgens] = useState([]);
    const [nama, setNama] = useState("");
    const [kodeAgen, setKodeAgen] = useState("");
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);

    const API_URL = "https://maruti.linku.co.id"; // ganti sesuai API kamu

    useEffect(() => {
        fetchAgens();
    }, []);

    const fetchAgens = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`${API_URL}/api/agens`);
            setAgens(data);
        } catch (err) {
            console.error("Error fetching agens:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nama || !kodeAgen) {
            swal("Gagal!", "Nama dan Kode Agen wajib diisi", "error");
            return;
        }

        const payload = { nama, kode_agen: kodeAgen };

        try {
            swal({
                title: "Mohon tunggu...",
                text: editId ? "Sedang memperbarui data agen" : "Sedang menyimpan data agen",
                buttons: false,
                closeOnClickOutside: false,
                closeOnEsc: false,
                content: {
                    element: "div",
                    attributes: {
                        // Gunakan inline CSS dengan Flexbox untuk menengahkan
                        style: 'display: flex; justify-content: center; align-items: center;',
                        innerHTML:
                            '<img src="https://res.cloudinary.com/dgsdmgcc7/image/upload/v1755188126/spinner-icon-gif-10_b1hqoa.gif" style="width:50px; height:50px;" />',
                    },
                },
            });

            if (editId) {
                await axios.put(`${API_URL}/api/agens/${editId}`, payload);
                swal("Sukses!", "Data agen berhasil diperbarui", "success");
            } else {
                await axios.post(`${API_URL}/api/agens`, payload);
                swal("Sukses!", "Agen berhasil ditambahkan", "success");
            }

            resetForm();
            fetchAgens();
        } catch (err) {
            console.error("Error saving agen:", err);

            // --- BAGIAN INI YANG DITAMBAHKAN/DIUBAH ---
            if (err.response && err.response.data && err.response.data.error) {
                // Asumsi backend mengirim pesan kesalahan dalam format { "error": "Duplicate entry..." }
                const errorMessage = err.response.data.error;

                if (errorMessage.includes('Duplicate entry') && errorMessage.includes('kode_agen')) {
                    swal("Gagal!", "Kode agen '" + kodeAgen + "' sudah ada. Silakan gunakan kode lain.", "error");
                } else {
                    swal("Gagal!", "Terjadi kesalahan: " + errorMessage, "error");
                }
            } else {
                // Menangani error umum jika tidak ada respons dari server
                swal("Gagal!", "Tidak bisa terhubung ke server. Silakan coba lagi nanti.", "error");
            }
            // ------------------------------------------
        }
    };

    const handleEdit = (agen) => {
        setEditId(agen.id);
        setNama(agen.nama);
        setKodeAgen(agen.kode_agen);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        swal({
            title: "Apakah kamu yakin?",
            text: "Data agen yang dihapus tidak bisa dikembalikan!",
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
                            innerHTML:
                                '<img src="https://res.cloudinary.com/dgsdmgcc7/image/upload/v1755188126/spinner-icon-gif-10_b1hqoa.gif" width="60" />',
                        },
                    },
                });

                try {
                    await axios.delete(`${API_URL}/api/agens/${id}`);
                    swal("Sukses!", "Agen berhasil dihapus", "success");
                    fetchAgens();
                    if (editId === id) resetForm();
                } catch (err) {
                    console.error("Error deleting agen:", err);
                    swal("Gagal!", "Tidak bisa menghapus agen", "error");
                }
            }
        });
    };

    const resetForm = () => {
        setNama("");
        setKodeAgen("");
        setEditId(null);
        setShowForm(false);
    };

    return (
        <div className="container pt-20">
            <h3 className="mb-3">Manajemen Agen</h3>

            <button
                className="btn btn-success mb-3"
                onClick={() => setShowForm(true)}
            >
                Tambah Agen
            </button>

            {showForm && (
                <div className="card mb-4 p-3">
                    <h4>{editId ? "Edit Agen" : "Tambah Agen"}</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group mb-2">
                            <label>Nama Agen</label>
                            <input
                                type="text"
                                className="form-control"
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                            />
                        </div>
                        <div className="form-group mb-2">
                            <label>Kode Agen</label>
                            <input
                                type="text"
                                className="form-control"
                                value={kodeAgen}
                                onChange={(e) => setKodeAgen(e.target.value)}
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
                        <p className="mt-2">Mengambil data agen...</p>
                    </div>
                ) : agens.length > 0 ? (
                    agens.map((agen) => (
                        <div className="col-md-4 mb-4" key={agen.id}>
                            <div className="card shadow-sm h-100">
                                <div className="card-body text-center">
                                    <h5 className="card-title">{agen.nama}</h5>
                                    <p className="card-text">Kode: {agen.kode_agen}</p>

                                    <button
                                        className="btn btn-sm btn-danger ml-2"
                                        onClick={() => handleDelete(agen.id)}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center">
                        <p>Tidak ada data agen</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Agen;