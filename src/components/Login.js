// Login.js
import { useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function Login({ onLoginSuccess }) {
    const navigate = useNavigate();
    const [nama, setNama] = useState("");
    const [kodeAgen, setKodeAgen] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!nama || !kodeAgen) {
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "warning",
                title: "Nama dan kode agen wajib diisi",
                showConfirmButton: false,
                timer: 2000,
            });
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("https://maruti.linku.co.id/api/agens/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nama, kode_agen: kodeAgen }),
            });

            const data = await res.json();

            if (!res.ok) {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "error",
                    title: data.message || "Login gagal",
                    showConfirmButton: false,
                    timer: 2000,
                });
                return;
            }

            // --- PERUBAHAN DI SINI ---
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            localStorage.setItem("agen", JSON.stringify(data.agen));

            if (data.agen.role === 'admin') {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Login admin berhasil!",
                    showConfirmButton: false,
                    timer: 2000,
                });
            } else if (data.agen.role === 'agen') {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "success",
                    title: "Login agen berhasil!",
                    showConfirmButton: false,
                    timer: 2000,
                });
            } else {
                Swal.fire({
                    toast: true,
                    position: "top-end",
                    icon: "error",
                    title: "Anda tidak memiliki akses yang valid.",
                    showConfirmButton: false,
                    timer: 3000,
                });
                // Hentikan proses jika peran tidak valid
                return;
            }

            // Panggil prop ini untuk memberitahu komponen App bahwa login berhasil
            onLoginSuccess(data.agen.role);

            // Redirect ke halaman dashboard
            setTimeout(() => {
                navigate("/");
            }, 1500);

        } catch (err) {
            console.error(err);
            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Terjadi kesalahan server",
                showConfirmButton: false,
                timer: 2000,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 px-4">
            <div className="bg-white px-8 py-8 rounded-2xl shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Login Admin
                </h2>
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Nama Agen
                        </label>
                        <input
                            type="text"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Masukkan nama agen"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Kode Agen
                        </label>
                        <input
                            type="text"
                            value={kodeAgen}
                            onChange={(e) => setKodeAgen(e.target.value)}
                            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Masukkan kode agen"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-semibold shadow transition 
                            ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                    >
                        {loading ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0v4a8 8 0 100 16v-4l-3.5 3.5L12 24v-4a8 8 0 01-8-8z"
                                    ></path>
                                </svg>

                            </>
                        ) : (
                            "Login"
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}