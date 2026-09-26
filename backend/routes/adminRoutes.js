const express = require("express");
const User = require("../models/User");
const Complaint = require("../models/Complaint");
const Rating = require("../models/Rating");
const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth + admin verification to all admin routes
router.use(verifyToken, verifyAdmin);

// =====================================================
// GET ALL USERS WITH COMPLAINT COUNTS
// =====================================================
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    // Aggregate complaint counts per user
    const usersWithCounts = await Promise.all(
      users.map(async (u) => {
        const count = await Complaint.countDocuments({ user: u._id });
        const resolved = await Complaint.countDocuments({
          user: u._id,
          status: "Resolved",
        });

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status || "active",
          createdAt: u.createdAt,
          totalComplaints: count,
          resolvedComplaints: resolved,
        };
      })
    );

    res.status(200).json({
      users: usersWithCounts,
    });
  } catch (error) {
    console.error("Admin fetch users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// =====================================================
// TOGGLE USER STATUS (ACTIVE / DISABLED)
// =====================================================
router.put("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({
        message: "Status must be either 'active' or 'disabled'",
      });
    }

    // Prevent admin from disabling themselves
    if (req.user.id.toString() === req.params.id.toString()) {
      return res.status(400).json({
        message: "You cannot disable your own admin account",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: `User marked as ${status}`,
      user,
    });
  } catch (error) {
    console.error("Admin toggle user status error:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

// =====================================================
// GET COMPLAINTS OF A SPECIFIC USER
// =====================================================
router.get("/users/:id/complaints", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email phone role status"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const complaints = await Complaint.find({ user: req.params.id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      user,
      complaints,
    });
  } catch (error) {
    console.error("Admin fetch user complaints error:", error);
    res.status(500).json({ message: "Failed to fetch user complaints" });
  }
});

// =====================================================
// GET ALL RATINGS & FEEDBACK (FOR QUALITY MONITORING)
// =====================================================
router.get("/ratings", async (req, res) => {
  try {
    const ratings = await Rating.find()
      .populate("user", "name email")
      .populate("complaint", "category roomNumber bedNumber description status")
      .sort({ createdAt: -1 });

    const totalRatings = ratings.length;
    const avgScore =
      totalRatings > 0
        ? (
            ratings.reduce((acc, curr) => acc + curr.rating, 0) /
            totalRatings
          ).toFixed(1)
        : 0;

    res.status(200).json({
      ratings,
      totalRatings,
      averageRating: Number(avgScore),
    });
  } catch (error) {
    console.error("Admin fetch ratings error:", error);
    res.status(500).json({ message: "Failed to fetch ratings" });
  }
});

// =====================================================
// GET DETAILED ADMIN METRICS
// =====================================================
router.get("/metrics", async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const resolved = await Complaint.countDocuments({ status: "Resolved" });
    const inProgress = await Complaint.countDocuments({
      status: "In Progress",
    });
    const pending = await Complaint.countDocuments({
      status: { $in: ["Pending", "Submitted", "Under Review"] },
    });
    const rejected = await Complaint.countDocuments({ status: "Rejected" });

    // Priority counts
    const critical = await Complaint.countDocuments({
      priority: "Critical",
    });
    const high = await Complaint.countDocuments({ priority: "High" });
    const medium = await Complaint.countDocuments({ priority: "Medium" });
    const low = await Complaint.countDocuments({ priority: "Low" });

    // Category breakdown
    const categoryCounts = await Complaint.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Total registered users
    const totalUsers = await User.countDocuments({ role: "user" });

    res.status(200).json({
      overview: {
        totalComplaints,
        resolved,
        inProgress,
        pending,
        rejected,
        resolutionRate:
          totalComplaints > 0
            ? Math.round((resolved / totalComplaints) * 100)
            : 0,
        totalUsers,
      },
      priorities: {
        critical,
        high,
        medium,
        low,
      },
      categories: categoryCounts.map((item) => ({
        category: item._id,
        count: item.count,
      })),
    });
  } catch (error) {
    console.error("Admin metrics error:", error);
    res.status(500).json({ message: "Failed to calculate metrics" });
  }
});

module.exports = router;
