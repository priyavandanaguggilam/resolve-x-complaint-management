
const express = require("express");
const Rating = require("../models/Rating");
const Complaint = require("../models/Complaint");

const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// SUBMIT RATING
// =====================================================

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      complaint,
      rating,
      feedback,
    } = req.body;


    // -----------------------------
    // Required fields
    // -----------------------------

    if (!complaint || !rating) {
      return res.status(400).json({
        message: "Complaint and rating are required",
      });
    }


    // -----------------------------
    // Validate rating
    // -----------------------------

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }


    // -----------------------------
    // Find complaint
    // -----------------------------

    const existingComplaint =
      await Complaint.findById(complaint);

    if (!existingComplaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }


    // -----------------------------
    // Check complaint owner
    // -----------------------------

    if (
      existingComplaint.user.toString() !==
      req.user.id.toString()
    ) {
      return res.status(403).json({
        message:
          "You can only rate your own complaint",
      });
    }


    // -----------------------------
    // Only resolved complaints
    // -----------------------------

    if (existingComplaint.status !== "Resolved") {
      return res.status(400).json({
        message:
          "Only resolved complaints can be rated",
      });
    }


    // -----------------------------
    // Check existing rating
    // -----------------------------

    const alreadyRated =
      await Rating.findOne({
        complaint: complaint,
      });

    if (alreadyRated) {
      return res.status(400).json({
        message:
          "You have already rated this complaint",
        alreadyRated: true,
      });
    }


    // -----------------------------
    // Create rating
    // -----------------------------

    const newRating = new Rating({
      user: req.user.id,
      complaint: complaint,
      rating: numericRating,
      feedback: feedback || "",
    });


    await newRating.save();


    // -----------------------------
    // Success response
    // -----------------------------

    res.status(201).json({
      message:
        "Rating submitted successfully",
      rating: newRating,
    });

  } catch (error) {

    // Duplicate rating protection
    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "You have already rated this complaint",
        alreadyRated: true,
      });
    }

    console.error(
      "Rating error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});


// =====================================================
// GET RATINGS OF LOGGED-IN USER
// =====================================================

router.get(
  "/user",
  verifyToken,
  async (req, res) => {
    try {

      const ratings = await Rating.find({
        user: req.user.id,
      })
        .select(
          "complaint rating feedback createdAt"
        )
        .sort({
          createdAt: -1,
        });


      res.status(200).json({
        ratings,
      });

    } catch (error) {

      console.error(
        "Error fetching ratings:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


module.exports = router;
