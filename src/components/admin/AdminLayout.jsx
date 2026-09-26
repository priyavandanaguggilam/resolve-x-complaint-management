import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import api from "../../api/client";

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [criticalCount, setCriticalCount] = useState(0);

  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || { name: "Admin" };
    } catch {
      return { name: "Admin" };
    }
  })();

  const fetchStats = async () => {
    try {
      const res = await api.get("/complaints/stats");
      setCriticalCount(res.data.criticalComplaints || 0);
    } catch (e) {
      console.warn("Could not load admin stats badge:", e);
    }
  };

  useEffect(() => {
    fetchStats();
    const timer = setInterval(fetchStats, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
    navigate("/login");
  };

  const navItems = [
    { label: "Dashboard Overview", path: "/admin/dashboard", icon: "📊" },
    { label: "All Complaints", path: "/admin/complaints", icon: "📋" },
    {
      label: "Pending Review",
      path: "/admin/complaints?status=Pending",
      icon: "⏳",
    },
    {
      label: "In Progress",
      path: "/admin/complaints?status=In Progress",
      icon: "🔄",
    },
    {
      label: "Resolved Issues",
      path: "/admin/complaints?status=Resolved",
      icon: "✅",
    },
    { label: "User Management", path: "/admin/users", icon: "👥" },
    { label: "Ratings & Feedback", path: "/admin/ratings", icon: "⭐" },
    { label: "Admin Profile", path: "/admin/profile", icon: "👤" },
  ];

  const currentPathWithQuery = location.pathname + location.search;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans text-slate-800">
      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-white text-lg shadow-lg">
                RX
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white">
                  Resolve X
                </h1>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  ADMIN CONSOLE
                </span>
              </div>
            </Link>

            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          {/* Quick Alert Banner if Critical Issues */}
          {criticalCount > 0 && (
            <div className="mx-4 my-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                {criticalCount} Critical Issue{criticalCount > 1 ? "s" : ""}
              </span>
              <Link
                to="/admin/complaints?priority=Critical"
                className="font-bold text-rose-200 underline hover:text-white"
              >
                View
              </Link>
            </div>
          )}

          {/* Nav Items */}
          <div className="px-4 py-4 space-y-1">
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Management Menu
            </p>

            {navItems.map((item) => {
              const isActive =
                item.path.includes("?")
                  ? currentPathWithQuery === item.path
                  : location.pathname === item.path && !location.search;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {isActive && <span className="text-xs">›</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Quick switch to student portal */}
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <span>🌐 View Public Site</span>
            <span>↗</span>
          </Link>

          {/* Admin User Card */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(admin.name || "A").charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {admin.name || "Administrator"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {admin.email || "admin@resolvex.com"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              🚪
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs"
        ></div>
      )}

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              ☰
            </button>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Hostel Administration Panel
              </h2>
              <p className="text-xs text-slate-400 hidden sm:block">
                Centralized complaint tracking, status enforcement, and user administration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Server Connected
            </div>

            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
