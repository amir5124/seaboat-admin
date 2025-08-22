import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Sidebar from "./components/Sidebar"; // Import komponen Sidebar
import Dashboard from "./components/Dashboard";
import Boats from "./components/Boats";
import Trips from "./components/Trips";
import Seats from "./components/Seats";
import Agen from "./components/Agen";
import { FaBars } from "react-icons/fa"; // Import FaBars (ikon hamburger)

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">

        {/* Component Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

        {/* Kontainer untuk Konten Utama */}
        <div className="flex-1 flex flex-col">

          {/* Header Mobile (Hanya terlihat di layar kecil) */}
          <div className="bg-white shadow-md p-4 flex items-center md:hidden">
            <button onClick={toggleSidebar} className="text-gray-800">
              <FaBars size={24} />
            </button>
            <h4 className="text-xl font-bold ml-4">Maruti Admin</h4>
          </div>

          {/* Area Konten */}
          <div className="p-4 md:p-8 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/boats" element={<Boats />} />
              <Route path="/trips" element={<Trips />} />
              <Route path="/seats" element={<Seats />} />
              <Route path="/agen" element={<Agen />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;