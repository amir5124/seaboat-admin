import React, { useState, useEffect, useRef } from "react";
import { FaUserCircle, FaBars } from "react-icons/fa";

// Terima `toggle`, `isSidebarOpen`, dan `onLogout` sebagai props
function Navbar({ toggle, isSidebarOpen, onLogout }) {
    // --- State untuk mengontrol tampilan dropdown ---
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // --- Ref untuk mendeteksi klik di luar dropdown ---
    const dropdownRef = useRef(null);

    // Fungsi untuk menutup dropdown
    const closeDropdown = () => {
        setIsDropdownOpen(false);
    };

    // Efek untuk mendengarkan klik di luar dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };
        // Tambahkan event listener saat komponen di-mount
        document.addEventListener("mousedown", handleClickOutside);

        // Hapus event listener saat komponen di-unmount
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogoutClick = () => {
        closeDropdown();
        onLogout(); // Panggil fungsi onLogout dari prop
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">

                {/* 1. ELEMEN SISI KIRI: Tombol Hamburger (Mobile) dan Judul (Web) */}
                <div className="flex items-center">
                    {/* Tombol hamburger menu, hanya terlihat di layar kecil */}
                    <button
                        onClick={toggle}
                        className="text-gray-800 md:hidden"
                        aria-expanded={isSidebarOpen ? "true" : "false"}
                        aria-controls="sidebar-menu"
                    >
                        <FaBars size={24} />
                    </button>

                    {/* Judul, hanya terlihat di layar besar */}
                    {/* <h4 className="text-xl font-bold ml-20 hidden md:block">Maruti Admin</h4> */}
                </div>

                {/* 2. ELEMEN SISI KANAN: Ikon Admin dan Dropdown */}
                {/* --- Tambahkan ref dan posisi relatif untuk dropdown --- */}
                <div className="relative flex items-center space-x-2" ref={dropdownRef}>
                    <span className="text-gray-700 font-medium hidden md:block">Admin</span>

                    {/* --- Tombol untuk membuka/menutup dropdown --- */}
                    <button
                        className="text-gray-600 hover:text-gray-800 transition-colors"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <FaUserCircle size={28} />
                    </button>

                    {/* --- Dropdown Menu, hanya tampil jika isDropdownOpen true --- */}
                    {isDropdownOpen && (
                        <div className="absolute right-0 top-10 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <button
                                onClick={handleLogoutClick}
                                className="block px-4 py-2 text-sm text-gray-700 w-full text-left hover:bg-gray-100"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;