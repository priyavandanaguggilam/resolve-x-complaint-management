
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showAccount, setShowAccount] = useState(false);

  const accountRef = useRef(null);

  // Read logged-in user whenever the page/location changes
  useEffect(() => {
    const loadUser = () => {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Invalid user data");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    // Update Navbar after login/logout
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
    localStorage.removeItem("user");

    setUser(null);
    setShowAccount(false);

    // Tell Navbar that user changed
    window.dispatchEvent(new Event("userChanged"));

    navigate("/login");
  };

  // Close account menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target)
      ) {
        setShowAccount(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  // Go to Home section
  const goToSection = (sectionId) => {
    setShowAccount(false);

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
      }, 300);
    } else {
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  // Home button
  const goHome = () => {
    setShowAccount(false);

    if (location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      navigate("/");
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md shadow-sm">

      <div className="px-6 py-4 flex items-center">

        {/* LOGO */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={goHome}
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">
              RX
            </span>
          </div>

          <h1
            className="text-[30px] font-black tracking-tight bg-gradient-to-r from-indigo-700 via-purple-600 to-cyan-500 bg-clip-text text-transparent"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Resolve X
          </h1>
        </div>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex items-center gap-7">

          {/* NAVIGATION */}
          <ul className="hidden md:flex items-center gap-6 text-[18px] font-medium text-slate-700">

            {/* HOME */}
            <li>
              <button
                onClick={goHome}
                className="hover:text-indigo-600 transition"
              >
                Home
              </button>
            </li>

            {/* CATEGORIES */}
            <li>
              <button
                onClick={() => goToSection("categories")}
                className="hover:text-indigo-600 transition"
              >
                Categories
              </button>
            </li>

            {/* ABOUT */}
            <li>
              <button
                onClick={() => goToSection("about")}
                className="hover:text-indigo-600 transition"
              >
                About
              </button>
            </li>

            {/* CONTACT */}
            <li>
              <button
                onClick={() => goToSection("contact")}
                className="hover:text-indigo-600 transition"
              >
                Contact
              </button>
            </li>

          </ul>

          {/* ACCOUNT */}
          {!isLoggedIn ? (
            <button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-7 py-3 rounded-full font-semibold shadow-lg hover:scale-105 transition"
            >
              Sign In / Sign Up
            </button>
          ) : (
            <div
              className="relative"
              ref={accountRef}
            >

              {/* ACCOUNT SYMBOL */}
              <button
                onClick={() =>
                  setShowAccount((previous) => !previous)
                }
                className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 20.25a8.25 8.25 0 0115 0"
                  />
                </svg>
              </button>

              {/* DROPDOWN */}
              {showAccount && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

                  {/* USER INFORMATION */}
                  <div className="px-5 py-5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white">

                    <p className="font-bold text-lg truncate">
                      {user?.name ||
                        user?.username ||
                        "User"}
                    </p>

                    <p className="text-sm text-indigo-100 truncate mt-1">
                      {user?.email ||
                        "Email not available"}
                    </p>

                    {isAdmin && (
                      <p className="text-xs text-cyan-100 mt-2">
                        Administrator
                      </p>
                    )}

                  </div>

                  {/* PROFILE */}
                  <button
                    onClick={() => {
                      setShowAccount(false);
                      navigate("/profile");
                    }}
                    className="w-full px-5 py-4 hover:bg-gray-50 transition text-left font-medium text-gray-700"
                  >
                    Profile
                  </button>

                  {/* USER: MY COMPLAINTS */}
                  {!isAdmin && (
                    <button
                      onClick={() => {
                        setShowAccount(false);
                        navigate("/my-complaints");
                      }}
                      className="w-full px-5 py-4 hover:bg-gray-50 transition text-left font-medium text-gray-700"
                    >
                      My Complaints
                    </button>
                  )}

                  {/* ADMIN: DASHBOARD */}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowAccount(false);
                        navigate("/admin-dashboard");
                      }}
                      className="w-full px-5 py-4 hover:bg-gray-50 transition text-left font-medium text-gray-700"
                    >
                      Admin Dashboard
                    </button>
                  )}

                  {/* DIVIDER */}
                  <div className="border-t border-gray-200"></div>

                  {/* LOGOUT */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-4 hover:bg-red-50 transition text-left font-medium text-red-600"
                  >
                    Logout
                  </button>

                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </nav>
  );
}

export default Navbar;

