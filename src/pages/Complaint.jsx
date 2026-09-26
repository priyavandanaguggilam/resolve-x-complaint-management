import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";

function Complaint() {
  const navigate = useNavigate();
  const location = useLocation();

  const initialCategory = location.state?.category || "";

  // Pre-fill name if logged in
  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  const [name, setName] = useState(storedUser.name || "");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [priority, setPriority] = useState("Medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Notification message
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !roomNumber || !bedNumber || !category || !description) {
      showMessage("Please fill all required complaint details", "error");
      return;
    }

    try {
      setSubmitting(true);

      await api.post("/complaints/submit", {
        name,
        roomNumber,
        bedNumber,
        category,
        priority,
        description,
      });

      showMessage("Complaint submitted successfully! Redirecting...", "success");

      setTimeout(() => {
        navigate("/my-complaints");
      }, 1200);
    } catch (error) {
      console.error("Complaint submission error:", error);
      const errorMsg =
        error.response?.data?.message || "Unable to submit complaint";
      showMessage(errorMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 pt-28">
      {/* Notification Message */}
      {message && (
        <div
          className={`fixed top-24 right-5 z-50 px-6 py-4 rounded-2xl shadow-xl font-semibold flex items-center gap-3 border ${
            messageType === "error"
              ? "bg-red-50 text-red-700 border-red-200"
              : "bg-emerald-50 text-emerald-700 border-emerald-200"
          }`}
        >
          <span className="text-xl">
            {messageType === "error" ? "⚠️" : "✓"}
          </span>
          <span>{message}</span>
        </div>
      )}

      <div className="bg-white w-full max-w-xl rounded-3xl shadow-xl border border-slate-200 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl mb-3">
            📝
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Submit Complaint
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Provide your hostel and issue details to receive quick assistance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-sm">
              Student Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">
                Room Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. B-204"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">
                Bed Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 1, 2"
                value={bedNumber}
                onChange={(e) => setBedNumber(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                required
              >
                <option value="">Select category</option>
                <option value="Electricity">💡 Electricity</option>
                <option value="Plumbing">🚰 Plumbing</option>
                <option value="Network/WiFi">📶 Network / Wi-Fi</option>
                <option value="Carpenter">🪚 Carpenter</option>
                <option value="Cleaning">🧹 Cleaning</option>
                <option value="Food">🍱 Food</option>
                <option value="Other">📌 Other</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5 text-sm">
                Urgency / Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Critical">🔴 Critical (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-sm">
              Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows="4"
              placeholder="Describe your issue clearly..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-800"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
          >
            {submitting ? "Submitting Complaint..." : "Submit Complaint"}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate("/")}
            className="text-slate-500 hover:text-indigo-600 text-sm font-semibold transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default Complaint;