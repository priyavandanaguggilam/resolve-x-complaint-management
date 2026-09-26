import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

// Helper: Format complaint date into human-readable date group
function getDateGroupLabel(dateString) {
  if (!dateString) return "Earlier Complaints";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Earlier Complaints";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) {
    return "Today";
  } else if (isSameDay(date, yesterday)) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
}

function AdminDashboard() {
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState("complaints"); // "complaints" | "settings"

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

  // Settings & Preferences (Persisted in localStorage)
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("admin_view_mode") || "grouped";
  });
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(() => {
    return localStorage.getItem("admin_autorefresh") || "off";
  });
  const [soundAlerts, setSoundAlerts] = useState(() => {
    return localStorage.getItem("admin_sound_alert") === "true";
  });

  const prevComplaintsCount = useRef(0);

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
  const storedUser = useMemo(() => {
    try {
      const u = localStorage.getItem("user");
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      navigate("/login");
      return;
    }
    if (storedUser.role !== "admin") {
      navigate("/");
    }
  }, [navigate, storedUser]);

  // =====================================================
  // NOTIFICATION HANDLER
  // =====================================================
  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  }, []);

  // =====================================================
  // FETCH ALL COMPLAINTS (DATABASE)
  // =====================================================
  const fetchComplaints = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      let fetchedComplaints = [];

      // Try primary API client with auto-refresh interceptors
      try {
        const response = await api.get("/complaints/all");
        if (response.data && Array.isArray(response.data.complaints)) {
          fetchedComplaints = response.data.complaints;
        }
      } catch (clientError) {
        console.warn("api.get failed, trying fallback:", clientError.message);
      }

      // Fallback direct fetch if primary didn't load array
      if (fetchedComplaints.length === 0) {
        const directResponse = await fetch("http://localhost:5000/api/complaints/all", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (directResponse.ok) {
          const data = await directResponse.json();
          fetchedComplaints = data.complaints || [];
        }
      }

      // Check if new complaints arrived for sound alert
      if (
        soundAlerts &&
        prevComplaintsCount.current > 0 &&
        fetchedComplaints.length > prevComplaintsCount.current
      ) {
        try {
          const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/S4YBsHNJ3b9LphHAc3m9z0uGAbBzad2/S4YBsHN5zc9LhhGwc4ndv0uGAbBzec3PS4YBsH");
          audio.play().catch(() => {});
        } catch {}
      }
      prevComplaintsCount.current = fetchedComplaints.length;

      setComplaints(fetchedComplaints);
    } catch (error) {
      console.error("Fetch complaints error:", error);
      if (!isSilent) {
        showNotification("Failed to load records from database. Please check connection.", "error");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [navigate, showNotification, soundAlerts]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // =====================================================
  // AUTO REFRESH TIMER
  // =====================================================
  useEffect(() => {
    if (autoRefreshInterval === "off") return;

    const seconds = parseInt(autoRefreshInterval, 10);
    if (!seconds || isNaN(seconds)) return;

    const interval = setInterval(() => {
      fetchComplaints(true);
    }, seconds * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchComplaints]);

  // =====================================================
  // CONSISTENT HUMAN-READABLE REFERENCE ID MAPPING
  // =====================================================
  // Sort all complaints chronologically by createdAt (ascending)
  // Oldest complaint receives RX-0001, second receives RX-0002, etc.
  // This stays 100% deterministic and persistent across page refreshes and filters.
  const referenceIdMap = useMemo(() => {
    const map = {};
    const chronological = [...complaints].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return String(a._id).localeCompare(String(b._id));
    });

    chronological.forEach((item, index) => {
      map[item._id] = `RX-${String(index + 1).padStart(4, "0")}`;
    });

    return map;
  }, [complaints]);

  // Helper to safely get human-readable reference number
  const getRefNumber = useCallback(
    (id) => {
      return referenceIdMap[id] || "RX-0000";
    },
    [referenceIdMap]
  );

  // =====================================================
  // UPDATE COMPLAINT STATUS
  // =====================================================
  const updateStatus = async (complaintId, newStatus, remarks = "") => {
    try {
      setUpdatingStatusId(complaintId);
      const token = localStorage.getItem("token");

      const payload = { status: newStatus };
      if (remarks) payload.adminRemarks = remarks;

      let success = false;

      try {
        const res = await api.put(`/complaints/${complaintId}/status`, payload);
        if (res.status === 200) success = true;
      } catch {
        const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) success = true;
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

        const ref = getRefNumber(complaintId);
        showNotification(`${ref} status updated to "${newStatus}"`);
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
        if (res.status === 200) success = true;
      } catch {
        const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}/priority`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priority: newPriority }),
        });
        if (res.ok) success = true;
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

        const ref = getRefNumber(complaintId);
        showNotification(`${ref} priority updated to "${newPriority}"`);
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
      showNotification("Official admin remarks saved successfully");
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
  const pendingCount = complaints.filter(
    (c) => c.status === "Pending" || c.status === "Submitted"
  ).length;
  const inProgressCount = complaints.filter(
    (c) => c.status === "In Progress" || c.status === "Under Review"
  ).length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const rejectedCount = complaints.filter((c) => c.status === "Rejected").length;

  // =====================================================
  // FILTERING & ORDERING (NEWEST TO OLDEST)
  // =====================================================
  const filteredAndSortedComplaints = useMemo(() => {
    // 1. Filter
    const filtered = complaints.filter((complaint) => {
      const categoryMatch =
        selectedCategory === "All" ||
        complaint.category === selectedCategory ||
        (selectedCategory === "Network/WiFi" &&
          (complaint.category === "Network/WiFi" || complaint.category === "Wi-Fi / Network"));

      let statusMatch = true;
      if (selectedStatus === "Pending") {
        statusMatch = complaint.status === "Pending" || complaint.status === "Submitted";
      } else if (selectedStatus === "In Progress") {
        statusMatch = complaint.status === "In Progress" || complaint.status === "Under Review";
      } else if (selectedStatus !== "All") {
        statusMatch = complaint.status === selectedStatus;
      }

      const priorityMatch =
        selectedPriority === "All" || complaint.priority === selectedPriority;

      const search = searchTerm.toLowerCase().trim();
      const humanRef = referenceIdMap[complaint._id]?.toLowerCase() || "";

      const searchMatch =
        !search ||
        humanRef.includes(search) ||
        complaint.name?.toLowerCase().includes(search) ||
        complaint.category?.toLowerCase().includes(search) ||
        complaint.roomNumber?.toString().toLowerCase().includes(search) ||
        complaint.bedNumber?.toString().toLowerCase().includes(search) ||
        complaint.description?.toLowerCase().includes(search) ||
        complaint.user?.email?.toLowerCase().includes(search);

      return categoryMatch && statusMatch && priorityMatch && searchMatch;
    });

    // 2. Strict Newest-to-Oldest ordering based on createdAt
    return filtered.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [
    complaints,
    selectedCategory,
    selectedStatus,
    selectedPriority,
    searchTerm,
    referenceIdMap,
  ]);

  // =====================================================
  // DAY-BY-DAY COMPLAINT GROUPING
  // =====================================================
  const groupedComplaints = useMemo(() => {
    const groups = {};
    const groupOrder = [];

    filteredAndSortedComplaints.forEach((item) => {
      const label = getDateGroupLabel(item.createdAt);
      if (!groups[label]) {
        groups[label] = [];
        groupOrder.push(label);
      }
      groups[label].push(item);
    });

    return groupOrder.map((label) => ({
      dateLabel: label,
      items: groups[label],
    }));
  }, [filteredAndSortedComplaints]);

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory("All");
    setSelectedStatus("All");
    setSelectedPriority("All");
    setSearchTerm("");
  };

  // Save Settings handlers
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem("admin_view_mode", mode);
    showNotification(`View display mode set to ${mode === "grouped" ? "Day-by-Day Grouping" : "Standard List"}`);
  };

  const handleAutoRefreshChange = (val) => {
    setAutoRefreshInterval(val);
    localStorage.setItem("admin_autorefresh", val);
    showNotification(
      val === "off"
        ? "Auto-refresh disabled"
        : `Auto-refresh set to every ${val} seconds`
    );
  };

  const handleSoundAlertsToggle = () => {
    const newVal = !soundAlerts;
    setSoundAlerts(newVal);
    localStorage.setItem("admin_sound_alert", String(newVal));
    showNotification(`Audio alerts ${newVal ? "enabled" : "disabled"}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
    navigate("/login");
  };

  // Subtle Status Styles
  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
      case "Submitted":
        return "bg-amber-50/80 text-amber-800 border-amber-200";
      case "In Progress":
      case "Under Review":
        return "bg-blue-50/80 text-blue-800 border-blue-200";
      case "Resolved":
        return "bg-emerald-50/80 text-emerald-800 border-emerald-200";
      case "Rejected":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-50 text-rose-800 border-rose-200 font-semibold";
      case "High":
        return "bg-orange-50 text-orange-800 border-orange-200 font-medium";
      case "Medium":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Low":
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div
      className="admin-dashboard-root min-h-screen bg-slate-50 text-slate-900 pt-20 pb-16 antialiased"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <style>{`
        .admin-dashboard-root,
        .admin-dashboard-root * {
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
      `}</style>

      {/* =====================================================
          NOTIFICATION TOAST
      ===================================================== */}
      {notification && (
        <div
          className={`fixed top-24 right-5 sm:right-8 z-50 px-4 py-3 rounded-lg border shadow-sm text-sm font-medium transition-all ${
            notification.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
          role="status"
        >
          <div className="flex items-center gap-2.5">
            <span className="font-semibold">
              {notification.type === "error" ? "Notice:" : "Success:"}
            </span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER & TAB NAVIGATION
        ===================================================== */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 mb-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Admin Workspace
                </span>
                {autoRefreshInterval !== "off" && (
                  <span className="text-[11px] text-slate-400">
                    &bull; Auto-sync: {autoRefreshInterval}s
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                 Resolve X
              </h1>
              <p className="text-slate-600 text-sm mt-0.5">
                Monitor student complaints, manage priorities, and track resolutions.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => fetchComplaints(false)}
                disabled={loading}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Data"}
              </button>
            </div>
          </div>

          {/* MAIN TAB SWITCHER */}
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setActiveTab("complaints")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "complaints"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Complaints & Overview
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === "settings"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Settings
            </button>
          </div>
        </div>

        {/* =====================================================
            TAB 1: COMPLAINTS & OVERVIEW
        ===================================================== */}
        {activeTab === "complaints" && (
          <>
            {/* OVERVIEW / STATISTICS (Uniform Minimal Palette) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
              {/* TOTAL */}
              <div
                onClick={() => {
                  setSelectedStatus("All");
                  setSelectedCategory("All");
                }}
                className={`cursor-pointer bg-white border rounded-xl p-4 transition ${
                  selectedStatus === "All" && selectedCategory === "All"
                    ? "border-slate-800 ring-1 ring-slate-800"
                    : "border-slate-200/90 hover:border-slate-400"
                }`}
              >
                <div className="text-xs font-medium text-slate-500">Total Complaints</div>
                <div className="text-2xl font-bold text-slate-900 mt-1.5">
                  {loading ? "-" : totalCount}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">All logged records</div>
              </div>

              {/* PENDING */}
              <div
                onClick={() => setSelectedStatus("Pending")}
                className={`cursor-pointer bg-white border rounded-xl p-4 transition ${
                  selectedStatus === "Pending"
                    ? "border-amber-600 ring-1 ring-amber-600"
                    : "border-slate-200/90 hover:border-slate-400"
                }`}
              >
                <div className="text-xs font-medium text-slate-700">Pending Action</div>
                <div className="text-2xl font-bold text-slate-900 mt-1.5">
                  {loading ? "-" : pendingCount}
                </div>
                <div className="text-[11px] text-amber-800 mt-1">Awaiting inspection</div>
              </div>

              {/* IN PROGRESS */}
              <div
                onClick={() => setSelectedStatus("In Progress")}
                className={`cursor-pointer bg-white border rounded-xl p-4 transition ${
                  selectedStatus === "In Progress"
                    ? "border-blue-600 ring-1 ring-blue-600"
                    : "border-slate-200/90 hover:border-slate-400"
                }`}
              >
                <div className="text-xs font-medium text-slate-700">In Progress</div>
                <div className="text-2xl font-bold text-slate-900 mt-1.5">
                  {loading ? "-" : inProgressCount}
                </div>
                <div className="text-[11px] text-blue-800 mt-1">Active resolution</div>
              </div>

              {/* RESOLVED */}
              <div
                onClick={() => setSelectedStatus("Resolved")}
                className={`cursor-pointer bg-white border rounded-xl p-4 transition ${
                  selectedStatus === "Resolved"
                    ? "border-emerald-600 ring-1 ring-emerald-600"
                    : "border-slate-200/90 hover:border-slate-400"
                }`}
              >
                <div className="text-xs font-medium text-slate-700">Resolved</div>
                <div className="text-2xl font-bold text-slate-900 mt-1.5">
                  {loading ? "-" : resolvedCount}
                </div>
                <div className="text-[11px] text-emerald-800 mt-1">Successfully closed</div>
              </div>

              {/* REJECTED */}
              <div
                onClick={() => setSelectedStatus("Rejected")}
                className={`cursor-pointer bg-white border rounded-xl p-4 transition col-span-2 sm:col-span-1 ${
                  selectedStatus === "Rejected"
                    ? "border-slate-800 ring-1 ring-slate-800"
                    : "border-slate-200/90 hover:border-slate-400"
                }`}
              >
                <div className="text-xs font-medium text-slate-700">Rejected</div>
                <div className="text-2xl font-bold text-slate-900 mt-1.5">
                  {loading ? "-" : rejectedCount}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Invalid or duplicate</div>
              </div>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 mb-6 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-end">
                {/* SEARCH */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Search Records
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ref ID, student, room..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                  />
                </div>

                {/* CATEGORY */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
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

                {/* STATUS */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
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

                {/* PRIORITY & RESET */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Priority
                  </label>
                  <div className="flex items-center gap-2">
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
                        className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition whitespace-nowrap"
                        title="Clear filters"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100 gap-2">
                <div>
                  Showing <span className="font-semibold text-slate-800">{filteredAndSortedComplaints.length}</span> of{" "}
                  <span className="font-semibold text-slate-800">{complaints.length}</span> complaints
                  &bull; Ordered <span className="font-medium text-slate-700">Newest to Oldest</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400">Display:</span>
                  <button
                    onClick={() => handleViewModeChange("grouped")}
                    className={`text-xs font-medium px-2 py-0.5 rounded transition ${
                      viewMode === "grouped"
                        ? "bg-slate-200 text-slate-900 font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Day-by-Day
                  </button>
                  <button
                    onClick={() => handleViewModeChange("flat")}
                    className={`text-xs font-medium px-2 py-0.5 rounded transition ${
                      viewMode === "flat"
                        ? "bg-slate-200 text-slate-900 font-semibold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Flat List
                  </button>
                </div>
              </div>
            </div>

            {/* COMPLAINTS CONTENT */}
            {loading ? (
              <div className="bg-white border border-slate-200/90 rounded-xl p-16 text-center shadow-xs">
                <div className="inline-block w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Loading complaints...
                </p>
              </div>
            ) : filteredAndSortedComplaints.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-xl p-16 text-center shadow-xs">
                <h3 className="text-lg font-bold text-slate-900">No Complaints Found</h3>
                <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  No records match your selected category, status, priority, or search parameters.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === "grouped" ? (
              // ==========================================
              // DAY-BY-DAY GROUPED VIEW
              // ==========================================
              <div className="space-y-6">
                {groupedComplaints.map((group) => (
                  <div key={group.dateLabel}>
                    {/* Date Header Divider */}
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                        {group.dateLabel}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700 font-semibold">
                        {group.items.length}
                      </span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    {/* Complaint Cards for this Day */}
                    <div className="space-y-3">
                      {group.items.map((item) => (
                        <ComplaintCard
                          key={item._id}
                          item={item}
                          refId={getRefNumber(item._id)}
                          updatingStatusId={updatingStatusId}
                          updatingPriorityId={updatingPriorityId}
                          updateStatus={updateStatus}
                          updatePriority={updatePriority}
                          onOpenDetails={() => {
                            setActiveModalComplaint(item);
                            setModalRemark(item.adminRemarks || "");
                          }}
                          getStatusBadge={getStatusBadge}
                          getPriorityBadge={getPriorityBadge}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // ==========================================
              // FLAT LIST VIEW
              // ==========================================
              <div className="space-y-3">
                {filteredAndSortedComplaints.map((item) => (
                  <ComplaintCard
                    key={item._id}
                    item={item}
                    refId={getRefNumber(item._id)}
                    updatingStatusId={updatingStatusId}
                    updatingPriorityId={updatingPriorityId}
                    updateStatus={updateStatus}
                    updatePriority={updatePriority}
                    onOpenDetails={() => {
                      setActiveModalComplaint(item);
                      setModalRemark(item.adminRemarks || "");
                    }}
                    getStatusBadge={getStatusBadge}
                    getPriorityBadge={getPriorityBadge}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* =====================================================
            TAB 2: SETTINGS SECTION
        ===================================================== */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* 1. ADMIN PROFILE INFORMATION */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Administrator Profile
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Current authenticated admin account details.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <div className="text-xs font-medium text-slate-500">Name</div>
                  <div className="font-semibold text-slate-900 mt-1 truncate">
                    {storedUser?.name || "Administrator"}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <div className="text-xs font-medium text-slate-500">Email Address</div>
                  <div className="font-semibold text-slate-900 mt-1 truncate">
                    {storedUser?.email || "N/A"}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <div className="text-xs font-medium text-slate-500">Contact Phone</div>
                  <div className="font-semibold text-slate-900 mt-1">
                    {storedUser?.phone || "N/A"}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg">
                  <div className="text-xs font-medium text-slate-500">System Role</div>
                  <div className="font-semibold text-slate-900 mt-1 capitalize">
                    {storedUser?.role || "admin"}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Profile data is managed via the secure backend API.
                </span>
                <button
                  onClick={() => navigate("/profile")}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Edit Profile Details &rarr;
                </button>
              </div>
            </div>

            {/* 2. DASHBOARD & DISPLAY PREFERENCES */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Dashboard Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure complaint display, sync, and notifications.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                {/* PREFERENCE: DEFAULT VIEW MODE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-slate-200/80 rounded-lg bg-slate-50/50">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Complaint Layout Mode
                    </div>
                    <div className="text-xs text-slate-500">
                      Group complaints by day or display as a continuous list.
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleViewModeChange("grouped")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        viewMode === "grouped"
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      Day-by-Day
                    </button>
                    <button
                      onClick={() => handleViewModeChange("flat")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        viewMode === "flat"
                          ? "bg-slate-900 text-white"
                          : "bg-white border border-slate-300 text-slate-700"
                      }`}
                    >
                      Flat List
                    </button>
                  </div>
                </div>

                {/* PREFERENCE: AUTO-REFRESH */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-slate-200/80 rounded-lg bg-slate-50/50">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Background Auto-Sync
                    </div>
                    <div className="text-xs text-slate-500">
                      Automatically check for newly submitted student complaints.
                    </div>
                  </div>
                  <select
                    value={autoRefreshInterval}
                    onChange={(e) => handleAutoRefreshChange(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800 focus:outline-none"
                  >
                    <option value="off">Disabled (Manual only)</option>
                    <option value="30">Every 30 seconds</option>
                    <option value="60">Every 60 seconds</option>
                  </select>
                </div>

                {/* PREFERENCE: AUDIO ALERTS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-slate-200/80 rounded-lg bg-slate-50/50">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Audio Notification on New Issues
                    </div>
                    <div className="text-xs text-slate-500">
                      Play a subtle chime when new complaints arrive during auto-sync.
                    </div>
                  </div>
                  <button
                    onClick={handleSoundAlertsToggle}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      soundAlerts
                        ? "bg-emerald-600 text-white"
                        : "bg-white border border-slate-300 text-slate-700"
                    }`}
                  >
                    {soundAlerts ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. SESSION & SECURITY */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-3 mb-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Session & Authentication
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage active administrator session tokens.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Active JWT Session
                  </div>
                  <div className="text-xs text-slate-500">
                    Your session is authenticated with role verification against MongoDB.
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-semibold text-xs rounded-lg transition"
                >
                  End Admin Session (Logout)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            FOOTER
        ===================================================== */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>Resolve X Complaint Management System &bull; Admin Portal</div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Home Page
            </button>
            <button
              onClick={() => setActiveTab("complaints")}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Complaints
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className="text-slate-600 hover:text-slate-900 font-medium"
            >
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          COMPLAINT DETAILS & REMARKS MODAL
      ===================================================== */}
      {activeModalComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
          onClick={() => setActiveModalComplaint(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div>
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {getRefNumber(activeModalComplaint._id)}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Complaint Details & Audit
                </h2>
              </div>
              <button
                onClick={() => setActiveModalComplaint(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold px-2 py-1"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            {/* METADATA GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs mb-4">
              <div>
                <span className="text-slate-500 uppercase font-medium">Student Name:</span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">
                  {activeModalComplaint.name || activeModalComplaint.user?.name || "Student"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-medium">Email:</span>
                <p className="font-medium text-slate-800 text-xs mt-0.5 truncate">
                  {activeModalComplaint.user?.email || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-medium">Phone:</span>
                <p className="font-medium text-slate-800 text-xs mt-0.5">
                  {activeModalComplaint.user?.phone || activeModalComplaint.phone || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-medium">Location:</span>
                <p className="font-semibold text-slate-900 text-xs mt-0.5">
                  Room {activeModalComplaint.roomNumber || "N/A"}, Bed {activeModalComplaint.bedNumber || "N/A"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-medium">Category:</span>
                <p className="font-semibold text-slate-900 text-xs mt-0.5">
                  {activeModalComplaint.category === "Network/WiFi" ? "Wi-Fi / Network" : activeModalComplaint.category}
                </p>
              </div>
              <div>
                <span className="text-slate-500 uppercase font-medium">Submitted Time:</span>
                <p className="font-medium text-slate-800 text-xs mt-0.5">
                  {activeModalComplaint.createdAt
                    ? new Date(activeModalComplaint.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="mb-4">
              <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Issue Description
              </div>
              <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm leading-relaxed whitespace-pre-wrap">
                {activeModalComplaint.description}
              </div>
            </div>

            {/* STATUS AND PRIORITY CONTROLS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Update Status
                </label>
                <select
                  value={activeModalComplaint.status}
                  disabled={updatingStatusId === activeModalComplaint._id}
                  onChange={(e) => updateStatus(activeModalComplaint._id, e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg border font-semibold bg-white ${getStatusBadge(
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Update Priority
                </label>
                <select
                  value={activeModalComplaint.priority || "Medium"}
                  disabled={updatingPriorityId === activeModalComplaint._id}
                  onChange={(e) => updatePriority(activeModalComplaint._id, e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg border font-semibold bg-white ${getPriorityBadge(
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
              <div className="mb-4">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Status History Trail
                </div>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-36 overflow-y-auto">
                  {activeModalComplaint.statusHistory.map((history, idx) => (
                    <div key={idx} className="p-2.5 text-xs flex items-start justify-between bg-white">
                      <div>
                        <span className="font-semibold text-slate-800">{history.status}</span>
                        {history.remarks && (
                          <span className="text-slate-600 ml-2">&bull; {history.remarks}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 whitespace-nowrap ml-2">
                        {history.changedAt
                          ? new Date(history.changedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ADMIN REMARKS INPUT */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Official Admin Remarks
              </label>
              <textarea
                rows={2}
                value={modalRemark}
                onChange={(e) => setModalRemark(e.target.value)}
                placeholder="Enter action taken, technician note, or resolution justification..."
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-slate-600"
              />
              <button
                type="button"
                disabled={savingRemark || !modalRemark.trim()}
                onClick={handleSaveRemark}
                className="mt-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
              >
                {savingRemark ? "Saving Remarks..." : "Save Remarks"}
              </button>
            </div>

            {/* CLOSE */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalComplaint(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
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

// =====================================================
// SUBCOMPONENT: RESPONSIVE COMPLAINT CARD / ROW
// =====================================================
function ComplaintCard({
  item,
  refId,
  updatingStatusId,
  updatingPriorityId,
  updateStatus,
  updatePriority,
  onOpenDetails,
  getStatusBadge,
  getPriorityBadge,
}) {
  const timeFormatted = item.createdAt
    ? new Date(item.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* LEFT COLUMN: REF ID, TIME, STUDENT, ROOM */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          {/* Reference badge */}
          <div className="shrink-0 flex flex-col items-center justify-center w-20 py-2 px-1 bg-slate-50 border border-slate-200 rounded-lg text-center">
            <span className="text-xs font-bold text-slate-900 font-mono">
              {refId}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              {timeFormatted}
            </span>
          </div>

          {/* Student & Room details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {item.name || item.user?.name || "Student"}
              </span>
              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {item.category === "Network/WiFi" ? "Wi-Fi / Network" : item.category}
              </span>
            </div>

            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
              <span>
                Room: <strong className="text-slate-800">{item.roomNumber || "N/A"}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Bed: <strong className="text-slate-800">{item.bedNumber || "N/A"}</strong>
              </span>
              {item.user?.email && (
                <>
                  <span>&bull;</span>
                  <span className="truncate max-w-xs">{item.user.email}</span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-1.5 line-clamp-1 max-w-2xl">
              {item.description}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: PRIORITY, STATUS, ACTIONS */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
          {/* Priority selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 lg:hidden">Priority:</span>
            <select
              value={item.priority || "Medium"}
              disabled={updatingPriorityId === item._id}
              onChange={(e) => updatePriority(item._id, e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium bg-white focus:outline-none disabled:opacity-50 ${getPriorityBadge(
                item.priority || "Medium"
              )}`}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 lg:hidden">Status:</span>
            <select
              value={item.status}
              disabled={updatingStatusId === item._id}
              onChange={(e) => updateStatus(item._id, e.target.value)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold bg-white focus:outline-none disabled:opacity-50 ${getStatusBadge(
                item.status
              )}`}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Details modal button */}
          <button
            onClick={onOpenDetails}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;