import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function AdminDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Update states
  const [updatingStatusId, setUpdatingStatusId] = useState("");
  const [updatingPriorityId, setUpdatingPriorityId] = useState("");

  // Modal for details & remarks
  const [activeModalComplaint, setActiveModalComplaint] = useState(null);
  const [modalRemark, setModalRemark] = useState("");
  const [savingRemark, setSavingRemark] = useState(false);

  const categories = [
    "All",
    "Electricity",
    "Plumbing",
    "Network/WiFi",
    "Carpenter",
    "Cleaning",
    "Food",
  ];

  const statuses = [
    "All",
    "Pending",
    "In Progress",
    "Resolved",
    "Rejected",
  ];

  const priorities = [
    "All",
    "Low",
    "Medium",
    "High",
    "Critical",
  ];

  // =====================================================
  // ADMIN AUTHENTICATION CHECK
  // =====================================================
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!storedUser || !token) {
        navigate("/login");
        return;
      }

      const user = JSON.parse(storedUser);
      if (user.role !== "admin") {
        navigate("/");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // =====================================================
  // NOTIFICATION HANDLER
  // =====================================================
  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // =====================================================
  // FETCH ALL COMPLAINTS (DATABASE)
  // =====================================================
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Try primary API client with auto-refresh interceptors
      try {
        const response = await api.get("/complaints/all");
        if (response.data && Array.isArray(response.data.complaints)) {
          setComplaints(response.data.complaints);
          return;
        }
      } catch (clientError) {
        console.warn("api.get failed, attempting direct fetch fallback:", clientError.message);
      }

      // Fallback direct fetch
      const directResponse = await fetch("http://localhost:5000/api/complaints/all", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!directResponse.ok) {
        const errData = await directResponse.json().catch(() => ({}));
        showNotification(errData.message || "Failed to load complaints from database", "error");
        return;
      }

      const data = await directResponse.json();
      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Fetch complaints error:", error);
      showNotification("Database connection error. Please verify server status.", "error");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // =====================================================
  // UPDATE COMPLAINT STATUS
  // =====================================================
  const updateStatus = async (complaintId, newStatus, remarks = "") => {
    try {
      setUpdatingStatusId(complaintId);
      const token = localStorage.getItem("token");

      const payload = {
        status: newStatus,
      };
      if (remarks) {
        payload.adminRemarks = remarks;
      }

      let success = false;

      // Primary attempt via api client
      try {
        const res = await api.put(`/complaints/${complaintId}/status`, payload);
        if (res.status === 200) {
          success = true;
        }
      } catch {
        // Fallback direct fetch
        const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          success = true;
        }
      }

      if (success) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === complaintId
              ? {
                  ...c,
                  status: newStatus,
                  adminRemarks: remarks || c.adminRemarks,
                  statusHistory: [
                    ...(c.statusHistory || []),
                    {
                      status: newStatus,
                      changedAt: new Date().toISOString(),
                      remarks: remarks || `Status changed to ${newStatus}`,
                    },
                  ],
                }
              : c
          )
        );

        if (activeModalComplaint && activeModalComplaint._id === complaintId) {
          setActiveModalComplaint((prev) => ({
            ...prev,
            status: newStatus,
            adminRemarks: remarks || prev.adminRemarks,
          }));
        }

        showNotification(`Status updated to "${newStatus}"`);
      } else {
        showNotification("Failed to update complaint status", "error");
      }
    } catch (error) {
      console.error("Status update error:", error);
      showNotification("Error communicating with server", "error");
    } finally {
      setUpdatingStatusId("");
    }
  };

  // =====================================================
  // UPDATE COMPLAINT PRIORITY
  // =====================================================
  const updatePriority = async (complaintId, newPriority) => {
    try {
      setUpdatingPriorityId(complaintId);
      const token = localStorage.getItem("token");

      let success = false;

      try {
        const res = await api.put(`/complaints/${complaintId}/priority`, {
          priority: newPriority,
        });
        if (res.status === 200) {
          success = true;
        }
      } catch {
        const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}/priority`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priority: newPriority }),
        });
        if (res.ok) {
          success = true;
        }
      }

      if (success) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === complaintId
              ? {
                  ...c,
                  priority: newPriority,
                }
              : c
          )
        );

        if (activeModalComplaint && activeModalComplaint._id === complaintId) {
          setActiveModalComplaint((prev) => ({
            ...prev,
            priority: newPriority,
          }));
        }

        showNotification(`Priority updated to "${newPriority}"`);
      } else {
        showNotification("Failed to update priority", "error");
      }
    } catch (error) {
      console.error("Priority update error:", error);
      showNotification("Error communicating with server", "error");
    } finally {
      setUpdatingPriorityId("");
    }
  };

  // =====================================================
  // SAVE ADMIN REMARKS
  // =====================================================
  const handleSaveRemark = async () => {
    if (!activeModalComplaint || !modalRemark.trim()) return;

    try {
      setSavingRemark(true);
      await updateStatus(
        activeModalComplaint._id,
        activeModalComplaint.status,
        modalRemark.trim()
      );
      setModalRemark("");
      showNotification("Admin remarks saved successfully");
    } catch (error) {
      console.error("Remarks save error:", error);
      showNotification("Failed to save remarks", "error");
    } finally {
      setSavingRemark(false);
    }
  };

  // =====================================================
  // STATISTICAL COUNTS
  // =====================================================
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "Pending" || c.status === "Submitted").length;
  const inProgressCount = complaints.filter((c) => c.status === "In Progress" || c.status === "Under Review").length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const rejectedCount = complaints.filter((c) => c.status === "Rejected").length;

  // =====================================================
  // FILTERED COMPLAINTS
  // =====================================================
  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      // Category filter
      const categoryMatch =
        selectedCategory === "All" ||
        complaint.category === selectedCategory ||
        (selectedCategory === "Network/WiFi" && (complaint.category === "Network/WiFi" || complaint.category === "Wi-Fi / Network"));

      // Status filter
      let statusMatch = true;
      if (selectedStatus === "Pending") {
        statusMatch = complaint.status === "Pending" || complaint.status === "Submitted";
      } else if (selectedStatus === "In Progress") {
        statusMatch = complaint.status === "In Progress" || complaint.status === "Under Review";
      } else if (selectedStatus !== "All") {
        statusMatch = complaint.status === selectedStatus;
      }

      // Priority filter
      const priorityMatch =
        selectedPriority === "All" ||
        complaint.priority === selectedPriority;

      // Search term filter
      const search = searchTerm.toLowerCase().trim();
      const searchMatch =
        !search ||
        complaint.name?.toLowerCase().includes(search) ||
        complaint.category?.toLowerCase().includes(search) ||
        complaint.roomNumber?.toString().toLowerCase().includes(search) ||
        complaint.bedNumber?.toString().toLowerCase().includes(search) ||
        complaint.description?.toLowerCase().includes(search) ||
        complaint.user?.email?.toLowerCase().includes(search) ||
        complaint.user?.phone?.toString().toLowerCase().includes(search) ||
        complaint._id?.toLowerCase().includes(search);

      return categoryMatch && statusMatch && priorityMatch && searchMatch;
    });
  }, [complaints, selectedCategory, selectedStatus, selectedPriority, searchTerm]);

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedStatus("All");
    setSelectedPriority("All");
    setSearchTerm("");
  };

  // Badge styles
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
      case "Submitted":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "In Progress":
      case "Under Review":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "Resolved":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "Rejected":
        return "bg-rose-50 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-300 font-bold";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-300 font-semibold";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Low":
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div
      className="admin-dashboard-container min-h-screen bg-slate-50 pt-20 pb-16 text-slate-900"
      style={{ fontFamily: "'Times New Roman', Times, serif" }}
    >
      <style>{`
        .admin-dashboard-container,
        .admin-dashboard-container * {
          font-family: 'Times New Roman', Times, serif !important;
        }
      `}</style>

      {/* =====================================================
          NOTIFICATION TOAST
      ===================================================== */}
      {notification && (
        <div
          className={`fixed top-24 right-6 z-50 px-5 py-3.5 rounded-lg border shadow-lg transition-all ${
            notification.type === "error"
              ? "bg-rose-50 border-rose-300 text-rose-900"
              : "bg-emerald-50 border-emerald-300 text-emerald-900"
          }`}
          role="alert"
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-sm">
              {notification.type === "error" ? "Notice:" : "Success:"}
            </span>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER SECTION
        ===================================================== */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
                Administration Portal
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Resolve X — Complaint Management Dashboard
              </h1>
              <p className="text-slate-600 text-base mt-1">
                Centralized monitoring, verification, and resolution records for hostel complaints.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={fetchComplaints}
                disabled={loading}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold px-4 py-2.5 rounded-lg transition disabled:opacity-50 text-sm shadow-sm"
              >
                {loading ? "Refreshing..." : "Refresh Records"}
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            STATISTICS CARDS
        ===================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {/* TOTAL */}
          <div
            onClick={() => {
              setSelectedStatus("All");
              setSelectedCategory("All");
            }}
            className={`cursor-pointer bg-white border rounded-xl p-5 shadow-sm transition hover:border-slate-400 ${
              selectedStatus === "All" && selectedCategory === "All"
                ? "border-slate-800 ring-1 ring-slate-800"
                : "border-slate-200"
            }`}
          >
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Complaints
            </div>
            <div className="text-3xl font-bold text-slate-900 mt-2">
              {loading ? "..." : totalCount}
            </div>
            <div className="text-xs text-slate-500 mt-2">All registered issues</div>
          </div>

          {/* PENDING */}
          <div
            onClick={() => setSelectedStatus("Pending")}
            className={`cursor-pointer bg-white border rounded-xl p-5 shadow-sm transition hover:border-amber-400 ${
              selectedStatus === "Pending"
                ? "border-amber-600 ring-1 ring-amber-600"
                : "border-slate-200"
            }`}
          >
            <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Pending Action
            </div>
            <div className="text-3xl font-bold text-amber-700 mt-2">
              {loading ? "..." : pendingCount}
            </div>
            <div className="text-xs text-amber-700 mt-2">Awaiting inspection</div>
          </div>

          {/* IN PROGRESS */}
          <div
            onClick={() => setSelectedStatus("In Progress")}
            className={`cursor-pointer bg-white border rounded-xl p-5 shadow-sm transition hover:border-blue-400 ${
              selectedStatus === "In Progress"
                ? "border-blue-600 ring-1 ring-blue-600"
                : "border-slate-200"
            }`}
          >
            <div className="text-xs font-semibold text-blue-800 uppercase tracking-wider">
              In Progress
            </div>
            <div className="text-3xl font-bold text-blue-700 mt-2">
              {loading ? "..." : inProgressCount}
            </div>
            <div className="text-xs text-blue-700 mt-2">Currently being serviced</div>
          </div>

          {/* RESOLVED */}
          <div
            onClick={() => setSelectedStatus("Resolved")}
            className={`cursor-pointer bg-white border rounded-xl p-5 shadow-sm transition hover:border-emerald-400 ${
              selectedStatus === "Resolved"
                ? "border-emerald-600 ring-1 ring-emerald-600"
                : "border-slate-200"
            }`}
          >
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Resolved
            </div>
            <div className="text-3xl font-bold text-emerald-700 mt-2">
              {loading ? "..." : resolvedCount}
            </div>
            <div className="text-xs text-emerald-700 mt-2">Successfully closed</div>
          </div>

          {/* REJECTED */}
          <div
            onClick={() => setSelectedStatus("Rejected")}
            className={`cursor-pointer bg-white border rounded-xl p-5 shadow-sm transition hover:border-rose-400 ${
              selectedStatus === "Rejected"
                ? "border-rose-600 ring-1 ring-rose-600"
                : "border-slate-200"
            }`}
          >
            <div className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Rejected
            </div>
            <div className="text-3xl font-bold text-rose-700 mt-2">
              {loading ? "..." : rejectedCount}
            </div>
            <div className="text-xs text-rose-700 mt-2">Closed as invalid / duplicate</div>
          </div>
        </div>

        {/* =====================================================
            SEARCH & FILTER CONTROLS
        ===================================================== */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            {/* SEARCH */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Search Records
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Student, room, keyword..."
                className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
              />
            </div>

            {/* CATEGORY FILTER */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-slate-600"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "Network/WiFi" ? "Wi-Fi / Network" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS FILTER */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-slate-600"
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st === "All" ? "All Statuses" : st}
                  </option>
                ))}
              </select>
            </div>

            {/* PRIORITY FILTER */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Priority
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:outline-none focus:border-slate-600"
                >
                  {priorities.map((pr) => (
                    <option key={pr} value={pr}>
                      {pr === "All" ? "All Priorities" : pr}
                    </option>
                  ))}
                </select>

                {(selectedCategory !== "All" ||
                  selectedStatus !== "All" ||
                  selectedPriority !== "All" ||
                  searchTerm) && (
                  <button
                    onClick={resetFilters}
                    title="Reset all filters"
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 whitespace-nowrap transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-900">{filteredComplaints.length}</span> of{" "}
              <span className="font-bold text-slate-900">{complaints.length}</span> complaints
            </div>
            {searchTerm && (
              <div>
                Filtered by keyword: <span className="italic">"{searchTerm}"</span>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================
            COMPLAINTS TABLE / LIST
        ===================================================== */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
              <p className="mt-3 text-sm font-medium text-slate-600">
                Fetching complaint records from database...
              </p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="py-20 px-4 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-xl font-bold text-slate-900">No Complaints Found</h3>
                <p className="text-sm text-slate-500 mt-2">
                  No records match your selected category, status, priority, or search parameters.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-5 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Ref ID / Date</th>
                    <th className="py-3.5 px-4">Student Details</th>
                    <th className="py-3.5 px-4">Room & Bed</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Priority</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredComplaints.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* REF ID / DATE */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="font-mono text-xs text-slate-500">
                          #{item._id ? item._id.slice(-6).toUpperCase() : "N/A"}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString()
                            : "N/A"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </div>
                      </td>

                      {/* STUDENT DETAILS */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-900">
                          {item.name || item.user?.name || "Student"}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {item.user?.email || "No email"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.user?.phone || item.phone || "No phone"}
                        </div>
                      </td>

                      {/* ROOM & BED */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <div className="text-xs text-slate-900 font-medium">
                          Room: <span className="font-bold">{item.roomNumber || "N/A"}</span>
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          Bed: <span className="font-bold">{item.bedNumber || "N/A"}</span>
                        </div>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-semibold text-slate-800">
                          {item.category === "Network/WiFi" ? "Wi-Fi / Network" : item.category}
                        </span>
                      </td>

                      {/* DESCRIPTION */}
                      <td className="py-4 px-4 align-top max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        {item.adminRemarks && (
                          <div className="mt-1.5 text-[11px] text-indigo-900 bg-indigo-50 border border-indigo-200 p-1.5 rounded">
                            <span className="font-bold">Admin Remark: </span>
                            {item.adminRemarks}
                          </div>
                        )}
                      </td>

                      {/* PRIORITY SELECTOR */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <select
                          value={item.priority || "Medium"}
                          disabled={updatingPriorityId === item._id}
                          onChange={(e) => updatePriority(item._id, e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded border font-semibold bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:opacity-50 ${getPriorityBadgeClass(
                            item.priority || "Medium"
                          )}`}
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </td>

                      {/* STATUS SELECTOR */}
                      <td className="py-4 px-4 align-top whitespace-nowrap">
                        <select
                          value={item.status}
                          disabled={updatingStatusId === item._id}
                          onChange={(e) => updateStatus(item._id, e.target.value)}
                          className={`text-xs px-2.5 py-1.5 rounded border font-bold bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 disabled:opacity-50 ${getStatusBadgeClass(
                            item.status
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setActiveModalComplaint(item);
                            setModalRemark(item.adminRemarks || "");
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded text-xs font-semibold transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* =====================================================
            FOOTER / NAVIGATION SHORTCUTS
        ===================================================== */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-200">
          <div>Resolve X Management System &bull; Active Admin Session</div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <button
              onClick={() => navigate("/")}
              className="text-slate-700 hover:underline font-semibold"
            >
              Home Page
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          COMPLAINT DETAILS & REMARKS MODAL
      ===================================================== */}
      {activeModalComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setActiveModalComplaint(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
              <div>
                <span className="text-xs font-mono text-slate-500">
                  Ref #{activeModalComplaint._id}
                </span>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  Complaint Details & Management
                </h2>
              </div>
              <button
                onClick={() => setActiveModalComplaint(null)}
                className="text-slate-400 hover:text-slate-700 text-2xl font-bold px-2"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* METADATA GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-5">
              <div>
                <span className="text-slate-500 uppercase font-semibold">Student Name:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {activeModalComplaint.name || activeModalComplaint.user?.name || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Email:</span>
                <p className="font-medium text-slate-800 text-sm mt-0.5 break-all">
                  {activeModalComplaint.user?.email || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Phone:</span>
                <p className="font-medium text-slate-800 text-sm mt-0.5">
                  {activeModalComplaint.user?.phone || activeModalComplaint.phone || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Location:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  Room {activeModalComplaint.roomNumber || "N/A"}, Bed {activeModalComplaint.bedNumber || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Category:</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {activeModalComplaint.category}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-semibold">Submitted On:</span>
                <p className="font-medium text-slate-800 text-sm mt-0.5">
                  {activeModalComplaint.createdAt
                    ? new Date(activeModalComplaint.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* COMPLAINT DESCRIPTION */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Issue Description
              </h4>
              <div className="p-4 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {activeModalComplaint.description}
              </div>
            </div>

            {/* STATUS AND PRIORITY CONTROLS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Change Complaint Status
                </label>
                <select
                  value={activeModalComplaint.status}
                  disabled={updatingStatusId === activeModalComplaint._id}
                  onChange={(e) => updateStatus(activeModalComplaint._id, e.target.value)}
                  className={`w-full text-sm px-3 py-2 rounded-lg border font-bold bg-white ${getStatusBadgeClass(
                    activeModalComplaint.status
                  )}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Change Complaint Priority
                </label>
                <select
                  value={activeModalComplaint.priority || "Medium"}
                  disabled={updatingPriorityId === activeModalComplaint._id}
                  onChange={(e) => updatePriority(activeModalComplaint._id, e.target.value)}
                  className={`w-full text-sm px-3 py-2 rounded-lg border font-semibold bg-white ${getPriorityBadgeClass(
                    activeModalComplaint.priority || "Medium"
                  )}`}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* STATUS AUDIT LOG */}
            {activeModalComplaint.statusHistory && activeModalComplaint.statusHistory.length > 0 && (
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Status History Log
                </h4>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {activeModalComplaint.statusHistory.map((history, idx) => (
                    <div key={idx} className="p-2.5 text-xs flex items-start justify-between bg-white">
                      <div>
                        <span className="font-bold text-slate-800">
                          {history.status}
                        </span>
                        {history.remarks && (
                          <span className="text-slate-600 ml-2">
                            &bull; {history.remarks}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 whitespace-nowrap ml-2">
                        {history.changedAt
                          ? new Date(history.changedAt).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ADMIN REMARKS INPUT */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Add Official Admin Remarks
              </label>
              <textarea
                rows={3}
                value={modalRemark}
                onChange={(e) => setModalRemark(e.target.value)}
                placeholder="Enter remarks, maintenance notes, or reason for resolution/rejection..."
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
              />
              <button
                type="button"
                disabled={savingRemark || !modalRemark.trim()}
                onClick={handleSaveRemark}
                className="mt-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow-sm"
              >
                {savingRemark ? "Saving Remarks..." : "Save Admin Remarks"}
              </button>
            </div>

            {/* MODAL ACTIONS */}
            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalComplaint(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-sm font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;