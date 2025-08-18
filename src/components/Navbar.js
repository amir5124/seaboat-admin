import React, { useState } from "react";
import { FaUserCircle } from "react-icons/fa"; // Icon akun dari react-icons

const Navbar = () => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <nav className="bg-white shadow-md px-4 py-2 flex justify-between items-center">
            {/* Logo / Judul Navbar */}
            <div className="text-xl font-bold text-gray-800">Boat Admin</div>

            {/* Icon akun di kanan */}
            <div className="relative">
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none"
                >
                    <FaUserCircle size={28} />
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        <ul>
                            <li>
                                <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    Profile
                                </button>
                            </li>
                            <li>
                                <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    Settings
                                </button>
                            </li>
                            <li>
                                <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                                    Logout
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
