import React from "react";
import { Link } from "react-router-dom";
import { FaTachometerAlt, FaShip, FaRoute, FaChair, FaUser, FaTimes, FaPlusCircle } from "react-icons/fa";

function Sidebar({ isOpen, toggle, userRole }) {
    return (
        <div
            className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white p-5 shadow-lg z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
        >
            <div className="md:hidden flex justify-end">
                <button onClick={toggle} className="text-white hover:text-gray-300">
                    <FaTimes size={24} />
                </button>
            </div>

            <h4 className="text-2xl font-bold mb-6 mt-4">Seaboat Admin</h4>
            <ul className="nav flex-column space-y-2">
                <li className="nav-item">
                    <Link className="nav-link text-white hover:bg-gray-700 p-2 rounded-md flex items-center" to="/" onClick={toggle}>
                        <FaTachometerAlt className="me-2" /> Dashboard
                    </Link>
                </li>

                {/* Tautan hanya untuk Admin */}
                {userRole === 'admin' && (
                    <>
                        <li className="nav-item">
                            <Link className="nav-link text-white hover:bg-gray-700 p-2 rounded-md flex items-center" to="/boats" onClick={toggle}>
                                <FaShip className="me-2" /> Kapal Seaboat
                            </Link>
                        </li>
                        {/* <li className="nav-item">
                            <Link className="nav-link text-white hover:bg-gray-700 p-2 rounded-md flex items-center" to="/tiketboats" onClick={toggle}>
                                <FaShip className="me-2" /> Kapal Tiket Boat
                            </Link>
                        </li> */}
                        <li className="nav-item">
                            <Link className="nav-link text-white hover:bg-gray-700 p-2 rounded-md flex items-center" to="/trips" onClick={toggle}>
                                <FaRoute className="me-2" /> Trip Seaboat
                            </Link>
                        </li>
                        {/* <li className="nav-item">
                            <Link className="nav-link text-white hover:bg-gray-700 p-2 rounded-md flex items-center" to="/tiketboattrips" onClick={toggle}>
                                <FaRoute className="me-2" /> Trip Tiket Boat
                            </Link>
                        </li> */}

                        {/* <li className="nav-item">
                            <Link className="nav-link text-white hover:bg-gray-700 p-2 rounded-md flex items-center" to="/seats" onClick={toggle}>
                                <FaChair className="me-2" /> Kursi
                            </Link>
                        </li> */}
                    </>
                )}


            </ul>
        </div>
    );
}

export default Sidebar;