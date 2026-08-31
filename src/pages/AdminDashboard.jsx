import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const categories = [
    { name: "All", icon: "📋" },
    { name: "Electricity", icon: "💡" },
    { name: "Plumbing", icon: "🚰" },
    { name: "Network/WiFi", icon: "📶" },
    { name: "Carpenter", icon: "🪚" },
    { name: "Cleaning", icon: "🧹" },
    { name: "Food", icon: "🍱" },
  ];

  // =====================================================
  // ADMIN PROTECTION
  // =====================================================

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "admin") {
      navigate("/");
    }
  }, [navigate]);

  // =====================================================
  // NOTIFICATION
  // =====================================================

  const showNotification = (message, type = "success") => {
    setNotification({
      message,
      type,
    });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // =====================================================
  // FETCH ALL COMPLAINTS
  // =====================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/complaints/all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showNotification(
          data.message || "Failed to fetch complaints",
          "error"
        );
        return;
      }

      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Fetch complaints error:", error);

      showNotification(
        "Unable to connect to server",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // =====================================================
  // UPDATE COMPLAINT STATUS
  // =====================================================

  const updateStatus = async (complaintId, newStatus) => {
    try {
      setUpdatingId(complaintId);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/complaints/${complaintId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showNotification(
          data.message || "Failed to update status",
          "error"
        );
        return;
      }

      setComplaints((previousComplaints) =>
        previousComplaints.map((complaint) =>
          complaint._id === complaintId
            ? {
                ...complaint,
                status: newStatus,
              }
            : complaint
        )
      );

      showNotification(
        `Complaint marked as ${newStatus}`
      );
    } catch (error) {
      console.error("Status update error:", error);

      showNotification(
        "Unable to connect to server",
        "error"
      );
    } finally {
      setUpdatingId("");
    }
  };

  // =====================================================
  // CATEGORY COUNT
  // =====================================================

  const getCategoryCount = (category) => {
    if (category === "All") {
      return complaints.length;
    }

    return complaints.filter(
      (complaint) =>
        complaint.category === category
    ).length;
  };

  // =====================================================
  // STATUS COUNTS
  // =====================================================

  const pendingCount = complaints.filter(
    (complaint) =>
      complaint.status === "Pending"
  ).length;

  const inProgressCount = complaints.filter(
    (complaint) =>
      complaint.status === "In Progress"
  ).length;

  const resolvedCount = complaints.filter(
    (complaint) =>
      complaint.status === "Resolved"
  ).length;

  // =====================================================
  // FILTER COMPLAINTS
  // =====================================================

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const categoryMatch =
        selectedCategory === "All" ||
        complaint.category === selectedCategory;

      const statusMatch =
        selectedStatus === "All" ||
        complaint.status === selectedStatus;

      const search =
        searchTerm.toLowerCase().trim();

      const searchMatch =
        !search ||
        complaint.category
          ?.toLowerCase()
          .includes(search) ||
        complaint.name
          ?.toLowerCase()
          .includes(search) ||
        complaint.roomNumber
          ?.toString()
          .includes(search) ||
        complaint.bedNumber
          ?.toString()
          .includes(search) ||
        complaint.description
          ?.toLowerCase()
          .includes(search);

      return (
        categoryMatch &&
        statusMatch &&
        searchMatch
      );
    });
  }, [
    complaints,
    selectedCategory,
    selectedStatus,
    searchTerm,
  ]);

  // =====================================================
  // CATEGORY ICON
  // =====================================================

  const getCategoryIcon = (category) => {
    const found = categories.find(
      (item) => item.name === category
    );

    return found?.icon || "📋";
  };

  // =====================================================
  // STATUS STYLING
  // =====================================================

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusDot = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-500";

      case "In Progress":
        return "bg-blue-500";

      case "Resolved":
        return "bg-emerald-500";

      default:
        return "bg-gray-400";
    }
  };

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSelectedCategory("All");
    setSelectedStatus("All");
    setSearchTerm("");
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12">

      {/* =================================================
          NOTIFICATION
      ================================================= */}

      {notification && (
        <div
          className={`fixed top-24 right-5 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border ${
            notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-white border-emerald-200 text-emerald-700"
          }`}
        >
          <span className="text-xl">
            {notification.type === "error"
              ? "⚠️"
              : "✓"}
          </span>

          <span className="font-semibold text-sm">
            {notification.message}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">

          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

              <div>

                <div className="flex items-center gap-2 mb-3">

                  <span className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></span>

                  <span className="text-sm font-semibold text-white/80">
                    ADMIN PANEL
                  </span>

                </div>

                <h1 className="text-3xl sm:text-4xl font-black">
                  Complaint Dashboard
                </h1>

                <p className="text-white/80 mt-2">
                  Monitor, manage and resolve hostel complaints.
                </p>

              </div>

              <button
                onClick={fetchComplaints}
                className="bg-white/15 backdrop-blur-md border border-white/30 text-white px-5 py-3 rounded-xl font-bold hover:bg-white/25 transition"
              >
                ↻ Refresh
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        {!loading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

            {/* TOTAL */}

            <button
              onClick={() => {
                setSelectedCategory("All");
                setSelectedStatus("All");
              }}
              className="group text-left bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-500">
                    Total Complaints
                  </p>

                  <h2 className="text-3xl font-black text-slate-900 mt-2">
                    {complaints.length}
                  </h2>

                </div>

                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  📋
                </div>

              </div>

              <p className="text-xs text-slate-400 mt-4">
                All categories
              </p>

            </button>

            {/* PENDING */}

            <button
              onClick={() =>
                setSelectedStatus("Pending")
              }
              className="group text-left bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-500">
                    Pending
                  </p>

                  <h2 className="text-3xl font-black text-amber-600 mt-2">
                    {pendingCount}
                  </h2>

                </div>

                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  ⏳
                </div>

              </div>

              <p className="text-xs text-amber-600 mt-4">
                Need attention
              </p>

            </button>

            {/* IN PROGRESS */}

            <button
              onClick={() =>
                setSelectedStatus("In Progress")
              }
              className="group text-left bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-500">
                    In Progress
                  </p>

                  <h2 className="text-3xl font-black text-blue-600 mt-2">
                    {inProgressCount}
                  </h2>

                </div>

                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  🔄
                </div>

              </div>

              <p className="text-xs text-blue-600 mt-4">
                Currently working
              </p>

            </button>

            {/* RESOLVED */}

            <button
              onClick={() =>
                setSelectedStatus("Resolved")
              }
              className="group text-left bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-xl transition"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="text-sm font-semibold text-slate-500">
                    Resolved
                  </p>

                  <h2 className="text-3xl font-black text-emerald-600 mt-2">
                    {resolvedCount}
                  </h2>

                </div>

                <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl group-hover:scale-110 transition">
                  ✓
                </div>

              </div>

              <p className="text-xs text-emerald-600 mt-4">
                Successfully completed
              </p>

            </button>

          </div>
        )}

        {/* =================================================
            MAIN AREA
        ================================================= */}

        <div className="grid lg:grid-cols-[240px_1fr] gap-6">

          {/* =================================================
              CATEGORY MENU
          ================================================= */}

          {!loading && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-fit lg:sticky lg:top-28">

              <div className="px-2 mb-4">

                <h2 className="text-lg font-black text-slate-900">
                  Categories
                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  Filter by complaint type
                </p>

              </div>

              <div className="space-y-2">

                {categories.map((category) => (

                  <button
                    key={category.name}
                    onClick={() => {
                      setSelectedCategory(category.name);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition ${
                      selectedCategory === category.name
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <span className="text-xl">
                        {category.icon}
                      </span>

                      <span className="font-semibold text-sm">
                        {category.name}
                      </span>

                    </div>

                    <span
                      className={`min-w-7 h-7 px-2 rounded-lg flex items-center justify-center text-xs font-bold ${
                        selectedCategory === category.name
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {getCategoryCount(category.name)}
                    </span>

                  </button>

                ))}

              </div>

            </div>
          )}

          {/* =================================================
              COMPLAINT CONTENT
          ================================================= */}

          <div>

            {/* =================================================
                FILTER BAR
            ================================================= */}

            {!loading && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-5">

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                  <div>

                    <div className="flex items-center gap-2">

                      <span className="text-2xl">
                        {getCategoryIcon(selectedCategory)}
                      </span>

                      <h2 className="text-xl font-black text-slate-900">
                        {selectedCategory === "All"
                          ? "All Complaints"
                          : `${selectedCategory} Complaints`}
                      </h2>

                    </div>

                    <p className="text-sm text-slate-500 mt-1">
                      Showing{" "}
                      <span className="font-bold text-slate-700">
                        {filteredComplaints.length}
                      </span>{" "}
                      complaint
                      {filteredComplaints.length !== 1
                        ? "s"
                        : ""}
                    </p>

                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">

                    {/* SEARCH */}

                    <div className="relative">

                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        🔍
                      </span>

                      <input
                        type="text"
                        placeholder="Search complaints..."
                        value={searchTerm}
                        onChange={(e) =>
                          setSearchTerm(e.target.value)
                        }
                        className="w-full sm:w-60 pl-11 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />

                    </div>

                    {/* STATUS */}

                    <select
                      value={selectedStatus}
                      onChange={(e) =>
                        setSelectedStatus(e.target.value)
                      }
                      className="px-4 py-3 border border-slate-200 rounded-xl bg-white font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    >

                      <option value="All">
                        All Status
                      </option>

                      <option value="Pending">
                        ⏳ Pending
                      </option>

                      <option value="In Progress">
                        🔄 In Progress
                      </option>

                      <option value="Resolved">
                        ✓ Resolved
                      </option>

                    </select>

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                LOADING
            ================================================= */}

            {loading && (
              <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">

                <div className="inline-block w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>

                <h3 className="text-lg font-bold text-slate-800 mt-5">
                  Loading complaints
                </h3>

                <p className="text-slate-500 mt-1">
                  Please wait...
                </p>

              </div>
            )}

            {/* =================================================
                EMPTY
            ================================================= */}

            {!loading &&
              filteredComplaints.length === 0 && (

                <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">

                  <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-100 flex items-center justify-center text-4xl">
                    📭
                  </div>

                  <h2 className="text-xl font-black text-slate-900 mt-5">
                    No Complaints Found
                  </h2>

                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    There are no complaints matching your current category, status or search filters.
                  </p>

                  <button
                    onClick={clearFilters}
                    className="mt-6 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-indigo-700 transition"
                  >
                    Clear Filters
                  </button>

                </div>
              )}

            {/* =================================================
                COMPLAINT LIST
            ================================================= */}

            {!loading &&
              filteredComplaints.length > 0 && (

                <div className="space-y-4">

                  {filteredComplaints.map(
                    (complaint) => (

                      <div
                        key={complaint._id}
                        className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition p-5 sm:p-6"
                      >

                        {/* =================================================
                            TOP SECTION
                        ================================================= */}

                        <div className="flex flex-col md:flex-row md:justify-between gap-5">

                          <div className="flex gap-4">

                            {/* ICON */}

                            <div className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl">
                              {getCategoryIcon(
                                complaint.category
                              )}
                            </div>

                            {/* DETAILS */}

                            <div>

                              <div className="flex flex-wrap items-center gap-3">

                                <h3 className="text-xl font-black text-slate-900">
                                  {complaint.category}
                                </h3>

                                <span
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(
                                    complaint.status
                                  )}`}
                                >

                                  <span
                                    className={`w-2 h-2 rounded-full ${getStatusDot(
                                      complaint.status
                                    )}`}
                                  ></span>

                                  {complaint.status}

                                </span>

                              </div>

                              <p className="text-slate-500 text-sm mt-2">

                                <span className="font-semibold text-slate-700">
                                  👤{" "}
                                  {complaint.name ||
                                    "N/A"}
                                </span>

                                <span className="mx-2 text-slate-300">
                                  •
                                </span>

                                Room{" "}
                                {complaint.roomNumber ||
                                  "N/A"}

                                <span className="mx-2 text-slate-300">
                                  •
                                </span>

                                Bed{" "}
                                {complaint.bedNumber ||
                                  "N/A"}

                              </p>

                            </div>

                          </div>

                          {/* DATE */}

                          <div className="text-left md:text-right">

                            <p className="text-xs font-bold tracking-wider text-slate-400">
                              SUBMITTED
                            </p>

                            <p className="text-sm text-slate-600 mt-1">
                              {new Date(
                                complaint.createdAt
                              ).toLocaleString()}
                            </p>

                          </div>

                        </div>

                        {/* =================================================
                            DESCRIPTION
                        ================================================= */}

                        <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-100">

                          <p className="text-xs font-black tracking-wider text-slate-400 mb-2">
                            COMPLAINT DESCRIPTION
                          </p>

                          <p className="text-slate-700 leading-relaxed">
                            {complaint.description}
                          </p>

                        </div>

                        {/* =================================================
                            STATUS UPDATE
                        ================================================= */}

                        <div className="mt-5 pt-5 border-t border-slate-100">

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div className="flex items-center gap-3">

                              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                ⚙️
                              </div>

                              <div>

                                <p className="text-sm font-bold text-slate-800">
                                  Manage Complaint
                                </p>

                                <p className="text-xs text-slate-400">
                                  Update current status
                                </p>

                              </div>

                            </div>

                            <select
                              value={
                                complaint.status
                              }
                              disabled={
                                updatingId ===
                                complaint._id
                              }
                              onChange={(e) =>
                                updateStatus(
                                  complaint._id,
                                  e.target.value
                                )
                              }
                              className={`px-4 py-3 min-w-[180px] border rounded-xl bg-white font-bold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${getStatusStyle(
                                complaint.status
                              )}`}
                            >

                              <option value="Pending">
                                ⏳ Pending
                              </option>

                              <option value="In Progress">
                                🔄 In Progress
                              </option>

                              <option value="Resolved">
                                ✓ Resolved
                              </option>

                            </select>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>
              )}

          </div>

        </div>

        {/* =================================================
            BACK TO HOME
        ================================================= */}

        <div className="mt-10 text-center">

          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-semibold transition"
          >
            ← Back to Home
          </button>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;