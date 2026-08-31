import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Complaint from "./pages/Complaint";
import MyComplaints from "./pages/MyComplaints";
import AdminDashboard from "./pages/AdminDashboard";
import TrackComplaint from "./pages/TrackComplaint";
import About from "./pages/About";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      
      {/* Navbar */}
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/complaint" element={<Complaint />} />

        <Route path="/my-complaints" element={<MyComplaints />} />

        <Route path="/track-complaint" element={<TrackComplaint />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="/about" element={<About />} />
        <Route path="/profile"element={<>
          <Navbar />
            <Profile />
               </>
             }
          />
      </Routes>

    </BrowserRouter>
  );
}

export default App;