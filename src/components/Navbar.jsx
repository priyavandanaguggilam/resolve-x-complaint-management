import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const accountRef = useRef(null);
  const mobileAccountRef = useRef(null);

  // Load user from localStorage
  const loadUser = () => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Invalid user data in storage:", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();

    window.addEventListener("storage", loadUser);
    window.addEventListener("userChanged", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("userChanged", loadUser);
    };
  }, [location.pathname]);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === "admin";

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);
    setShowAccount(false);
    setMobileMenuOpen(false);

    window.dispatchEvent(new Event("userChanged"));
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedDesktop =
        accountRef.current?.contains(event.target);

      const clickedMobile =
        mobileAccountRef.current?.contains(event.target);

      if (!clickedDesktop && !clickedMobile) {
        setShowAccount(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close menus
  const closeMenus = () => {
    setShowAccount(false);
    setMobileMenuOpen(false);
  };

  // Navigate to Home and scroll to a section
  const navigateToSection = (sectionId) => {
    closeMenus();

    if (location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        const section = document.getElementById(sectionId);

        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 500);
    } else {
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        navigate("/");
      }
    }
  };

  // Navigate to Home
  const handleHome = () => {
    closeMenus();
    navigate("/");
  };

  // Navigate to Profile
  const handleProfile = () => {
    closeMenus();
    navigate("/profile");
  };

  // Navigate to My Complaints
  const handleMyComplaints = () => {
    closeMenus();
    navigate("/my-complaints");
  };

  // Navigate to Admin Dashboard
  const handleAdminDashboard = () => {
    closeMenus();
    navigate("/admin-dashboard");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">

      <div className="w-full px-6 sm:px-10 lg:px-12 py-3.5 flex items-center justify-between">

        {/* ==================== LOGO ==================== */}

        <Link
          to="/"
          onClick={closeMenus}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-105 transition">
            <span className="text-white text-base font-black">
              RX
            </span>
          </div>

          <div className="flex flex-col">
            <span
              className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-700 via-purple-600 to-cyan-500 bg-clip-text text-transparent"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Resolve X
            </span>

            <span className="text-[10px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">
              Complaint Management
            </span>
          </div>
        </Link>

        {/* ==================== DESKTOP ==================== */}

        <div className="hidden lg:flex items-center gap-4">

          {/* USER: SUBMIT COMPLAINT */}
          {isLoggedIn && !isAdmin && (
            <Link
              to="/complaint"
              onClick={closeMenus}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition"
            >
              + Submit Complaint
            </Link>
          )}

          {/* NOT LOGGED IN */}
          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:scale-105 active:scale-95 transition"
            >
              Sign In
            </button>
          ) : (
            /* ==================== PROFILE DROPDOWN ==================== */

            <div className="relative" ref={accountRef}>

              {/* PROFILE ICON */}
              <button
                type="button"
                onClick={() => setShowAccount((prev) => !prev)}
                aria-label="Open profile menu"
                aria-expanded={showAccount}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow hover:scale-105 transition"
              >
                {(user?.name || "U").charAt(0).toUpperCase()}
              </button>

              {/* DROPDOWN */}
              {showAccount && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

                  {/* USER INFORMATION */}
                  <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white">

                    <p className="font-bold text-base truncate">
                      {user?.name || "User"}
                    </p>

                    <p className="text-xs text-indigo-100 truncate mt-0.5">
                      {user?.email || ""}
                    </p>

                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                      {isAdmin ? "Administrator" : "Student"}
                    </span>

                  </div>

                  {/* ==================== MENU ==================== */}

                  <div className="py-2">

                    {/* 1. PROFILE */}
                    <button
                      type="button"
                      onClick={handleProfile}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      Profile
                    </button>

                    {/* 2. HOME */}
                    <button
                      type="button"
                      onClick={handleHome}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      Home
                    </button>

                    {/* 3. CATEGORIES */}
                    <button
                      type="button"
                      onClick={() => navigateToSection("categories")}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      Categories
                    </button>

                    {/* 4. MY COMPLAINTS / ADMIN DASHBOARD */}
                    {!isAdmin ? (
                      <button
                        type="button"
                        onClick={handleMyComplaints}
                        className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                      >
                        My Complaints
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAdminDashboard}
                        className="w-full px-5 py-2.5 hover:bg-indigo-50 transition text-left text-sm font-semibold text-indigo-700"
                      >
                        Admin Dashboard
                      </button>
                    )}

                    {/* 5. ABOUT */}
                    <button
                      type="button"
                      onClick={() => navigateToSection("about")}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      About
                    </button>

                  </div>

                  {/* 6. LOGOUT */}
                  <div className="border-t border-slate-100 py-1">

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-5 py-2.5 hover:bg-rose-50 transition text-left text-sm font-semibold text-rose-600"
                    >
                      Logout
                    </button>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>

        {/* ==================== MOBILE ==================== */}

        <div className="flex items-center gap-3 lg:hidden">

          {/* PROFILE ICON */}
          {isLoggedIn && (
            <div className="relative" ref={mobileAccountRef}>

              <button
                type="button"
                onClick={() => setShowAccount((prev) => !prev)}
                aria-label="Open profile menu"
                aria-expanded={showAccount}
                className="w-9 h-9 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-bold text-sm flex items-center justify-center shadow"
              >
                {(user?.name || "U").charAt(0).toUpperCase()}
              </button>

              {/* MOBILE PROFILE DROPDOWN */}
              {showAccount && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

                  {/* USER INFORMATION */}
                  <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white">

                    <p className="font-bold text-base truncate">
                      {user?.name || "User"}
                    </p>

                    <p className="text-xs text-indigo-100 truncate mt-0.5">
                      {user?.email || ""}
                    </p>

                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white">
                      {isAdmin ? "Administrator" : "Student"}
                    </span>

                  </div>

                  {/* MENU */}
                  <div className="py-2">

                    {/* 1. PROFILE */}
                    <button
                      type="button"
                      onClick={handleProfile}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      Profile
                    </button>

                    {/* 2. HOME */}
                    <button
                      type="button"
                      onClick={handleHome}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      Home
                    </button>

                    {/* 3. CATEGORIES */}
                    <button
                      type="button"
                      onClick={() => navigateToSection("categories")}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      Categories
                    </button>

                    {/* 4. MY COMPLAINTS / ADMIN DASHBOARD */}
                    {!isAdmin ? (
                      <button
                        type="button"
                        onClick={handleMyComplaints}
                        className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                      >
                        My Complaints
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAdminDashboard}
                        className="w-full px-5 py-2.5 hover:bg-indigo-50 transition text-left text-sm font-semibold text-indigo-700"
                      >
                        Admin Dashboard
                      </button>
                    )}

                    {/* 5. ABOUT */}
                    <button
                      type="button"
                      onClick={() => navigateToSection("about")}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      About
                    </button>

                  </div>

                  {/* 6. LOGOUT */}
                  <div className="border-t border-slate-100 py-1">

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full px-5 py-2.5 hover:bg-rose-50 transition text-left text-sm font-semibold text-rose-600"
                    >
                      Logout
                    </button>

                  </div>

                </div>
              )}

            </div>
          )}

          {/* HAMBURGER */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>

        </div>

      </div>

      {/* ==================== MOBILE DRAWER ==================== */}

      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5">

          {!isLoggedIn ? (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/login");
              }}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-center"
            >
              Sign In
            </button>
          ) : (
            <div className="space-y-3">

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Menu
              </p>

              <button
                type="button"
                onClick={handleHome}
                className="block w-full text-left font-semibold text-slate-700 py-1"
              >
                Home
              </button>

              <button
                type="button"
                onClick={() => navigateToSection("categories")}
                className="block w-full text-left font-semibold text-slate-700 py-1"
              >
                Categories
              </button>

              {!isAdmin && (
                <Link
                  to="/complaint"
                  onClick={closeMenus}
                  className="block font-bold text-indigo-600 py-1"
                >
                  + Submit Complaint
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin-dashboard"
                  onClick={closeMenus}
                  className="block font-bold text-indigo-600 py-1"
                >
                  Admin Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={() => navigateToSection("about")}
                className="block w-full text-left font-semibold text-slate-700 py-1"
              >
                About
              </button>

              <div className="pt-3 border-t border-slate-100">

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left font-semibold text-rose-600 py-1"
                >
                  Logout
                </button>

              </div>

            </div>
          )}

        </div>
      )}

    </nav>
  );
}

export default Navbar;