import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar"; // Import komponen Sidebar
import Dashboard from "./components/Dashboard";
import Boats from "./components/Boats";
import Trips from "./components/Trips";
import Seats from "./components/Seats";
import Agen from "./components/Agen";
import Navbar from "./components/Navbar"; // Import komponen Navbar

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Router>
      {/* Panggil Navbar di sini, di luar container utama */}
      <Navbar toggle={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="flex min-h-screen bg-gray-100">

        {/* Component Sidebar */}
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

        {/* Kontainer untuk Konten Utama */}
        <div className="flex-1 flex flex-col md:ml-64">

          {/* Header Mobile yang lama Dihapus */}

          {/* Area Konten, biarkan flex-1 untuk mengisi sisa ruang */}
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