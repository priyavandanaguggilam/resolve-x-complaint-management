import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function TrackComplaint() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!user || !token) {
        setMessage("Please login first");

        setTimeout(() => {
          navigate("/login");
        }, 1500);

        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/complaints/user/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Failed to load complaints");
        return;
      }

      setComplaints(data.complaints || []);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "Resolved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "In Progress") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-red-100 text-red-700";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl font-semibold text-gray-600">
          Loading complaints...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 px-6 pb-10">

      <div className="max-w-6xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900">
            Track Your Complaints
          </h1>

          <p className="text-gray-500 mt-3">
            Check the current status of your submitted complaints
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 bg-red-100 text-red-700 px-5 py-3 rounded-xl font-medium">
            ✕ {message}
          </div>
        )}

        {/* No Complaints */}
        {complaints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center">

            <h2 className="text-2xl font-bold text-gray-800">
              No Complaints Found
            </h2>

            <p className="text-gray-500 mt-3">
              You have not submitted any complaints yet.
            </p>

            <button
              onClick={() => navigate("/complaint")}
              className="mt-6 bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Submit Complaint
            </button>

          </div>
        ) : (

          /* Complaint Cards */
          <div className="grid md:grid-cols-2 gap-6">

            {complaints.map((complaint) => (
              <div
                key={complaint._id}
                className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
              >

                {/* Top Section */}
                <div className="flex justify-between items-start gap-4">

                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {complaint.category}
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Complaint ID: {complaint._id}
                    </p>
                  </div>

                  <span
                    className={`px-4 py-1 rounded-full text-sm font-semibold ${getStatusStyle(
                      complaint.status
                    )}`}
                  >
                    {complaint.status}
                  </span>

                </div>

                {/* Details */}
                <div className="mt-5 space-y-3 text-gray-600">

                  <p>
                    <span className="font-semibold text-gray-800">
                      Room:
                    </span>{" "}
                    {complaint.roomNumber}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Bed:
                    </span>{" "}
                    {complaint.bedNumber}
                  </p>

                  <p>
                    <span className="font-semibold text-gray-800">
                      Description:
                    </span>{" "}
                    {complaint.description}
                  </p>

                  <p className="text-sm text-gray-400 pt-2">
                    Submitted on:{" "}
                    {new Date(
                      complaint.createdAt
                    ).toLocaleDateString()}
                  </p>

                </div>

              </div>
            ))}

          </div>
        )}

        {/* Back Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/")}
            className="text-indigo-600 font-semibold hover:underline"
          >
            ← Back to Home
          </button>
        </div>

      </div>

    </div>
  );
}

export default TrackComplaint;