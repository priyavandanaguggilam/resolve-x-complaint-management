require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Complaint = require("./models/Complaint");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/resolveX";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // Check or create default admin
    const adminEmail = "admin@resolvex.com";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = new User({
        name: "System Administrator",
        email: adminEmail,
        phone: "9876543210",
        password: hashedPassword,
        role: "admin",
        status: "active",
      });
      await admin.save();
      console.log("Default Admin created: admin@resolvex.com / admin123");
    } else {
      console.log("Admin account already exists: admin@resolvex.com");
    }

    // Check or create demo student user
    const studentEmail = "student@resolvex.com";
    let student = await User.findOne({ email: studentEmail });

    if (!student) {
      const hashedPassword = await bcrypt.hash("student123", 10);
      student = new User({
        name: "Rahul Sharma",
        email: studentEmail,
        phone: "9123456780",
        password: hashedPassword,
        role: "user",
        status: "active",
      });
      await student.save();
      console.log("Demo Student created: student@resolvex.com / student123");
    }

    // Check if complaints exist
    const count = await Complaint.countDocuments();
    if (count === 0 && student) {
      const sampleComplaints = [
        {
          user: student._id,
          name: student.name,
          roomNumber: "B-204",
          bedNumber: "2",
          category: "Electricity",
          description: "Ceiling fan regulator is broken and running at maximum speed constantly.",
          priority: "High",
          status: "Pending",
          statusHistory: [
            {
              status: "Pending",
              changedAt: new Date(Date.now() - 86400000 * 2),
              remarks: "Complaint submitted by student",
            },
          ],
        },
        {
          user: student._id,
          name: student.name,
          roomNumber: "B-204",
          bedNumber: "2",
          category: "Plumbing",
          description: "Bathroom faucet is leaking continuously, causing water wastage.",
          priority: "Medium",
          status: "In Progress",
          adminRemarks: "Plumber assigned, waiting for replacement washer.",
          statusHistory: [
            {
              status: "Pending",
              changedAt: new Date(Date.now() - 86400000 * 3),
              remarks: "Complaint submitted",
            },
            {
              status: "In Progress",
              changedAt: new Date(Date.now() - 86400000),
              remarks: "Plumber assigned, waiting for replacement washer.",
            },
          ],
        },
        {
          user: student._id,
          name: student.name,
          roomNumber: "B-204",
          bedNumber: "2",
          category: "Network/WiFi",
          description: "Hostel Wi-Fi router on 2nd floor disconnecting frequently during night hours.",
          priority: "Critical",
          status: "Under Review",
          adminRemarks: "IT support notified to check router logs.",
          statusHistory: [
            {
              status: "Pending",
              changedAt: new Date(Date.now() - 86400000),
              remarks: "Complaint submitted",
            },
            {
              status: "Under Review",
              changedAt: new Date(),
              remarks: "IT support notified to check router logs.",
            },
          ],
        },
        {
          user: student._id,
          name: student.name,
          roomNumber: "B-204",
          bedNumber: "2",
          category: "Cleaning",
          description: "Corridor trash bin overflowed and has not been cleared for 2 days.",
          priority: "Low",
          status: "Resolved",
          adminRemarks: "Cleaned by housekeeping team on morning shift.",
          statusHistory: [
            {
              status: "Pending",
              changedAt: new Date(Date.now() - 86400000 * 5),
              remarks: "Complaint submitted",
            },
            {
              status: "Resolved",
              changedAt: new Date(Date.now() - 86400000 * 4),
              remarks: "Cleaned by housekeeping team on morning shift.",
            },
          ],
        },
      ];

      await Complaint.insertMany(sampleComplaints);
      console.log(`Inserted ${sampleComplaints.length} sample complaints for demo.`);
    }

    console.log("Seeding finished successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();
