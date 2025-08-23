// Contoh file konfigurasi Axios Anda (misalnya: src/api/axios.js)
import axios from 'axios';
import swal from 'sweetalert';

const instance = axios.create({
    baseURL: 'https://maruti.linku.co.id/api',
});

// Tambahkan interceptor untuk respons
instance.interceptors.response.use(
    (response) => {
        // Jika respons sukses, kembalikan saja
        return response;
    },
    (error) => {
        // Ambil status kode dari respons error
        const status = error.response ? error.response.status : null;

        // --- BAGIAN PENTING YANG HARUS DIUBAH ---
        if (status === 401) {
            // Ini adalah kesalahan otentikasi. Token tidak valid atau kedaluwarsa.
            // Arahkan pengguna ke halaman login dan hapus token.
            swal({
                title: "Sesi Habis",
                text: "Sesi Anda telah berakhir. Silakan login kembali.",
                icon: "warning",
                button: "OK",
            }).then(() => {
                // Hapus token dari localStorage
                localStorage.removeItem('token');
                // Arahkan ke halaman login
                window.location.href = '/login';
            });
            // Kembalikan Promise.reject agar blok catch lokal tidak ikut dieksekusi
            return Promise.reject(error);
        } else if (status === 409) {
            // Ini adalah konflik data (misalnya: kode agen duplikat).
            // Jangan hapus token atau logout. Biarkan blok catch lokal yang menanganinya.
            return Promise.reject(error);
        } else if (status === 500) {
            // Penanganan error server umum
            swal("Error", "Terjadi kesalahan pada server. Silakan coba lagi nanti.", "error");
            return Promise.reject(error);
        }

        // Untuk semua error lainnya, kembalikan saja.
        return Promise.reject(error);
    }
);

export default instance;