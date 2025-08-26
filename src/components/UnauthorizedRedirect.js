// src/components/UnauthorizedRedirect.js

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const UnauthorizedRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        Swal.fire({
            icon: 'error',
            title: 'Akses Ditolak!',
            text: 'Anda tidak memiliki izin untuk mengakses halaman ini.',
            showConfirmButton: true,
            confirmButtonText: 'Kembali',
        }).then(() => {
            // Setelah pengguna menekan tombol "Kembali", arahkan ke dashboard
            navigate('/', { replace: true });
        });
    }, [navigate]);

    return null; // Komponen ini tidak merender UI, hanya menjalankan logika
};

export default UnauthorizedRedirect;