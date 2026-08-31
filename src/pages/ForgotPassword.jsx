import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] =
    useState("success");

  const showNotification = (message, type = "success") => {
    setNotification(message);
    setNotificationType(type);

    setTimeout(() => {
      setNotification("");
    }, 3000);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email || !newPassword || !confirmPassword) {
      showNotification("Please fill all fields", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showNotification("Passwords do not match", "error");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showNotification(
          data.message || "Password reset failed",
          "error"
        );
        return;
      }

      showNotification("Password reset successful!");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      console.error("Reset password error:", error);

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
            Reset Password
          </h1>

          <p className="text-gray-500 mt-2">
            Create a new password for your account
          </p>
        </div>

        {/* Reset Password Form */}
        <form onSubmit={handleResetPassword}>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* New Password */}
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              New Password
            </label>

            <div className="relative">
              <input
                type={
                  showNewPassword ? "text" : "password"
                }
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowNewPassword(!showNewPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black"
              >
                {showNewPassword ? (
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
                placeholder="Confirm new password"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black"
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Reset Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition"
          >
            Reset Password
          </button>

        </form>

        {/* Back to Login */}
        <div className="text-center mt-6">
          <Link
            to="/login"
            className="text-indigo-600 font-semibold hover:underline"
          >
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}

export default ForgotPassword;