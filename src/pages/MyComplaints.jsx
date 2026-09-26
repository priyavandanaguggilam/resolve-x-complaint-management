import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function MyComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Rating states
  const [selectedRating, setSelectedRating] = useState({});
  const [feedback, setFeedback] = useState({});
  const [submittingRating, setSubmittingRating] = useState({});
  const [ratedComplaints, setRatedComplaints] = useState({});
  const [submittedRatings, setSubmittedRatings] = useState({});
  const [ratingMessage, setRatingMessage] = useState({});
  const [ratingError, setRatingError] = useState({});

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  })();

  const fetchUserData = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      // Fetch user's complaints
      const complaintsRes = await api.get(`/complaints/user/${user.id}`);
      setComplaints(complaintsRes.data.complaints || []);

      // Fetch user's ratings
      try {
        const ratingsRes = await api.get("/ratings/user");
        const ratedMap = {};
        const ratingMap = {};

        (ratingsRes.data.ratings || []).forEach((r) => {
          const compId =
            typeof r.complaint === "object" ? r.complaint?._id : r.complaint;
          if (compId) {
            ratedMap[compId] = true;
            ratingMap[compId] = r.rating;
          }
        });

        setRatedComplaints(ratedMap);
        setSubmittedRatings(ratingMap);
      } catch (rateErr) {
        console.warn("Could not fetch ratings:", rateErr);
      }
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleRatingChange = (complaintId, rating) => {
    setSelectedRating((prev) => ({ ...prev, [complaintId]: rating }));
    setRatingError((prev) => ({ ...prev, [complaintId]: "" }));
  };

  const handleFeedbackChange = (complaintId, text) => {
    setFeedback((prev) => ({ ...prev, [complaintId]: text }));
  };

  const handleSubmitRating = async (complaintId) => {
    const star = selectedRating[complaintId];
    if (!star) {
      setRatingError((prev) => ({
        ...prev,
        [complaintId]: "Please select 1 to 5 stars before submitting",
      }));
      return;
    }

    try {
      setSubmittingRating((prev) => ({ ...prev, [complaintId]: true }));
      setRatingMessage((prev) => ({ ...prev, [complaintId]: "" }));
      setRatingError((prev) => ({ ...prev, [complaintId]: "" }));

      await api.post("/ratings", {
        complaint: complaintId,
        rating: star,
        feedback: feedback[complaintId] || "",
      });

      setRatedComplaints((prev) => ({ ...prev, [complaintId]: true }));
      setSubmittedRatings((prev) => ({ ...prev, [complaintId]: star }));
      setRatingMessage((prev) => ({
        ...prev,
        [complaintId]: "Thank you for your rating!",
      }));
    } catch (error) {
      console.error("Rating submission error:", error);
      const msg =
        error.response?.data?.message || "Failed to submit rating";
      setRatingError((prev) => ({ ...prev, [complaintId]: msg }));
    } finally {
      setSubmittingRating((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  // Status visual badge styling
  const getStatusBadge = (status) => {
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-50 text-rose-700 border-rose-200 font-bold";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200 font-semibold";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Low":
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Electricity":
        return "💡";
      case "Plumbing":
        return "🚰";
      case "Network/WiFi":
      case "Network/Wi-Fi":
        return "📶";
      case "Carpenter":
        return "🪚";
      case "Cleaning":
        return "🧹";
      case "Food":
        return "🍱";
      default:
        return "📌";
    }
  };

  // Timeline / Stepper progress calculation
  const getTimelineSteps = (complaint) => {
    const isRejected = complaint.status === "Rejected";

    const standardSteps = [
      { key: "Submitted", label: "Submitted" },
      { key: "Under Review", label: "Under Review" },
      { key: "In Progress", label: "In Progress" },
      { key: "Resolved", label: "Resolved" },
    ];

    if (isRejected) {
      return [
        { key: "Submitted", label: "Submitted" },
        { key: "Under Review", label: "Under Review" },
        { key: "Rejected", label: "Rejected" },
      ];
    }

    return standardSteps;
  };

  const isStepActive = (stepKey, currentStatus) => {
    const order = ["Submitted", "Pending", "Under Review", "In Progress", "Resolved"];
    const normalizedCurrent = currentStatus === "Pending" ? "Submitted" : currentStatus;
    const normalizedStep = stepKey === "Pending" ? "Submitted" : stepKey;

    const currentIndex = order.indexOf(normalizedCurrent);
    const stepIndex = order.indexOf(normalizedStep);

    return stepIndex <= currentIndex;
  };

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Tab filter
      let matchesTab = true;
      if (activeTab === "Active") {
        matchesTab = ["Pending", "Submitted", "Under Review", "In Progress"].includes(
          c.status
        );
      } else if (activeTab === "Resolved") {
        matchesTab = c.status === "Resolved";
      } else if (activeTab === "Rejected") {
        matchesTab = c.status === "Rejected";
      }

      // Search filter
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.category?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c._id?.toLowerCase().includes(q) ||
        c.roomNumber?.toString().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [complaints, activeTab, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold tracking-wider text-cyan-200 uppercase">
                Student Portal
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black">My Complaints</h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-lg">
              Track the progress, priority, and resolution details of your submitted issues.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/complaint")}
              className="bg-white text-indigo-700 font-bold px-5 py-3 rounded-xl shadow-lg hover:scale-105 active:scale-95 transition text-sm flex items-center gap-2 shrink-0"
            >
              <span>+</span> Submit New Complaint
            </button>
            <button
              onClick={fetchUserData}
              title="Refresh"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold p-3 rounded-xl transition shrink-0"
            >
              ↻
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {["All", "Active", "Resolved", "Rejected"].map((tab) => {
              const count =
                tab === "All"
                  ? complaints.length
                  : tab === "Active"
                  ? complaints.filter((c) =>
                      ["Pending", "Submitted", "Under Review", "In Progress"].includes(
                        c.status
                      )
                    ).length
                  : complaints.filter((c) => c.status === tab).length;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab
                        ? "bg-white/25 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search complaints or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-semibold">
              Loading your complaints...
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredComplaints.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl mb-4">
              📭
            </div>
            <h3 className="text-xl font-bold text-slate-800">
              No Complaints Found
            </h3>
            <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
              {searchTerm || activeTab !== "All"
                ? "No complaints match your current filter or search criteria."
                : "You have not submitted any complaints yet. Everything in your room seems well!"}
            </p>
            {searchTerm || activeTab !== "All" ? (
              <button
                onClick={() => {
                  setActiveTab("All");
                  setSearchTerm("");
                }}
                className="mt-5 text-indigo-600 font-bold text-sm hover:underline"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => navigate("/complaint")}
                className="mt-6 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow hover:scale-105 transition"
              >
                Submit a Complaint Now
              </button>
            )}
          </div>
        )}

        {/* Complaint Cards */}
        {!loading && filteredComplaints.length > 0 && (
          <div className="space-y-6">
            {filteredComplaints.map((complaint) => {
              const timelineSteps = getTimelineSteps(complaint);
              const isResolved = complaint.status === "Resolved";
              const isRated = ratedComplaints[complaint._id];
              const starVal = submittedRatings[complaint._id] || 0;

              return (
                <div
                  key={complaint._id}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-md transition border border-slate-200 p-6 sm:p-7"
                >
                  {/* Top Section */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="flex items-start gap-4">
                      <div className="w-13 h-13 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0">
                        {getCategoryIcon(complaint.category)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className="text-xl font-black text-slate-900">
                            {complaint.category}
                          </h2>

                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                              complaint.status
                            )}`}
                          >
                            {complaint.status}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs border ${getPriorityBadge(
                              complaint.priority || "Medium"
                            )}`}
                          >
                            Priority: {complaint.priority || "Medium"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-2 font-medium">
                          <span>🚪 Room {complaint.roomNumber}</span>
                          <span>🛏️ Bed {complaint.bedNumber}</span>
                          <span>
                            📅 Submitted:{" "}
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 sm:text-right font-mono">
                      ID: {complaint._id}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-4">
                    <p className="text-slate-700 leading-relaxed text-sm">
                      {complaint.description}
                    </p>
                  </div>

                  {/* Admin Remarks (if present) */}
                  {complaint.adminRemarks && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs">
                      <span className="text-base text-indigo-600 mt-0.5">💬</span>
                      <div>
                        <span className="font-bold text-indigo-900 block">
                          Administrator Update:
                        </span>
                        <span className="text-indigo-800">
                          {complaint.adminRemarks}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Visual Status Progress Stepper */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                      Complaint Status Timeline
                    </p>

                    <div className="flex items-center justify-between relative max-w-xl mx-auto px-4">
                      {timelineSteps.map((step, idx) => {
                        const active = isStepActive(step.key, complaint.status);
                        const isCurrent =
                          (complaint.status === "Pending" &&
                            step.key === "Submitted") ||
                          complaint.status === step.key;

                        return (
                          <div
                            key={step.key}
                            className="flex flex-col items-center relative z-10"
                          >
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition shadow ${
                                isCurrent
                                  ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                                  : active
                                  ? "bg-emerald-500 text-white"
                                  : "bg-slate-200 text-slate-400"
                              }`}
                            >
                              {active && !isCurrent ? "✓" : idx + 1}
                            </div>
                            <span
                              className={`text-xs mt-2 font-semibold ${
                                active ? "text-slate-800" : "text-slate-400"
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}

                      {/* Connecting Line */}
                      <div className="absolute top-4 left-8 right-8 h-1 bg-slate-200 -z-0">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{
                            width:
                              complaint.status === "Resolved"
                                ? "100%"
                                : complaint.status === "In Progress"
                                ? "66%"
                                : complaint.status === "Under Review"
                                ? "33%"
                                : "0%",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Rating Section for Resolved Complaints */}
                  {isResolved && (
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      {isRated ? (
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                              Your Service Rating
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-amber-400 text-lg">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star}>
                                  {star <= starVal ? "★" : "☆"}
                                </span>
                              ))}
                              <span className="text-xs text-slate-600 ml-2 font-semibold">
                                ({starVal}/5 Stars)
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-emerald-700 bg-white px-3 py-1 rounded-full font-bold border border-emerald-200">
                            Feedback Recorded
                          </span>
                        </div>
                      ) : (
                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                          <h4 className="text-sm font-bold text-slate-800">
                            How was the resolution of this issue?
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Please rate the speed and quality of our service
                          </p>

                          <div className="flex items-center gap-1 my-3">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() =>
                                  handleRatingChange(complaint._id, star)
                                }
                                className={`text-2xl transition hover:scale-125 ${
                                  (selectedRating[complaint._id] || 0) >= star
                                    ? "text-amber-400"
                                    : "text-slate-300"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>

                          <textarea
                            rows="2"
                            placeholder="Optional feedback or suggestions..."
                            value={feedback[complaint._id] || ""}
                            onChange={(e) =>
                              handleFeedbackChange(
                                complaint._id,
                                e.target.value
                              )
                            }
                            className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          ></textarea>

                          {ratingError[complaint._id] && (
                            <p className="text-xs text-rose-600 font-semibold mt-1">
                              {ratingError[complaint._id]}
                            </p>
                          )}
                          {ratingMessage[complaint._id] && (
                            <p className="text-xs text-emerald-600 font-semibold mt-1">
                              {ratingMessage[complaint._id]}
                            </p>
                          )}

                          <button
                            type="button"
                            disabled={submittingRating[complaint._id]}
                            onClick={() => handleSubmitRating(complaint._id)}
                            className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition disabled:opacity-50 shadow"
                          >
                            {submittingRating[complaint._id]
                              ? "Submitting..."
                              : "Submit Rating"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyComplaints;