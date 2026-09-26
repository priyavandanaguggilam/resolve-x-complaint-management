import React, { useState } from "react";
import api from "../../api/client";

function AdminProfile() {
  const [admin, setAdmin] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(admin.name || "");
  const [phone, setPhone] = useState(admin.phone || "");
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      showNotification("Name cannot be empty", "error");
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      showNotification("Phone number must be 10 digits", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await api.put("/auth/profile", {
        name: name.trim(),
        phone: phone.trim(),
      });

      const updated = res.data.user;
      localStorage.setItem("user", JSON.stringify(updated));
      setAdmin(updated);
      setIsEditing(false);
      window.dispatchEvent(new Event("userChanged"));

      showNotification("Administrator details saved successfully!");
    } catch (error) {
      console.error("Admin profile save error:", error);
      const msg = error.response?.data?.message || "Failed to update profile";
      showNotification(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-2xl shadow-xl font-semibold flex items-center gap-3 border ${
            notification.type === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <span>{notification.type === "error" ? "⚠️" : "✓"}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Administrator Settings & Profile
        </h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Manage system administrator credentials, security access, and server preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-black shadow-lg">
              {(admin.name || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black">{admin.name || "Administrator"}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{admin.email}</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Super Administrator
              </span>
            </div>
          </div>

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              Edit Details
            </button>
          )}
        </div>

        <div className="p-6 sm:p-8">
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={admin.email}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 bg-slate-100 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Phone (10 digits)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Name
                </span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {admin.name}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Email
                </span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {admin.email}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Phone
                </span>
                <span className="font-bold text-slate-800 text-sm mt-1 block">
                  {admin.phone || "Not set"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                  Security Clearance
                </span>
                <span className="font-bold text-emerald-600 text-sm mt-1 block">
                  Full Administrative Privileges
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status Indicators Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          System Environment Health
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="block font-bold">MongoDB Database</span>
            <span className="text-[11px] text-emerald-600">Connected & Synced</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800">
            <span className="block font-bold">API Gateway</span>
            <span className="text-[11px] text-indigo-600">Port 5000 (Operational)</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-800">
            <span className="block font-bold">Token Engine</span>
            <span className="text-[11px] text-purple-600">JWT 15m / 30d Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;
