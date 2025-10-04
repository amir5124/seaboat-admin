import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Seats from "./components/Seats";
import Agen from "./components/Agen";
import Navbar from "./components/Navbar";

import BoatManagement from "./components/BoatManagement";
import AdminOrderForm from "./components/AdminOrderForm";
import UnauthorizedRedirect from "./components/UnauthorizedRedirect";

// Hapus TripSeaboat, TripTiketboat, TripHarbour
// Ganti dengan komponen Trips tunggal
import Trips from "./components/Trips"; // Asumsi Trips.js berada di folder pages

// Import komponen TourManagement yang baru dibuat
import TourManagement from "./components/TourManagement";
import YachtManagement from "./components/YachtManagement";
import FishingManagement from "./components/FishingManagement";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set default state untuk melewati halaman login
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // Langsung set ke false
  const [userRole, setUserRole] = useState("admin"); // Pilih peran: "admin" atau "agen"

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('agen');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden"></span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        <Navbar toggle={toggleSidebar} isSidebarOpen={isSidebarOpen} onLogout={handleLogout} />
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} userRole={userRole} />

        <div className="flex-1 flex flex-col md:ml-64">
          <div className="p-4 md:p-8 flex-1">
            <Routes>
              {/* Rute untuk Dashboard */}
              <Route
                path="/"
                element={(userRole === 'admin' || userRole === 'agen') ? <Dashboard /> : <UnauthorizedRedirect />}
              />

              {/* === Rute Manajemen Kapal === */}
              <Route path="/boats-seaboat" element={<BoatManagement serviceType="jukung" title="Manajemen Kapal Seaboat" />} />
              <Route path="/boats-tiketboat" element={<BoatManagement serviceType="tiketboat" title="Manajemen Kapal Tiketboat" />} />
              <Route path="/boats-carharbour" element={<BoatManagement serviceType="carharbour" title="Manajemen Car Harbour" />} />

              {/* === Rute Manajemen Trip DINAMIS === */}
              {/* Rute ini akan menangani /trips/seaboat, /trips/tiketboat, dan /trips/harbour */}
              <Route path="/trips/:remarkType" element={(userRole === 'admin') ? <Trips /> : <UnauthorizedRedirect />} />

              {/* === Rute Manajemen Paket Tur (Tambahan Baru) === */}
              <Route
                path="/tour-management"
                element={(userRole === 'admin') ? <TourManagement /> : <UnauthorizedRedirect />}
              />

              <Route path="/management/yachts" element={<YachtManagement />} />

              <Route path="/fishing-management" element={<FishingManagement />} />

              {/* === Rute Lainnya === */}
              <Route
                path="/seats"
                element={(userRole === 'admin') ? <Seats /> : <UnauthorizedRedirect />}
              />
              <Route
                path="/admin-order"
                element={(userRole === 'admin' || userRole === 'agen') ? <AdminOrderForm /> : <UnauthorizedRedirect />}
              />
              <Route
                path="/agen"
                element={(userRole === 'admin' || userRole === 'agen') ? <Agen /> : <UnauthorizedRedirect />}
              />

              {/* Rute wildcard untuk mengalihkan kembali ke dashboard jika path tidak ditemukan */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;