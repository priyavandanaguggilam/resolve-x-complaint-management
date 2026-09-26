import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const accountRef = useRef(null);

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

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccount(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Smooth scroll or navigation to Home sections
  const goToSection = (sectionId) => {
    setShowAccount(false);
    setMobileMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } else {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100">
      <div className="w-full px-6 sm:px-10 lg:px-12 py-3.5 flex items-center justify-between">
        {/* LEFT CORNER: LOGO & BRAND */}
        <Link
          to="/"
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-105 transition">
            <span className="text-white text-base font-black">RX</span>
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

        {/* RIGHT CORNER: DESKTOP NAVIGATION */}
        <div className="hidden lg:flex items-center gap-7">
          <ul className="flex items-center gap-6 text-[15px] font-semibold text-slate-700">
            <li>
              <button
                onClick={() => goToSection("home")}
                className="hover:text-indigo-600 transition cursor-pointer"
              >
                Home
              </button>
            </li>
            <li>
              <button
                onClick={() => goToSection("categories")}
                className="hover:text-indigo-600 transition cursor-pointer"
              >
                Categories
              </button>
            </li>
            <li>
              <button
                onClick={() => goToSection("about")}
                className="hover:text-indigo-600 transition cursor-pointer"
              >
                About
              </button>
            </li>

            {/* Normal User Navigation */}
            {isLoggedIn && !isAdmin && (
              <li>
                <Link
                  to="/my-complaints"
                  className="hover:text-indigo-600 transition"
                >
                  My Complaints
                </Link>
              </li>
            )}

            {/* Admin Navigation */}
            {isLoggedIn && isAdmin && (
              <li>
                <Link
                  to="/admin-dashboard"
                  className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-lg border border-indigo-200 font-bold hover:bg-indigo-100 transition"
                >
                  Admin Dashboard
                </Link>
              </li>
            )}
          </ul>

          {/* Action CTA for submitting complaints: ONLY FOR NORMAL USERS */}
          {isLoggedIn && !isAdmin && (
            <Link
              to="/complaint"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow transition"
            >
              + Submit Complaint
            </Link>
          )}

          {/* ACCOUNT DROPDOWN */}
          {!isLoggedIn ? (
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow hover:scale-105 active:scale-95 transition"
            >
              Sign In
            </button>
          ) : (
            <div className="relative" ref={accountRef}>
              <button
                onClick={() => setShowAccount((prev) => !prev)}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-sm shadow hover:scale-105 transition"
              >
                {(user.name || "U").charAt(0).toUpperCase()}
              </button>

              {showAccount && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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

                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowAccount(false);
                        navigate("/profile");
                      }}
                      className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                    >
                      Profile Settings
                    </button>

                    {!isAdmin ? (
                      <button
                        onClick={() => {
                          setShowAccount(false);
                          navigate("/my-complaints");
                        }}
                        className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-medium text-slate-700"
                      >
                        My Complaints
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowAccount(false);
                          navigate("/admin-dashboard");
                        }}
                        className="w-full px-5 py-2.5 hover:bg-slate-50 transition text-left text-sm font-semibold text-indigo-700"
                      >
                        Admin Dashboard
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 py-1">
                    <button
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

        {/* MOBILE MENU TOGGLE BUTTON */}
        <div className="flex items-center gap-3 lg:hidden">
          {isLoggedIn && (
            <button
              onClick={() => setShowAccount((prev) => !prev)}
              className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-bold text-sm flex items-center justify-center"
            >
              {(user.name || "U").charAt(0).toUpperCase()}
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-6 py-5 space-y-4">
          <button
            onClick={() => goToSection("home")}
            className="block w-full text-left font-semibold text-slate-700 py-1"
          >
            Home
          </button>
          <button
            onClick={() => goToSection("categories")}
            className="block w-full text-left font-semibold text-slate-700 py-1"
          >
            Categories
          </button>
          <button
            onClick={() => goToSection("about")}
            className="block w-full text-left font-semibold text-slate-700 py-1"
          >
            About
          </button>

          {isLoggedIn && !isAdmin && (
            <>
              <Link
                to="/my-complaints"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-semibold text-slate-700 py-1"
              >
                My Complaints
              </Link>
              <Link
                to="/complaint"
                onClick={() => setMobileMenuOpen(false)}
                className="block font-bold text-indigo-600 py-1"
              >
                + Submit Complaint
              </Link>
            </>
          )}

          {isLoggedIn && isAdmin && (
            <Link
              to="/admin-dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-bold text-indigo-600 py-1"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-3 border-t border-slate-100">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="w-full text-left font-semibold text-rose-600 py-1"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-center"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
