const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/User.js");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const ratingRoutes = require("./routes/ratingRoutes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/ratings", ratingRoutes);


// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/resolveX")
  .then(() => {
    console.log("MongoDB connected successfully!");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });

// Test route
app.get("/", (req, res) => {
  res.send("Resolve X Backend is running!");
});

// Server port
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});