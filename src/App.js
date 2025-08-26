import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Boats from "./components/Boats";
import Trips from "./components/Trips";
import Seats from "./components/Seats";
import Agen from "./components/Agen";
import Navbar from "./components/Navbar";
import Login from "./components/Login";

// === Import komponen baru ===
import AdminOrderForm from "./components/AdminOrderForm";
import UnauthorizedRedirect from "./components/UnauthorizedRedirect";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const agenData = localStorage.getItem('agen');

    if (token && agenData) {
      try {
        const parsedAgen = JSON.parse(agenData);
        setIsLoggedIn(true);
        setUserRole(parsedAgen.role);
      } catch (e) {
        console.error("Failed to parse agen data from localStorage", e);
        localStorage.removeItem('token');
        localStorage.removeItem('agen');
        setIsLoggedIn(false);
        setUserRole(null);
      }
    }
    setIsLoading(false);
  }, []);

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
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {!isLoggedIn ? (
        <Routes>
          <Route path="*" element={<Login onLoginSuccess={handleLogin} />} />
        </Routes>
      ) : (
        <div className="flex min-h-screen bg-gray-100">
          <Navbar toggle={toggleSidebar} isSidebarOpen={isSidebarOpen} onLogout={handleLogout} />
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} userRole={userRole} />

          <div className="flex-1 flex flex-col md:ml-64">
            <div className="p-4 md:p-8 flex-1">
              <Routes>
                {/* Rute untuk Dashboard: bisa diakses oleh admin dan agen */}
                <Route
                  path="/"
                  element={
                    (userRole === 'admin' || userRole === 'agen')
                      ? <Dashboard />
                      : <UnauthorizedRedirect />
                  }
                />

                {/* Rute untuk Boats: hanya bisa diakses oleh admin */}
                <Route
                  path="/boats"
                  element={
                    (userRole === 'admin')
                      ? <Boats />
                      : <UnauthorizedRedirect />
                  }
                />

                {/* Rute untuk Trips: hanya bisa diakses oleh admin */}
                <Route
                  path="/trips"
                  element={
                    (userRole === 'admin')
                      ? <Trips />
                      : <UnauthorizedRedirect />
                  }
                />

                {/* Rute untuk Seats: hanya bisa diakses oleh admin */}
                <Route
                  path="/seats"
                  element={
                    (userRole === 'admin')
                      ? <Seats />
                      : <UnauthorizedRedirect />
                  }
                />

                {/* === Tambahkan rute untuk AdminOrderForm di sini === */}
                <Route
                  path="/admin-order"
                  element={
                    (userRole === 'admin')
                      ? <AdminOrderForm />
                      : <UnauthorizedRedirect />
                  }
                />

                {/* Rute untuk Agen: bisa diakses oleh admin dan agen */}
                <Route
                  path="/agen"
                  element={
                    (userRole === 'admin' || userRole === 'agen')
                      ? <Agen />
                      : <UnauthorizedRedirect />
                  }
                />

                {/* Rute wildcard untuk mengalihkan kembali ke dashboard jika path tidak ditemukan */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;