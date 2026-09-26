import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Complaint from "./pages/Complaint";
import MyComplaints from "./pages/MyComplaints";
import About from "./pages/About";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

function MainLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          {/* ================= PUBLIC USER ROUTES ================= */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />

          {/* ================= PROTECTED STUDENT / USER ROUTES ================= */}
          <Route
            path="/complaint"
            element={
              <ProtectedRoute>
                <Complaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute>
                <MyComplaints />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track-complaint"
            element={<Navigate to="/my-complaints" replace />}
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ================= ADMIN DASHBOARD ROUTE ================= */}
          <Route
            path="/admin-dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Forward any other /admin routes to existing /admin-dashboard */}
          <Route
            path="/admin"
            element={<Navigate to="/admin-dashboard" replace />}
          />
          <Route
            path="/admin/*"
            element={<Navigate to="/admin-dashboard" replace />}
          />

          {/* ================= 404 NOT FOUND ================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;