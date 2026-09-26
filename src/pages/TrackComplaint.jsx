import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function TrackComplaint() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const fetchComplaints = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/complaints/user/${user.id}`);
      const list = res.data.complaints || [];
      setComplaints(list);
      if (list.length > 0) {
        setSelectedComplaint(list[0]);
      }
    } catch (error) {
      console.error("Error loading complaints for tracker:", error);
      setErrorMsg("Failed to load your complaints list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchId.trim().toLowerCase();
    if (!query) return;

    const found = complaints.find(
      (c) =>
        c._id?.toLowerCase() === query ||
        c._id?.toLowerCase().includes(query) ||
        c.category?.toLowerCase().includes(query)
    );

    if (found) {
      setSelectedComplaint(found);
      setErrorMsg("");
    } else {
      setErrorMsg("No complaint matching that ID was found in your account.");
    }
  };

  const getStatusColor = (status) => {
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

  const getTimelineSteps = (complaint) => {
    if (!complaint) return [];
    const isRejected = complaint.status === "Rejected";

    if (isRejected) {
      return [
        { key: "Submitted", label: "Submitted", desc: "Complaint lodged" },
        { key: "Under Review", label: "Under Review", desc: "Investigating" },
        { key: "Rejected", label: "Rejected", desc: "Cannot be processed" },
      ];
    }

    return [
      { key: "Submitted", label: "Submitted", desc: "Complaint lodged in system" },
      { key: "Under Review", label: "Under Review", desc: "Assigned & reviewing" },
      { key: "In Progress", label: "In Progress", desc: "Work is ongoing" },
      { key: "Resolved", label: "Resolved", desc: "Issue fixed" },
    ];
  };

  const isStepDone = (stepKey, currentStatus) => {
    const order = ["Submitted", "Pending", "Under Review", "In Progress", "Resolved"];
    const cur = currentStatus === "Pending" ? "Submitted" : currentStatus;
    const st = stepKey === "Pending" ? "Submitted" : stepKey;
    return order.indexOf(st) <= order.indexOf(cur);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mb-3">
            📍
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Track Complaint Status
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto">
            Live lifecycle tracker for your registered hostel maintenance complaints
          </p>
        </div>

        {/* Search by ID Bar */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-slate-400">🔍</span>
            <input
              type="text"
              placeholder="Paste Complaint ID to track directly..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-11 pr-28 py-3.5 bg-white border border-slate-300 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
            />
            <button
              type="submit"
              className="absolute right-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow"
            >
              Track
            </button>
          </div>
          {errorMsg && (
            <p className="text-xs text-rose-600 font-semibold mt-2 text-center">
              ⚠️ {errorMsg}
            </p>
          )}
        </form>

        {loading ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500 text-sm font-medium">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center max-w-md mx-auto shadow-sm">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-lg font-bold text-slate-800">No Complaints Found</h3>
            <p className="text-slate-500 text-xs mt-1">
              You haven't submitted any complaints to track yet.
            </p>
            <button
              onClick={() => navigate("/complaint")}
              className="mt-5 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow hover:scale-105 transition"
            >
              Submit a Complaint
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-[300px_1fr] gap-6">
            {/* Sidebar list of user's complaints */}
            <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm h-fit">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 mb-3">
                Your Complaints ({complaints.length})
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {complaints.map((c) => {
                  const selected = selectedComplaint?._id === c._id;
                  return (
                    <button
                      key={c._id}
                      onClick={() => setSelectedComplaint(c)}
                      className={`w-full text-left p-3.5 rounded-2xl transition border ${
                        selected
                          ? "bg-indigo-50/80 border-indigo-200 shadow-sm"
                          : "bg-slate-50/60 border-slate-100 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900 truncate">
                          {c.category}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(
                            c.status
                          )}`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {c.description}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono">
                        {new Date(c.createdAt).toLocaleDateString()} • Room {c.roomNumber}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected complaint details & live tracker */}
            {selectedComplaint && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-black text-slate-900">
                        {selectedComplaint.category}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          selectedComplaint.status
                        )}`}
                      >
                        {selectedComplaint.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Complaint ID: {selectedComplaint._id}
                    </p>
                  </div>

                  <span className="text-xs font-semibold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 w-fit">
                    Room {selectedComplaint.roomNumber} • Bed {selectedComplaint.bedNumber}
                  </span>
                </div>

                {/* Stepper Progress */}
                <div className="my-8">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
                    Live Progress Stepper
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {getTimelineSteps(selectedComplaint).map((step, idx) => {
                      const done = isStepDone(step.key, selectedComplaint.status);
                      const isCurrent =
                        (selectedComplaint.status === "Pending" &&
                          step.key === "Submitted") ||
                        selectedComplaint.status === step.key;

                      return (
                        <div
                          key={step.key}
                          className={`p-4 rounded-2xl border text-center transition ${
                            isCurrent
                              ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                              : done
                              ? "bg-emerald-50/60 border-emerald-200"
                              : "bg-slate-50 border-slate-200 opacity-60"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                              done
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-300 text-slate-600"
                            }`}
                          >
                            {done ? "✓" : idx + 1}
                          </div>
                          <p className="text-xs font-bold text-slate-800">
                            {step.label}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {step.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Description & Remarks */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Student Description
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {selectedComplaint.description}
                    </p>
                  </div>

                  {selectedComplaint.adminRemarks && (
                    <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
                      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                        Administrator Notes
                      </p>
                      <p className="text-sm text-indigo-900 leading-relaxed">
                        {selectedComplaint.adminRemarks}
                      </p>
                    </div>
                  )}

                  {/* Status History (if any) */}
                  {selectedComplaint.statusHistory &&
                    selectedComplaint.statusHistory.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Event Log
                        </p>
                        <div className="space-y-2">
                          {selectedComplaint.statusHistory.map((h, i) => (
                            <div
                              key={i}
                              className="text-xs flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600"
                            >
                              <span className="font-semibold text-slate-800">
                                • {h.status}: {h.remarks || "Status updated"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(h.changedAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => navigate("/my-complaints")}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition"
                  >
                    ← View All in My Complaints
                  </button>

                  <button
                    onClick={() => navigate("/complaint")}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow"
                  >
                    Submit New Issue
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TrackComplaint;