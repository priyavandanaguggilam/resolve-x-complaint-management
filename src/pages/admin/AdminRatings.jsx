import React, { useEffect, useState } from "react";
import api from "../../api/client";

function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/ratings");
      setRatings(res.data.ratings || []);
      setAverageRating(res.data.averageRating || 0);
      setTotalRatings(res.data.totalRatings || 0);
    } catch (error) {
      console.error("Error loading ratings for admin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Student Service Ratings & Feedback
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Monitor feedback submitted by residents after complaints are resolved
          </p>
        </div>

        <button
          onClick={fetchRatings}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 w-fit"
        >
          <span>↻</span> Refresh Feedback
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Average Service Score
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-4xl font-black text-amber-500">
                {averageRating}
              </span>
              <span className="text-slate-400 font-bold text-sm">/ 5.0</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">From student reviews</p>
          </div>
          <div className="text-4xl text-amber-400">★</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Ratings Submitted
            </span>
            <p className="text-4xl font-black text-slate-900 mt-2">
              {totalRatings}
            </p>
            <p className="text-xs text-slate-400 mt-1">For resolved issues</p>
          </div>
          <div className="text-4xl text-indigo-500">📋</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Student Satisfaction
            </span>
            <p className="text-4xl font-black text-emerald-600 mt-2">
              {totalRatings > 0 ? Math.round((averageRating / 5) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">Quality benchmark</p>
          </div>
          <div className="text-4xl text-emerald-500">👍</div>
        </div>
      </div>

      {/* Ratings Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4">
          All Student Reviews & Remarks
        </h3>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 font-semibold">
            Loading student ratings...
          </div>
        ) : ratings.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No student ratings have been submitted yet. Ratings appear once resolved complaints are reviewed by residents.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ratings.map((r) => (
              <div
                key={r._id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">
                      {r.user?.name || "Student"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {r.user?.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s}>{s <= r.rating ? "★" : "☆"}</span>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1">
                      {r.rating}.0
                    </span>
                  </div>
                </div>

                {r.feedback && (
                  <p className="text-xs text-slate-700 italic bg-white p-3 rounded-xl border border-slate-100">
                    "{r.feedback}"
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px] text-slate-400 font-medium">
                  <span>
                    Complaint: {r.complaint?.category || "Maintenance"} (Room{" "}
                    {r.complaint?.roomNumber || "N/A"})
                  </span>
                  <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRatings;
