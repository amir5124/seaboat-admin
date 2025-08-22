import React from "react";
import { FaUserCircle, FaBars } from "react-icons/fa";

// Terima `toggle` dan `isSidebarOpen` sebagai props
function Navbar({ toggle, isSidebarOpen }) {
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

                {/* 2. ELEMEN SISI KANAN: Ikon Admin */}
                <div className="flex items-center space-x-2">
                    <span className="text-gray-700 font-medium hidden md:block">Admin</span>
                    <button className="text-gray-600 hover:text-gray-800 transition-colors">
                        <FaUserCircle size={28} />
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;