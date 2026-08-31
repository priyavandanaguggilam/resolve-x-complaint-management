import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function MyComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // RATING STATES
  // ============================

  // Rating selected before submission
  const [selectedRating, setSelectedRating] = useState({});

  // Feedback text
  const [feedback, setFeedback] = useState({});

  // Loading state while submitting
  const [submittingRating, setSubmittingRating] = useState({});

  // Already submitted ratings
  // Example:
  // {
  //   complaintId: 5
  // }
  const [ratedComplaints, setRatedComplaints] = useState({});

  // Rating values received from backend
  // Example:
  // {
  //   complaintId: 5
  // }
  const [submittedRatings, setSubmittedRatings] = useState({});

  // Success / error messages
  const [ratingMessage, setRatingMessage] = useState({});
  const [ratingError, setRatingError] = useState({});


  // =====================================================
  // FETCH COMPLAINTS + USER RATINGS
  // =====================================================

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        if (!user || !token) {
          navigate("/login");
          return;
        }

        // ==========================================
        // FETCH USER COMPLAINTS
        // ==========================================

        const complaintResponse = await fetch(
          `http://localhost:5000/api/complaints/user/${user.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const complaintData = await complaintResponse.json();

        if (!complaintResponse.ok) {
          console.error(
            complaintData.message || "Failed to fetch complaints"
          );
          return;
        }

        setComplaints(complaintData.complaints || []);


        // ==========================================
        // FETCH USER RATINGS
        // ==========================================

        const ratingResponse = await fetch(
          "http://localhost:5000/api/ratings/user",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const ratingData = await ratingResponse.json();

        if (ratingResponse.ok) {
          const ratedMap = {};
          const ratingMap = {};

          (ratingData.ratings || []).forEach((ratingItem) => {
            const complaintId =
              typeof ratingItem.complaint === "object"
                ? ratingItem.complaint._id
                : ratingItem.complaint;

            if (complaintId) {
              ratedMap[complaintId] = true;
              ratingMap[complaintId] = ratingItem.rating;
            }
          });

          setRatedComplaints(ratedMap);
          setSubmittedRatings(ratingMap);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);


  // =====================================================
  // SELECT STAR RATING
  // =====================================================

  const handleRatingChange = (complaintId, rating) => {
    setSelectedRating((prev) => ({
      ...prev,
      [complaintId]: rating,
    }));

    // Clear error
    setRatingError((prev) => ({
      ...prev,
      [complaintId]: "",
    }));
  };


  // =====================================================
  // FEEDBACK CHANGE
  // =====================================================

  const handleFeedbackChange = (complaintId, value) => {
    setFeedback((prev) => ({
      ...prev,
      [complaintId]: value,
    }));
  };


  // =====================================================
  // SUBMIT RATING
  // =====================================================

  const handleSubmitRating = async (complaintId) => {
    const rating = selectedRating[complaintId];

    // Check rating
    if (!rating) {
      setRatingError((prev) => ({
        ...prev,
        [complaintId]: "Please select a rating before submitting.",
      }));

      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Start loading
      setSubmittingRating((prev) => ({
        ...prev,
        [complaintId]: true,
      }));

      // Clear old messages
      setRatingMessage((prev) => ({
        ...prev,
        [complaintId]: "",
      }));

      setRatingError((prev) => ({
        ...prev,
        [complaintId]: "",
      }));


      // ==========================================
      // SEND RATING TO BACKEND
      // ==========================================

      const response = await fetch(
        "http://localhost:5000/api/ratings",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            complaint: complaintId,
            rating: rating,
            feedback: feedback[complaintId] || "",
          }),
        }
      );


      const data = await response.json();


      // ==========================================
      // ERROR
      // ==========================================

      if (!response.ok) {

        // If already rated, don't show error.
        // Instead fetch/update the rating.

        if (
          data.message &&
          data.message.toLowerCase().includes("already rated")
        ) {

          setRatedComplaints((prev) => ({
            ...prev,
            [complaintId]: true,
          }));

          // Try to use selected rating if backend
          // doesn't return existing rating
          setSubmittedRatings((prev) => ({
            ...prev,
            [complaintId]: rating,
          }));

          return;
        }


        setRatingError((prev) => ({
          ...prev,
          [complaintId]:
            data.message || "Failed to submit rating.",
        }));

        return;
      }


      // ==========================================
      // SUCCESS
      // ==========================================

      setRatingMessage((prev) => ({
        ...prev,
        [complaintId]:
          "Thank you! Your rating has been submitted successfully.",
      }));


      // Mark complaint as rated
      setRatedComplaints((prev) => ({
        ...prev,
        [complaintId]: true,
      }));


      // Store submitted rating
      setSubmittedRatings((prev) => ({
        ...prev,
        [complaintId]: rating,
      }));


      // Clear feedback
      setFeedback((prev) => ({
        ...prev,
        [complaintId]: "",
      }));

    } catch (error) {

      console.error("Rating error:", error);

      setRatingError((prev) => ({
        ...prev,
        [complaintId]:
          "Unable to connect to server. Please try again.",
      }));

    } finally {

      setSubmittingRating((prev) => ({
        ...prev,
        [complaintId]: false,
      }));
    }
  };


  // =====================================================
  // RENDER STARS
  // =====================================================

  const renderStars = (rating, complaintId, clickable = false) => {
    return (
      <div className="flex gap-1">

        {[1, 2, 3, 4, 5].map((star) => {

          const activeRating =
            rating >= star;

          return (
            <button
              key={star}
              type="button"
              disabled={!clickable}
              onClick={() => {
                if (clickable) {
                  handleRatingChange(
                    complaintId,
                    star
                  );
                }
              }}
              className={`text-3xl transition ${
                activeRating
                  ? "text-yellow-400"
                  : "text-gray-300"
              } ${
                clickable
                  ? "hover:text-yellow-400 hover:scale-110 cursor-pointer"
                  : "cursor-default"
              }`}
            >
              ★
            </button>
          );
        })}

      </div>
    );
  };


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="max-w-5xl mx-auto">


        {/* =================================================
            HEADING
        ================================================= */}

        <div className="text-center mb-10">

          <h1 className="text-4xl font-black text-gray-900">
            My Complaints
          </h1>

          <p className="text-gray-500 mt-2">
            Track your submitted hostel complaints
          </p>

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="text-center py-10">

            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>

            <p className="text-gray-500 mt-3">
              Loading complaints...
            </p>

          </div>

        )}


        {/* =================================================
            NO COMPLAINTS
        ================================================= */}

        {!loading && complaints.length === 0 && (

          <div className="bg-white rounded-2xl shadow p-8 text-center">

            <div className="text-5xl mb-4">
              📋
            </div>

            <h2 className="text-xl font-bold text-gray-800">
              No Complaints Yet
            </h2>

            <p className="text-gray-500 mt-2">
              You haven't submitted any complaints yet.
            </p>

            <button
              onClick={() => navigate("/complaint")}
              className="mt-5 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Submit a Complaint
            </button>

          </div>

        )}


        {/* =================================================
            COMPLAINT LIST
        ================================================= */}

        {!loading && complaints.length > 0 && (

          <div className="space-y-5">

            {complaints.map((complaint) => (

              <div
                key={complaint._id}
                className="bg-white rounded-2xl shadow-lg p-6"
              >


                {/* =================================================
                    TOP SECTION
                ================================================= */}

                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">

                  <div>

                    <h2 className="text-xl font-bold text-gray-900">
                      {complaint.category}
                    </h2>

                    <p className="text-gray-500 mt-1">
                      Room: {complaint.roomNumber}
                      {" | "}
                      Bed: {complaint.bedNumber}
                    </p>

                  </div>


                  {/* STATUS */}

                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      complaint.status === "Pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : complaint.status === "In Progress"
                        ? "bg-blue-100 text-blue-700"
                        : complaint.status === "Resolved"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {complaint.status}
                  </span>

                </div>


                {/* =================================================
                    DESCRIPTION
                ================================================= */}

                <div className="mt-5">

                  <p className="text-gray-700 leading-relaxed">
                    {complaint.description}
                  </p>

                </div>


                {/* =================================================
                    DATE
                ================================================= */}

                <p className="text-sm text-gray-400 mt-4">

                  Submitted:{" "}

                  {new Date(
                    complaint.createdAt
                  ).toLocaleString()}

                </p>


                {/* =================================================
                    RATING
                ================================================= */}

                {complaint.status === "Resolved" && (

                  <div className="mt-6 pt-6 border-t border-gray-200">


                    {/* =================================================
                        ALREADY RATED
                    ================================================= */}

                    {ratedComplaints[complaint._id] ? (

                      <div className="bg-gray-50 rounded-2xl p-5">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                          <div>

                            <h3 className="text-lg font-bold text-gray-900">
                              Your Rating
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                              Thank you for your feedback!
                            </p>

                          </div>


                          {/* SUBMITTED STARS */}

                          <div className="flex items-center gap-3">

                            {renderStars(
                              submittedRatings[
                                complaint._id
                              ] || 0,
                              complaint._id,
                              false
                            )}

                            <span className="font-bold text-gray-700">
                              {submittedRatings[
                                complaint._id
                              ] || 0}/5
                            </span>

                          </div>

                        </div>

                      </div>

                    ) : (

                      /* =================================================
                          NOT RATED YET
                      ================================================= */

                      <div className="bg-gray-50 rounded-2xl p-5">

                        <h3 className="text-lg font-bold text-gray-900">
                          ⭐ How was your experience?
                        </h3>

                        <p className="text-gray-500 text-sm mt-1">
                          Rate the resolution of your complaint.
                        </p>


                        {/* SELECT STARS */}

                        <div className="mt-4">

                          {renderStars(
                            selectedRating[
                              complaint._id
                            ] || 0,
                            complaint._id,
                            true
                          )}

                        </div>


                        {/* SELECTED RATING */}

                        {selectedRating[
                          complaint._id
                        ] && (

                          <p className="text-sm text-gray-500 mt-2">

                            You selected{" "}

                            <span className="font-bold text-gray-800">

                              {
                                selectedRating[
                                  complaint._id
                                ]
                              } / 5

                            </span>

                          </p>

                        )}


                        {/* ERROR */}

                        {ratingError[
                          complaint._id
                        ] && (

                          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">

                            ⚠️{" "}
                            {
                              ratingError[
                                complaint._id
                              ]
                            }

                          </div>

                        )}


                        {/* FEEDBACK */}

                        <textarea
                          value={
                            feedback[
                              complaint._id
                            ] || ""
                          }
                          onChange={(e) =>
                            handleFeedbackChange(
                              complaint._id,
                              e.target.value
                            )
                          }
                          placeholder="Optional: Tell us about your experience..."
                          rows="3"
                          className="w-full mt-4 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white"
                        />


                        {/* SUBMIT */}

                        <button
                          onClick={() =>
                            handleSubmitRating(
                              complaint._id
                            )
                          }
                          disabled={
                            submittingRating[
                              complaint._id
                            ]
                          }
                          className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >

                          {submittingRating[
                            complaint._id
                          ]
                            ? "Submitting..."
                            : "Submit Rating"}

                        </button>

                      </div>

                    )}


                    {/* =================================================
                        SUCCESS MESSAGE
                    ================================================= */}

                    {ratingMessage[
                      complaint._id
                    ] && (

                      <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3">

                        <p className="text-green-700 text-sm font-semibold">
                          ✓{" "}
                          {
                            ratingMessage[
                              complaint._id
                            ]
                          }
                        </p>

                      </div>

                    )}

                  </div>

                )}

              </div>

            ))}

          </div>

        )}


        {/* =================================================
            BACK BUTTON
        ================================================= */}

        <div className="text-center mt-8">

          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-indigo-600 transition font-medium"
          >
            ← Back to Home
          </button>

        </div>

      </div>

    </div>
  );
}

export default MyComplaints;