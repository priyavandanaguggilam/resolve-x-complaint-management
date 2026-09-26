const express = require("express");
const Complaint = require("../models/Complaint");
const Rating = require("../models/Rating");

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
      priority,
    } = req.body;

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

    const complaintPriority = [
      "Low",
      "Medium",
      "High",
      "Critical",
    ].includes(priority)
      ? priority
      : "Medium";

    const complaint = new Complaint({
      user: req.user.id,
      name: name.trim(),
      roomNumber: roomNumber.trim(),
      bedNumber: bedNumber.trim(),
      category: category.trim(),
      description: description.trim(),
      priority: complaintPriority,
      status: "Pending",
      statusHistory: [
        {
          status: "Pending",
          changedAt: new Date(),
          remarks: "Complaint submitted",
        },
      ],
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
router.get("/stats", async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();

    const resolvedComplaints = await Complaint.countDocuments({
      status: "Resolved",
    });

    const pendingComplaints = await Complaint.countDocuments({
      status: {
        $in: ["Pending", "Submitted", "Under Review"],
      },
    });

    const inProgressComplaints = await Complaint.countDocuments({
      status: "In Progress",
    });

    const rejectedComplaints = await Complaint.countDocuments({
      status: "Rejected",
    });

    const criticalComplaints = await Complaint.countDocuments({
      priority: "Critical",
      status: { $ne: "Resolved" },
    });

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
      rejectedComplaints,
      criticalComplaints,
      resolutionRate,
    });
  } catch (error) {
    console.error(
      "Error fetching complaint statistics:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch complaint statistics",
    });
  }
});

// =====================================================
// GET COMPLAINTS OF A USER
// =====================================================
router.get("/user/:userId", verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (
      req.user.id !== userId &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "You can only access your own complaints",
      });
    }

    const complaints = await Complaint.find({
      user: userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      complaints,
    });
  } catch (error) {
    console.error(
      "Error fetching complaints:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// GET ALL COMPLAINTS FOR ADMIN
// IMPORTANT: THIS MUST COME BEFORE /:id
// =====================================================
router.get("/all", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      category,
      status,
      priority,
      search,
    } = req.query;

    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (priority && priority !== "All") {
      filter.priority = priority;
    }

    if (search && search.trim() !== "") {
      const regex = new RegExp(search.trim(), "i");

      filter.$or = [
        { name: regex },
        { category: regex },
        { description: regex },
        { roomNumber: regex },
        { bedNumber: regex },
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      complaints,
    });
  } catch (error) {
    console.error(
      "Error fetching all complaints:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// GET SINGLE COMPLAINT DETAILS
// IMPORTANT: KEEP THIS AFTER /all
// =====================================================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const complaint = await Complaint.findById(
      req.params.id
    ).populate("user", "name email phone");

    if (!complaint) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    const isOwner =
      complaint.user &&
      complaint.user._id.toString() ===
        req.user.id.toString();

    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const rating = await Rating.findOne({
      complaint: complaint._id,
    });

    res.status(200).json({
      complaint,
      rating,
    });
  } catch (error) {
    console.error(
      "Error fetching complaint details:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
});

// =====================================================
// UPDATE COMPLAINT STATUS - ADMIN ONLY
// =====================================================
router.put(
  "/:id/status",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { status, adminRemarks } = req.body;

      const allowedStatuses = [
        "Submitted",
        "Pending",
        "Under Review",
        "In Progress",
        "Resolved",
        "Rejected",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid complaint status",
        });
      }

      const complaint = await Complaint.findById(
        req.params.id
      );

      if (!complaint) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      complaint.status = status;

      if (adminRemarks !== undefined) {
        complaint.adminRemarks =
          adminRemarks.trim();
      }

      complaint.statusHistory.push({
        status,
        changedAt: new Date(),
        remarks:
          adminRemarks ||
          `Status changed to ${status}`,
      });

      await complaint.save();

      res.status(200).json({
        message:
          "Complaint status updated successfully",
        complaint,
      });
    } catch (error) {
      console.error(
        "Status update error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// =====================================================
// UPDATE COMPLAINT PRIORITY - ADMIN ONLY
// =====================================================
router.put(
  "/:id/priority",
  verifyToken,
  verifyAdmin,
  async (req, res) => {
    try {
      const { priority } = req.body;

      const allowedPriorities = [
        "Low",
        "Medium",
        "High",
        "Critical",
      ];

      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          message: "Invalid priority value",
        });
      }

      const complaint =
        await Complaint.findByIdAndUpdate(
          req.params.id,
          { priority },
          { new: true }
        );

      if (!complaint) {
        return res.status(404).json({
          message: "Complaint not found",
        });
      }

      res.status(200).json({
        message: "Priority updated successfully",
        complaint,
      });
    } catch (error) {
      console.error(
        "Priority update error:",
        error
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;