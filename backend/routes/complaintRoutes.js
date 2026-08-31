const express = require("express");
const Complaint = require("../models/Complaint");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// SUBMIT A NEW COMPLAINT
// =====================================================
router.post("/submit", verifyToken, async (req, res) => {
  try {
    const {
      name,
      roomNumber,
      bedNumber,
      category,
      description,
    } = req.body;

    // Check required fields
    if (
      !name ||
      !roomNumber ||
      !bedNumber ||
      !category ||
      !description
    ) {
      return res.status(400).json({
        message: "Please fill all complaint details",
      });
    }

    // Create complaint using logged-in user's ID
    const complaint = new Complaint({
      user: req.user.id,
      name,
      roomNumber,
      bedNumber,
      category,
      description,
    });

    await complaint.save();

    res.status(201).json({
      message: "Complaint submitted successfully",
      complaint,
    });
  } catch (error) {
    console.error("Complaint error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// GET COMPLAINT STATISTICS
// =====================================================
// This route is public because Home page needs statistics
router.get("/stats", async (req, res) => {
  try {
    // Total complaints
    const totalComplaints = await Complaint.countDocuments();

    // Resolved complaints
    const resolvedComplaints = await Complaint.countDocuments({
      status: "Resolved",
    });

    // Pending complaints
    const pendingComplaints = await Complaint.countDocuments({
      status: "Pending",
    });

    // In Progress complaints
    const inProgressComplaints = await Complaint.countDocuments({
      status: "In Progress",
    });

    // Calculate resolution rate
    const resolutionRate =
      totalComplaints > 0
        ? Math.round(
            (resolvedComplaints / totalComplaints) * 100
          )
        : 0;

    res.status(200).json({
      totalComplaints,
      resolvedComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolutionRate,
    });
  } catch (error) {
    console.error("Error fetching complaint statistics:", error);

    res.status(500).json({
      message: "Failed to fetch complaint statistics",
    });
  }
});

// =====================================================
// GET COMPLAINTS OF LOGGED-IN USER
// =====================================================
router.get(
  "/user/:userId",
  verifyToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // User can access only their own complaints
      if (req.user.id !== userId) {
        return res.status(403).json({
          message: "You can only access your own complaints",
        });
      }

      const complaints = await Complaint.find({
        user: req.user.id,
      }).sort({ createdAt: -1 });

      res.status(200).json({
        complaints,
      });
    } catch (error) {
      console.error("Error fetching complaints:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// GET ALL COMPLAINTS FOR ADMIN
// =====================================================
router.get(
  "/all",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const complaints = await Complaint.find()
        .populate("user", "name email phone")
        .sort({ createdAt: -1 });

      res.status(200).json({
        complaints,
      });
    } catch (error) {
      console.error("Error fetching all complaints:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPDATE COMPLAINT STATUS - ADMIN ONLY
// =====================================================
router.put(
  "/:id/status",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      // Validate status
      if (
        !["Pending", "In Progress", "Resolved"].includes(status)
      ) {
        return res.status(400).json({
          message: "Invalid complaint status",
        });
      }

      const complaint = await Complaint.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );

      if (!complaint) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      res.status(200).json({
        message: "Complaint status updated successfully",
        complaint,
      });
    } catch (error) {
      console.error("Status update error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;