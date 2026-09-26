import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/client";

function AdminComplaints() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters from URL or default state
  const statusParam = searchParams.get("status") || "All";
  const priorityParam = searchParams.get("priority") || "All";
  const categoryParam = searchParams.get("category") || "All";

  const [selectedStatus, setSelectedStatus] = useState(statusParam);
  const [selectedPriority, setSelectedPriority] = useState(priorityParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Selected complaint for status & details modal
  const [activeModalComplaint, setActiveModalComplaint] = useState(null);
  const [modalNewStatus, setModalNewStatus] = useState("");
  const [modalNewPriority, setModalNewPriority] = useState("");
  const [modalRemarks, setModalRemarks] = useState("");
  const [updating, setUpdating] = useState(false);

  // Toast notification
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get("/complaints/all");
      setComplaints(res.data.complaints || []);
    } catch (error) {
      console.error("Error fetching complaints for admin:", error);
      showNotification("Failed to load complaints from server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Update filters if searchParams change externally (e.g. from sidebar links)
  useEffect(() => {
    if (searchParams.get("status")) {
      setSelectedStatus(searchParams.get("status"));
    }
    if (searchParams.get("priority")) {
      setSelectedPriority(searchParams.get("priority"));
    }
    if (searchParams.get("category")) {
      setSelectedCategory(searchParams.get("category"));
    }
  }, [searchParams]);

  // Open modal for complaint
  const openManageModal = (complaint) => {
    setActiveModalComplaint(complaint);
    setModalNewStatus(complaint.status || "Pending");
    setModalNewPriority(complaint.priority || "Medium");
    setModalRemarks(complaint.adminRemarks || "");
  };

  const closeModal = () => {
    setActiveModalComplaint(null);
    setModalRemarks("");
  };

  // Submit status & priority update
  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    if (!activeModalComplaint) return;

    try {
      setUpdating(true);

      // Update status if changed or remarks provided
      await api.put(`/complaints/${activeModalComplaint._id}/status`, {
        status: modalNewStatus,
        adminRemarks: modalRemarks,
      });

      // Update priority if changed
      if (modalNewPriority !== activeModalComplaint.priority) {
        await api.put(`/complaints/${activeModalComplaint._id}/priority`, {
          priority: modalNewPriority,
        });
      }

      // Update local state
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === activeModalComplaint._id
            ? {
                ...c,
                status: modalNewStatus,
                priority: modalNewPriority,
                adminRemarks: modalRemarks,
                statusHistory: [
                  ...(c.statusHistory || []),
                  {
                    status: modalNewStatus,
                    changedAt: new Date(),
                    remarks: modalRemarks,
                  },
                ],
              }
            : c
        )
      );

      showNotification(`Complaint updated successfully!`);
      closeModal();
    } catch (error) {
      console.error("Update error:", error);
      const msg = error.response?.data?.message || "Failed to update complaint";
      showNotification(msg, "error");
    } finally {
      setUpdating(false);
    }
  };

  // Inline priority changer
  const handleInlinePriorityChange = async (complaintId, newPriority) => {
    try {
      await api.put(`/complaints/${complaintId}/priority`, {
        priority: newPriority,
      });

      setComplaints((prev) =>
        prev.map((c) =>
          c._id === complaintId ? { ...c, priority: newPriority } : c
        )
      );

      showNotification(`Priority updated to ${newPriority}`);
    } catch (error) {
      console.error("Inline priority error:", error);
      showNotification("Failed to update priority", "error");
    }
  };

  // Filter & Sort Logic
  const filteredComplaints = useMemo(() => {
    return complaints
      .filter((c) => {
        // Status filter
        const statusMatch =
          selectedStatus === "All" ||
          (selectedStatus === "Pending"
            ? ["Pending", "Submitted"].includes(c.status)
            : c.status === selectedStatus);

        // Priority filter
        const priorityMatch =
          selectedPriority === "All" ||
          (c.priority || "Medium") === selectedPriority;

        // Category filter
        const categoryMatch =
          selectedCategory === "All" || c.category === selectedCategory;

        // Search text filter
        const q = searchTerm.toLowerCase().trim();
        const searchMatch =
          !q ||
          c._id?.toLowerCase().includes(q) ||
          c.name?.toLowerCase().includes(q) ||
          c.roomNumber?.toString().includes(q) ||
          c.bedNumber?.toString().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.user?.email?.toLowerCase().includes(q) ||
          c.user?.phone?.includes(q);

        return statusMatch && priorityMatch && categoryMatch && searchMatch;
      })
      .sort((a, b) => {
        if (sortBy === "oldest") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        // newest first
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [
    complaints,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    searchTerm,
    sortBy,
  ]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Pending":
      case "Submitted":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Under Review":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Resolved":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Rejected":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
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

  const clearAllFilters = () => {
    setSelectedStatus("All");
    setSelectedPriority("All");
    setSelectedCategory("All");
    setSearchTerm("");
    setSortBy("newest");
    setSearchParams({});
  };

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
            Complaints Management Console
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Review all submitted student complaints, enforce status updates, and assign priority
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchComplaints}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
          >
            <span>↻</span> Refresh
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by student, ID, room, or issue..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">⏳ Pending / Submitted</option>
              <option value="Under Review">🔍 Under Review</option>
              <option value="In Progress">🔄 In Progress</option>
              <option value="Resolved">✓ Resolved</option>
              <option value="Rejected">✕ Rejected</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">🔴 Critical</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Categories</option>
              <option value="Electricity">💡 Electricity</option>
              <option value="Plumbing">🚰 Plumbing</option>
              <option value="Network/WiFi">📶 Network / WiFi</option>
              <option value="Carpenter">🪚 Carpenter</option>
              <option value="Cleaning">🧹 Cleaning</option>
              <option value="Food">🍱 Food</option>
              <option value="Other">📌 Other</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-slate-800 font-bold">
                {filteredComplaints.length}
              </strong>{" "}
              of {complaints.length} complaints
            </span>
            {(selectedStatus !== "All" ||
              selectedPriority !== "All" ||
              selectedCategory !== "All" ||
              searchTerm) && (
              <button
                onClick={clearAllFilters}
                className="text-indigo-600 hover:text-indigo-800 font-semibold underline ml-2"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Complaints Data Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500 text-xs font-semibold">
              Loading complaints records...
            </p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-base font-bold text-slate-800">
              No Matching Complaints
            </h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              No complaint records meet the criteria. Try clearing filters.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-mono">ID & Date</th>
                  <th className="py-3.5 px-4">Student Info</th>
                  <th className="py-3.5 px-4">Room / Bed</th>
                  <th className="py-3.5 px-4">Category & Issue</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredComplaints.map((c) => (
                  <tr
                    key={c._id}
                    className="hover:bg-indigo-50/40 transition duration-150"
                  >
                    {/* ID & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px] font-bold text-slate-800 block">
                        #{c._id?.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs">
                        {c.name || "Student"}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.user?.email || "No email"}
                      </div>
                      {c.user?.phone && (
                        <div className="text-[10px] text-slate-400">
                          📞 {c.user.phone}
                        </div>
                      )}
                    </td>

                    {/* Room & Bed */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-800">
                      <span className="bg-slate-100 px-2 py-1 rounded text-[11px] font-bold">
                        R-{c.roomNumber} / B-{c.bedNumber}
                      </span>
                    </td>

                    {/* Category & Description */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 text-xs block">
                        {c.category}
                      </span>
                      <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5 leading-relaxed">
                        {c.description}
                      </p>
                      {c.adminRemarks && (
                        <div className="text-[10px] text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded mt-1.5 font-medium inline-block">
                          Note: {c.adminRemarks}
                        </div>
                      )}
                    </td>

                    {/* Priority (with fast inline change) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={c.priority || "Medium"}
                        onChange={(e) =>
                          handleInlinePriorityChange(c._id, e.target.value)
                        }
                        className={`text-[11px] px-2 py-1 rounded-lg border font-bold outline-none cursor-pointer ${getPriorityBadgeClass(
                          c.priority || "Medium"
                        )}`}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => openManageModal(c)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
                      >
                        Manage ⚙️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= COMPLAINT MANAGEMENT MODAL ================= */}
      {activeModalComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Complaint #{activeModalComplaint._id}
                </span>
                <h3 className="text-xl font-black mt-1">
                  Manage {activeModalComplaint.category} Issue
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Student & Location Details Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px]">
                    Student Name
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {activeModalComplaint.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px]">
                    Room & Bed
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    Room {activeModalComplaint.roomNumber}, Bed{" "}
                    {activeModalComplaint.bedNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px]">
                    Submission Date
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {new Date(activeModalComplaint.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px]">
                    Contact Phone
                  </span>
                  <span className="font-semibold text-slate-700 block">
                    {activeModalComplaint.user?.phone || "N/A"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 uppercase tracking-wider block font-bold text-[10px]">
                    Email
                  </span>
                  <span className="font-semibold text-slate-700 block truncate">
                    {activeModalComplaint.user?.email || "N/A"}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Complaint Description
                </label>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-700 leading-relaxed">
                  {activeModalComplaint.description}
                </div>
              </div>

              {/* Update Controls Form */}
              <form onSubmit={handleUpdateComplaint} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Update Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modalNewStatus}
                      onChange={(e) => setModalNewStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    >
                      <option value="Pending">⏳ Pending / Submitted</option>
                      <option value="Under Review">🔍 Under Review</option>
                      <option value="In Progress">🔄 In Progress</option>
                      <option value="Resolved">✓ Resolved</option>
                      <option value="Rejected">✕ Rejected</option>
                    </select>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Assign Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={modalNewPriority}
                      onChange={(e) => setModalNewPriority(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      required
                    >
                      <option value="Low">🟢 Low</option>
                      <option value="Medium">🟡 Medium</option>
                      <option value="High">🟠 High</option>
                      <option value="Critical">🔴 Critical (Urgent)</option>
                    </select>
                  </div>
                </div>

                {/* Remarks Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Administrator Notes / Action Taken
                  </label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Electrician assigned, scheduled for inspection at 4 PM..."
                    value={modalRemarks}
                    onChange={(e) => setModalRemarks(e.target.value)}
                    className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-800"
                  ></textarea>
                  <p className="text-[10px] text-slate-400 mt-1">
                    This note will be visible to the student on their complaint tracking page.
                  </p>
                </div>

                {/* Status Timeline History Log */}
                {activeModalComplaint.statusHistory &&
                  activeModalComplaint.statusHistory.length > 0 && (
                    <div className="pt-2">
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Lifecycle History Log
                      </span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {activeModalComplaint.statusHistory.map((h, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] flex justify-between"
                          >
                            <span className="font-semibold text-slate-700">
                              • {h.status}: {h.remarks || "Status modified"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(h.changedAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow disabled:opacity-50"
                  >
                    {updating ? "Saving Changes..." : "Save Status & Priority"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminComplaints;
