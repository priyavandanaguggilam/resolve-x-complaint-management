import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

function AdminOverview() {
  const [metrics, setMetrics] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [metricsRes, complaintsRes] = await Promise.all([
        api.get("/admin/metrics"),
        api.get("/complaints/all"),
      ]);

      setMetrics(metricsRes.data);
      setRecentComplaints((complaintsRes.data.complaints || []).slice(0, 5));
    } catch (error) {
      console.error("Error loading admin overview:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-rose-100 text-rose-800 border-rose-200 font-bold";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200 font-semibold";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Low":
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
      case "Submitted":
        return "bg-amber-100 text-amber-800";
      case "Under Review":
        return "bg-purple-100 text-purple-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Resolved":
        return "bg-emerald-100 text-emerald-800";
      case "Rejected":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="inline-block w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-slate-600 font-semibold text-sm">
          Loading administration metrics...
        </p>
      </div>
    );
  }

  const overview = metrics?.overview || {};
  const priorities = metrics?.priorities || {};
  const categories = metrics?.categories || [];

  return (
    <div className="space-y-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            System Operations Overview
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Real-time analytics, critical alerts, and resolution statistics
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 w-fit"
        >
          <span>↻</span> Refresh Metrics
        </button>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total */}
        <Link
          to="/admin/complaints"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Complaints
            </span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg group-hover:scale-110 transition">
              📋
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">
            {overview.totalComplaints || 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Across all hostel wings
          </p>
        </Link>

        {/* Pending */}
        <Link
          to="/admin/complaints?status=Pending"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Pending Action
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg group-hover:scale-110 transition">
              ⏳
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 mt-3">
            {overview.pending || 0}
          </p>
          <p className="text-[11px] text-amber-500 mt-1 font-medium">
            Awaiting inspection
          </p>
        </Link>

        {/* In Progress */}
        <Link
          to="/admin/complaints?status=In Progress"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              In Progress
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg group-hover:scale-110 transition">
              🔄
            </div>
          </div>
          <p className="text-3xl font-black text-blue-600 mt-3">
            {overview.inProgress || 0}
          </p>
          <p className="text-[11px] text-blue-500 mt-1 font-medium">
            Technicians working
          </p>
        </Link>

        {/* Resolved */}
        <Link
          to="/admin/complaints?status=Resolved"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs hover:shadow-md transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Resolved Issues
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg group-hover:scale-110 transition">
              ✓
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-3">
            {overview.resolved || 0}
          </p>
          <p className="text-[11px] text-emerald-500 mt-1 font-medium">
            Rate: {overview.resolutionRate || 0}%
          </p>
        </Link>
      </div>

      {/* Secondary Cards: Critical & Users */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <Link
          to="/admin/complaints?priority=Critical"
          className="bg-rose-50/80 border border-rose-200 rounded-3xl p-5 shadow-xs flex items-center justify-between hover:bg-rose-100/60 transition"
        >
          <div>
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Critical Urgency
            </p>
            <p className="text-2xl font-black text-rose-900 mt-1">
              {priorities.critical || 0}
            </p>
            <p className="text-xs text-rose-600 mt-0.5">Require immediate resolution</p>
          </div>
          <div className="text-3xl text-rose-500">🚨</div>
        </Link>

        <Link
          to="/admin/complaints?status=Rejected"
          className="bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between hover:bg-slate-100 transition"
        >
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Rejected Complaints
            </p>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {overview.rejected || 0}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Non-actionable / duplicates</p>
          </div>
          <div className="text-3xl text-slate-400">🚫</div>
        </Link>

        <Link
          to="/admin/users"
          className="bg-indigo-50/80 border border-indigo-200 rounded-3xl p-5 shadow-xs flex items-center justify-between hover:bg-indigo-100/60 transition"
        >
          <div>
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Registered Students
            </p>
            <p className="text-2xl font-black text-indigo-900 mt-1">
              {overview.totalUsers || 0}
            </p>
            <p className="text-xs text-indigo-600 mt-0.5">Active hostel residents</p>
          </div>
          <div className="text-3xl text-indigo-500">👥</div>
        </Link>
      </div>

      {/* Analytics Breakdown Grid: Categories & Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Category Distribution
              </h3>
              <p className="text-xs text-slate-400">
                Complaints categorized by maintenance department
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {categories.length} Departments
            </span>
          </div>

          <div className="space-y-3.5">
            {categories.map((c) => {
              const total = overview.totalComplaints || 1;
              const percent = Math.round((c.count / total) * 100);

              return (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">{c.category}</span>
                    <span className="text-slate-500 font-mono">
                      {c.count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Classification Overview */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Priority Urgency Breakdown
              </h3>
              <p className="text-xs text-slate-400">
                Severity classification of reported issues
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
              <span className="text-xs font-bold text-rose-700">🔴 Critical</span>
              <p className="text-2xl font-black text-rose-900 mt-2">
                {priorities.critical || 0}
              </p>
              <p className="text-[11px] text-rose-600 mt-0.5">High disruption / hazard</p>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100">
              <span className="text-xs font-bold text-orange-700">🟠 High</span>
              <p className="text-2xl font-black text-orange-900 mt-2">
                {priorities.high || 0}
              </p>
              <p className="text-[11px] text-orange-600 mt-0.5">Important service fault</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <span className="text-xs font-bold text-amber-700">🟡 Medium</span>
              <p className="text-2xl font-black text-amber-900 mt-2">
                {priorities.medium || 0}
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5">Standard daily repairs</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">🟢 Low</span>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {priorities.low || 0}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Minor convenience issues</p>
            </div>
          </div>

          <div className="mt-5 p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
            <span>Overall Service Resolution Efficiency</span>
            <span className="font-bold text-sm text-indigo-700">
              {overview.resolutionRate || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity Table Preview */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Recent Complaints Waiting for Action
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Latest issues submitted by hostel students
            </p>
          </div>
          <Link
            to="/admin/complaints"
            className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition"
          >
            View All in Management Table →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-5">Student / Room</th>
                <th className="py-3 px-5">Category</th>
                <th className="py-3 px-5">Description</th>
                <th className="py-3 px-5">Priority</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentComplaints.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-5 font-semibold text-slate-900 whitespace-nowrap">
                    <div>{c.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      Room {c.roomNumber} • Bed {c.bedNumber}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 font-bold whitespace-nowrap">
                    {c.category}
                  </td>
                  <td className="py-3.5 px-5 max-w-xs truncate text-slate-600">
                    {c.description}
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] border ${getPriorityStyle(
                        c.priority || "Medium"
                      )}`}
                    >
                      {c.priority || "Medium"}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${getStatusBadge(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
