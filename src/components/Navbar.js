import React from "react";
import { FaUserCircle } from "react-icons/fa";

function Navbar() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-end items-center">
                {/* Di sini Anda bisa menambahkan elemen lain seperti logo atau judul di kiri */}
                {/* Tombol atau Ikon Akun di pojok kanan */}
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