import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || user?.mobile || "");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-20">
        <p className="text-slate-500 font-semibold">
          Please login to view your profile.
        </p>
      </div>
    );
  }

  // Save profile changes to backend database
  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showNotification("Name cannot be empty", "error");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      showNotification("Phone number must be exactly 10 digits", "error");
      return;
    }

    try {
      setSaving(true);
      const response = await api.put("/auth/profile", {
        name: name.trim(),
        phone: phone.trim(),
      });

      const updatedUser = response.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setIsEditing(false);

      // Trigger navbar update
      window.dispatchEvent(new Event("userChanged"));

      showNotification("Profile updated successfully in database!");
    } catch (error) {
      console.error("Profile update error:", error);
      const errMsg =
        error.response?.data?.message || "Failed to update profile";
      showNotification(errMsg, "error");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setName(user.name || "");
    setPhone(user.phone || user.mobile || "");
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-24 right-5 z-50 px-6 py-4 rounded-2xl shadow-xl font-semibold flex items-center gap-3 border ${
            notification.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <span className="text-xl">
            {notification.type === "error" ? "⚠️" : "✓"}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 p-8 text-white">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center text-3xl font-black shadow-inner">
                {(user.name || "U").charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black">
                  {user.name || "User"}
                </h1>
                <p className="text-indigo-100 text-sm mt-1">{user.email}</p>
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                    {user.role === "admin" ? "🛡️ Administrator" : "👤 Student User"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-emerald-400/20 border border-emerald-300/40 text-emerald-100">
                    Active Account
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form / Details */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Account Details
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Your registered profile information
                </p>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-xl text-sm transition"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Email cannot be changed directly for security purposes.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Phone Number (10 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow hover:scale-[1.01] transition disabled:opacity-50"
                  >
                    {saving ? "Saving Changes..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="border border-slate-300 text-slate-700 px-5 py-3 rounded-xl font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Full Name
                    </p>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {user.name || "N/A"}
                    </p>
                  </div>
                  <span className="text-2xl text-slate-300">👤</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {user.email || "N/A"}
                    </p>
                  </div>
                  <span className="text-2xl text-slate-300">✉️</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </p>
                    <p className="text-base font-bold text-slate-800 mt-1">
                      {user.phone || user.mobile || "N/A"}
                    </p>
                  </div>
                  <span className="text-2xl text-slate-300">📞</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Account Role
                    </p>
                    <p className="text-base font-bold text-slate-800 mt-1 capitalize">
                      {user.role || "User"}
                    </p>
                  </div>
                  <span className="text-2xl text-slate-300">🛡️</span>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-slate-500 hover:text-indigo-600 text-sm font-semibold transition"
              >
                ← Back
              </button>

              <button
                onClick={() => navigate(user.role === "admin" ? "/admin-dashboard" : "/my-complaints")}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition"
              >
                {user.role === "admin" ? "Go to Admin Dashboard →" : "View My Complaints →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
