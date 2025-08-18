import React, { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    return (
        <>
            {/* Toggle button untuk mobile */}
            <button
                className="btn btn-primary d-md-none m-2"
                onClick={toggleSidebar}
            >
                {isOpen ? "Close Menu" : "Open Menu"}
            </button>

            {/* Sidebar */}
            <div
                className={`bg-dark text-white p-3 position-fixed h-100 ${isOpen ? "d-block" : "d-none"
                    } d-md-block`}
                style={{ width: "250px", zIndex: 1000 }}
            >
                <h4>Maruti Admin</h4>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <Link className="nav-link text-white" to="/boats">
                            Kapal
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link text-white" to="/trips">
                            Trip
                        </Link>
                    </li>
                    <li className="nav-item">
                        <Link className="nav-link text-white" to="/seats">
                            Kursi
                        </Link>
                    </li>
                </ul>
            </div>
        </>
    );
};

export default Sidebar;
