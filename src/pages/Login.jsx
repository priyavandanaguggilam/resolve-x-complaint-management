import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  const showNotification = (message, type = "success") => {
    setNotification(message);
    setNotificationType(type);

    setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification(
        "Please enter email and password",
        "error"
      );
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showNotification(
          data.message || "Login failed",
          "error"
        );
        return;
      }

      // Store JWT token
      localStorage.setItem("token", data.token);

      // Store user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // IMPORTANT: update Navbar immediately
      window.dispatchEvent(new Event("userChanged"));

      showNotification("Login successful!");

      setTimeout(() => {
        if (data.user.role === "admin") {
          navigate("/")
        } else {
          navigate("/");
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);

      showNotification(
        "Unable to connect to server",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600 flex items-center justify-center px-6">

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-white ${
            notificationType === "error"
              ? "bg-red-600"
              : "bg-green-600"
          }`}
        >
          {notificationType === "error" ? "✕" : "✓"}{" "}
          {notification}
        </div>
      )}

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8">

        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">
              RX
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            Welcome Back
          </h1>

          <p className="text-gray-500 mt-2">
            Login to your Resolve X account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-indigo-600 transition"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <Link
              to="/forgot-password"
              className="text-indigo-600 text-sm font-semibold hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition"
          >
            Login
          </button>

        </form>

        {/* Register */}
        <p className="text-center text-gray-500 mt-7">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Register
          </Link>
        </p>

        {/* Back Home */}
        <div className="text-center mt-4">
          <Link
            to="/"
            className="text-gray-500 hover:text-indigo-600"
          >
            ← Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;