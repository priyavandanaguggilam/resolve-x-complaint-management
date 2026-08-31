
const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    // User who submitted the rating
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Complaint being rated
    // One complaint can have only ONE rating
    complaint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Complaint",
      required: true,
      unique: true,
    },

    // Rating from 1 to 5
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Optional feedback
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Rating", ratingSchema);
