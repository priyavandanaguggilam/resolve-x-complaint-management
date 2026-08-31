import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Complaint() {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedCategory = location.state?.category || "";

  const [name, setName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [bedNumber, setBedNumber] = useState("");
  const [category, setCategory] = useState(selectedCategory);
  const [description, setDescription] = useState("");

  // Notification message
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !roomNumber || !bedNumber || !category || !description) {
      showMessage("Please fill all complaint details", "error");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));

      if (!user) {
        showMessage("Please login first", "error");

        setTimeout(() => {
          navigate("/login");
        }, 1000);

        return;
      }

     const token = localStorage.getItem("token");

if (!user || !token) {
  showMessage("Please login first", "error");

  setTimeout(() => {
    navigate("/login");
  }, 1000);

  return;
}

const response = await fetch(
  "http://localhost:5000/api/complaints/submit",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name,
      roomNumber,
      bedNumber,
      category,
      description,
    }),
  }
);
      const data = await response.json();

      if (!response.ok) {
        showMessage(
          data.message || "Failed to submit complaint",
          "error"
        );
        return;
      }

      showMessage("Complaint submitted successfully!", "success");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("Complaint submission error:", error);
      showMessage("Unable to connect to server", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">

      {/* Notification Message */}
      {message && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-3 rounded-xl shadow-lg font-semibold text-white ${
            messageType === "error"
              ? "bg-red-600"
              : "bg-green-600"
          }`}
        >
          {messageType === "error" ? "✕" : "✓"} {message}
        </div>
      )}

      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900">
            Submit Complaint
          </h1>

          <p className="text-gray-500 mt-2">
            Provide your hostel and complaint details
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Student Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Room Number
            </label>

            <input
              type="text"
              placeholder="Enter room number"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Bed Number
            </label>

            <input
              type="text"
              placeholder="Enter bed number"
              value={bedNumber}
              onChange={(e) => setBedNumber(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Complaint Category
            </label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select category</option>
              <option value="Electricity">Electricity</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Network/Wi-Fi">Network / Wi-Fi</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Food">Food</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Description
            </label>

            <textarea
              rows="5"
              placeholder="Describe your complaint..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white py-3 rounded-xl font-bold shadow-lg hover:scale-[1.02] transition"
          >
            Submit Complaint
          </button>

        </form>

        <div className="text-center mt-5">
          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-indigo-600"
          >
            ← Back to Home
          </button>
        </div>

      </div>
    </div>
  );
}

export default Complaint;