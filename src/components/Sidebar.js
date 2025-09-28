import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaTachometerAlt, FaShip, FaCaretDown, FaCaretUp, FaRoute, FaTimes, FaPlusCircle, FaGlobe } from "react-icons/fa"; // Tambahkan FaGlobe

function Sidebar({ isOpen, toggle, userRole }) {
    const [isFleetMenuOpen, setIsFleetMenuOpen] = useState(false);
    const [isTripMenuOpen, setIsTripMenuOpen] = useState(false);
    const [isTourMenuOpen, setIsTourMenuOpen] = useState(false); // State baru untuk menu tour
    const location = useLocation();

    // Fungsi untuk mengecek apakah path saat ini sesuai dengan link.
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Fungsi untuk mengecek apakah salah satu sub-menu armada aktif.
    const isFleetActive = () => {
        return isActive('/boats-seaboat') || isActive('/boats-tiketboat') || isActive('/boats-carharbour');
    };

    // Fungsi untuk mengecek apakah salah satu sub-menu trip aktif.
    const isTripActive = () => {
        return isActive('/trips/seaboat') || isActive('/trips/tiketboat') || isActive('/trips/harbour');
    };

    // Fungsi baru untuk mengecek apakah menu tour aktif
    const isTourActive = () => {
        return isActive('/tour-management');
    };

    return (
        <div
            className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-gray-300 p-5 shadow-xl z-50 transition-all duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
            <div className="md:hidden flex justify-end">
                <button onClick={toggle} className="text-gray-400 hover:text-white transition-colors duration-200">
                    <FaTimes size={24} />
                </button>
            </div>

            <div className="flex items-center space-x-2 mb-8">
                <FaShip className="text-3xl text-orange-400" />
                <h4 className="text-2xl font-extrabold text-white">Seaboat Admin</h4>
            </div>

            <ul className="space-y-2 font-medium">
                <li>
                    <Link
                        className={`flex items-center p-3 rounded-lg transition-colors duration-200 ${isActive('/') ? 'bg-gray-700 text-orange-400' : 'hover:bg-gray-700'}`}
                        to="/"
                        onClick={toggle}
                    >
                        <FaTachometerAlt className="me-3" />
                        Dashboard
                    </Link>
                </li>

                {userRole === 'admin' && (
                    <>
                        <li>
                            <button
                                className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors duration-200 ${isFleetActive() ? 'bg-gray-700 text-orange-400' : 'hover:bg-gray-700'}`}
                                onClick={() => setIsFleetMenuOpen(!isFleetMenuOpen)}
                            >
                                <span className="flex items-center">
                                    <FaShip className="me-3" />
                                    Manajemen Armada
                                </span>
                                {isFleetMenuOpen ? <FaCaretUp /> : <FaCaretDown />}
                            </button>
                            {isFleetMenuOpen && (
                                <ul className="mt-2 space-y-1 pl-6 border-l border-gray-600">
                                    <li>
                                        <Link
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive('/boats-seaboat') ? 'bg-gray-600 text-orange-400' : 'hover:bg-gray-600'}`}
                                            to="/boats-seaboat"
                                            onClick={toggle}
                                        >
                                            <FaPlusCircle className="me-2 text-xs" /> Kapal Seaboat
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive('/boats-tiketboat') ? 'bg-gray-600 text-orange-400' : 'hover:bg-gray-600'}`}
                                            to="/boats-tiketboat"
                                            onClick={toggle}
                                        >
                                            <FaPlusCircle className="me-2 text-xs" /> Kapal Tiketboat
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive('/boats-carharbour') ? 'bg-gray-600 text-orange-400' : 'hover:bg-gray-600'}`}
                                            to="/boats-carharbour"
                                            onClick={toggle}
                                        >
                                            <FaPlusCircle className="me-2 text-xs" /> Car Harbour
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                        <li>
                            <button
                                className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors duration-200 ${isTripActive() ? 'bg-gray-700 text-orange-400' : 'hover:bg-gray-700'}`}
                                onClick={() => setIsTripMenuOpen(!isTripMenuOpen)}
                            >
                                <span className="flex items-center">
                                    <FaRoute className="me-3" />
                                    Manajemen Trip
                                </span>
                                {isTripMenuOpen ? <FaCaretUp /> : <FaCaretDown />}
                            </button>
                            {isTripMenuOpen && (
                                <ul className="mt-2 space-y-1 pl-6 border-l border-gray-600">
                                    <li>
                                        <Link
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive('/trips/seaboat') ? 'bg-gray-600 text-orange-400' : 'hover:bg-gray-600'}`}
                                            to="/trips/seaboat"
                                            onClick={toggle}
                                        >
                                            <FaPlusCircle className="me-2 text-xs" /> Trip Seaboat
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive('/trips/tiketboat') ? 'bg-gray-600 text-orange-400' : 'hover:bg-gray-600'}`}
                                            to="/trips/tiketboat"
                                            onClick={toggle}
                                        >
                                            <FaPlusCircle className="me-2 text-xs" /> Trip Tiketboat
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive('/trips/harbour') ? 'bg-gray-600 text-orange-400' : 'hover:bg-gray-600'}`}
                                            to="/trips/harbour"
                                            onClick={toggle}
                                        >
                                            <FaPlusCircle className="me-2 text-xs" /> Trip Harbour
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>

                        {/* Menu baru untuk Tour Management */}
                        <li>
                            <button
                                className={`flex items-center justify-between w-full p-3 rounded-lg transition-colors duration-200 ${isTourActive() ? 'bg-gray-700 text-orange-400' : 'hover:bg-gray-700'}`}
                                onClick={() => setIsTourMenuOpen(!isTourMenuOpen)}
                            >
                                <span className="flex items-center">
                                    <FaGlobe className="me-3" />
                                    Manajemen Paket Tur
                                </span>
                                {isTourMenuOpen ? <FaCaretUp /> : <FaCaretDown />}
                            </button>
                            {isTourMenuOpen && (
                                <ul className="mt-2 space-y-1 pl-6 border-l border-gray-600">
                                    <li>
                                        <Link
                                            className={`flex items-center p-2 rounded-lg transition-colors duration-200 ${isActive('/tour-management') ? 'bg-gray-600 text-orange-400' : 'hover:bg-gray-600'}`}
                                            to="/tour-management"
                                            onClick={toggle}
                                        >
                                            <FaPlusCircle className="me-2 text-xs" /> Kelola Tur
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                    </>
                )}
            </ul>
        </div>
    );
}

export default Sidebar;