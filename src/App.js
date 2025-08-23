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

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Tambahkan state loading, setel nilai awalnya menjadi true
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Periksa apakah ada token yang tersimpan di localStorage saat aplikasi dimuat
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    // Setelah selesai memeriksa, setel isLoading menjadi false
    setIsLoading(false);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('token');
    localStorage.removeItem('agen');
  };

  // Tampilkan layar loading jika isLoading masih true
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
      {!isLoggedIn ? (
        <Routes>
          <Route path="/" element={<Login onLoginSuccess={handleLogin} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      ) : (
        <div className="flex min-h-screen bg-gray-100">
          <Navbar toggle={toggleSidebar} isSidebarOpen={isSidebarOpen} onLogout={handleLogout} />
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

          <div className="flex-1 flex flex-col md:ml-64">
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
      )}
    </Router>
  );
}

export default App;