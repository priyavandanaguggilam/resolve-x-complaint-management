
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] =
    useState("success");

  // ============================
  // SHOW NOTIFICATION
  // ============================
  const showNotification = (message, type = "success") => {
    setNotification(message);
    setNotificationType(type);

    setTimeout(() => {
      setNotification("");
    }, 2000);
  };

  // ============================
  // REGISTER
  // ============================
  const handleRegister = async (e) => {
    e.preventDefault();

    // Required fields
    if (
      !name.trim() ||
      !email.trim() ||
      !phone ||
      !password ||
      !confirmPassword
    ) {
      showNotification("Please fill all fields", "error");
      return;
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(phone)) {
      showNotification(
        "Phone number must contain exactly 10 digits",
        "error"
      );
      return;
    }

    // Password validation
    if (password !== confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showNotification(
          data.message || "Registration failed",
          "error"
        );
        return;
      }

      // Success message
      showNotification(
        "Registration successful! Redirecting to Home..."
      );

      // Clear form
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to Home
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error("Registration error:", error);

      showNotification(
        "Unable to connect to server",
        "error"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600 flex items-center justify-center px-6 py-10">

      {/* ============================
          NOTIFICATION
      ============================ */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-white transition-all ${
            notificationType === "error"
              ? "bg-red-600"
              : "bg-green-600"
          }`}
        >
          {notificationType === "error" ? "✕" : "✓"}{" "}
          {notification}
        </div>
      )}

      {/* ============================
          REGISTER CARD
      ============================ */}
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">

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
            Create Account
          </h1>

          <p className="text-gray-500 mt-2">
            Join Resolve X and report your issues
          </p>
        </div>

        {/* ============================
            FORM
        ============================ */}
        <form onSubmit={handleRegister}>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Full Name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
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

          {/* Phone */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="Enter 10-digit phone number"
              value={phone}
              onChange={(e) => {
                const value = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10);

                setPhone(value);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <p className="text-xs text-gray-400 mt-1">
              {phone.length}/10 digits
            </p>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Confirm Password
            </label>

            <div className="relative">
              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Register Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition"
          >
            Create Account
          </button>
        </form>

        {/* Login */}
        <p className="text-center text-gray-500 mt-7">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 font-semibold hover:underline"
          >
            Login
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

export default Register;

