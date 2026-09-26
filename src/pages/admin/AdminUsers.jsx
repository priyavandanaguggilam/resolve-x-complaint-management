import React, { useEffect, useState, useMemo } from "react";
import api from "../../api/client";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // User Complaints Modal
  const [viewingUser, setViewingUser] = useState(null);
  const [userComplaints, setUserComplaints] = useState([]);
  const [loadingUserComplaints, setLoadingUserComplaints] = useState(false);

  // Status toggle confirm
  const [togglingUser, setTogglingUser] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Notification
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers(res.data.users || []);
    } catch (error) {
      console.error("Error loading users for admin:", error);
      showNotification("Failed to load users directory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openUserComplaints = async (user) => {
    setViewingUser(user);
    try {
      setLoadingUserComplaints(true);
      const res = await api.get(`/admin/users/${user.id}/complaints`);
      setUserComplaints(res.data.complaints || []);
    } catch (error) {
      console.error("Error loading user complaints:", error);
      showNotification("Could not load complaints for this user", "error");
    } finally {
      setLoadingUserComplaints(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!togglingUser) return;
    const newStatus = togglingUser.status === "active" ? "disabled" : "active";

    try {
      setUpdatingStatus(true);
      await api.put(`/admin/users/${togglingUser.id}/status`, {
        status: newStatus,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === togglingUser.id ? { ...u, status: newStatus } : u
        )
      );

      showNotification(
        `User ${togglingUser.name} has been ${
          newStatus === "active" ? "activated" : "disabled"
        }`
      );
      setTogglingUser(null);
    } catch (error) {
      console.error("Status toggle error:", error);
      const msg = error.response?.data?.message || "Failed to update user status";
      showNotification(msg, "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const statusMatch =
        statusFilter === "All" || (u.status || "active") === statusFilter;

      const q = searchTerm.toLowerCase().trim();
      const searchMatch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q);

      return statusMatch && searchMatch;
    });
  }, [users, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Registered Users Directory
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Monitor registered student accounts, inspect submitted issues, and manage system access
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 w-fit"
        >
          <span>↻</span> Refresh Users
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by student name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Accounts</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500 text-xs font-semibold">
              Loading users records...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-base font-bold text-slate-800">No Users Found</h3>
            <p className="text-slate-400 text-xs mt-1">
              No registered user records match your search query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">Role</th>
                  <th className="py-3.5 px-5">Account Status</th>
                  <th className="py-3.5 px-5 text-center">Complaints (Resolved/Total)</th>
                  <th className="py-3.5 px-5">Registered Date</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.map((u) => {
                  const isActive = (u.status || "active") === "active";
                  const isAdmin = u.role === "admin";

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-indigo-50/40 transition duration-150"
                    >
                      {/* Name */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                            {(u.name || "U").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">
                              {u.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {u.id?.slice(-6)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="text-slate-800 font-medium">{u.email}</div>
                        <div className="text-[10px] text-slate-400">
                          📞 {u.phone || "No phone"}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          ></span>
                          {isActive ? "Active" : "Disabled"}
                        </span>
                      </td>

                      {/* Complaints Counts */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <button
                          onClick={() => openUserComplaints(u)}
                          className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 font-bold text-xs transition"
                        >
                          {u.resolvedComplaints} / {u.totalComplaints}
                        </button>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => openUserComplaints(u)}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-xl font-bold text-xs transition"
                        >
                          Issues ({u.totalComplaints})
                        </button>

                        {!isAdmin && (
                          <button
                            onClick={() => setTogglingUser(u)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                              isActive
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            {isActive ? "Disable" : "Enable"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= USER COMPLAINTS MODAL ================= */}
      {viewingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  User Issue Portfolio
                </span>
                <h3 className="text-lg font-black mt-1">
                  Complaints filed by {viewingUser.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {viewingUser.email} • {viewingUser.phone}
                </p>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {loadingUserComplaints ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  Loading complaints list...
                </div>
              ) : userComplaints.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500">
                  This user has not submitted any complaints yet.
                </div>
              ) : (
                userComplaints.map((c) => (
                  <div
                    key={c._id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {c.category}
                        </span>
                        <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-200 text-slate-700">
                          Room {c.roomNumber}, Bed {c.bedNumber}
                        </span>
                      </div>
                      <span className="font-bold text-indigo-600 text-[11px]">
                        {c.status}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {c.description}
                    </p>
                    <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-200">
                      <span>Priority: {c.priority || "Medium"}</span>
                      <span>
                        Date: {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 text-right">
              <button
                onClick={() => setViewingUser(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOGGLE STATUS CONFIRM MODAL ================= */}
      {togglingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-2">
              Confirm Account Status Change
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Are you sure you want to{" "}
              <strong>
                {togglingUser.status === "active" ? "disable" : "activate"}
              </strong>{" "}
              the account for <strong>{togglingUser.name}</strong> (
              {togglingUser.email})?
              {togglingUser.status === "active" &&
                " The user will not be able to log in or submit issues while disabled."}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTogglingUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={updatingStatus}
                className={`px-5 py-2 rounded-xl font-bold text-xs text-white transition shadow disabled:opacity-50 ${
                  togglingUser.status === "active"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {updatingStatus ? "Updating..." : "Confirm Action"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
