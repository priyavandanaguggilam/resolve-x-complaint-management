import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

const CATEGORY_LIST = [
  {
    name: "Electricity",
    displayName: "Electricity",
    icon: "💡",
    bg: "bg-yellow-100",
    desc: "Report power cuts, electrical problems, fan, light and other electricity-related issues.",
  },
  {
    name: "Plumbing",
    displayName: "Plumbing",
    icon: "🚰",
    bg: "bg-blue-100",
    desc: "Report water leakage, water shortage, pipe damage and other plumbing issues.",
  },
  {
    name: "Network/WiFi",
    displayName: "Wi-Fi / Network",
    icon: "📶",
    bg: "bg-purple-100",
    desc: "Report WiFi connectivity problems, slow internet and network connection issues.",
  },
  {
    name: "Carpenter",
    displayName: "Carpenter",
    icon: "🪚",
    bg: "bg-orange-100",
    desc: "Report issues with doors, cupboards, hangers, furniture and other wooden items.",
  },
  {
    name: "Cleaning",
    displayName: "Cleaning",
    icon: "🧹",
    bg: "bg-green-100",
    desc: "Report room cleaning, bathroom cleaning, garbage and other cleanliness-related issues.",
  },
  {
    name: "Food",
    displayName: "Food",
    icon: "🍱",
    bg: "bg-red-100",
    desc: "Report food quality, quantity, hygiene, delivery and other food-related issues.",
  },
];

function Home() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    resolutionRate: 0,
  });

  const [loadingStats, setLoadingStats] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkRole = () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userObj = JSON.parse(storedUser);
          setIsAdmin(userObj?.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      }
    };

    checkRole();
    window.addEventListener("storage", checkRole);
    window.addEventListener("userChanged", checkRole);

    return () => {
      window.removeEventListener("storage", checkRole);
      window.removeEventListener("userChanged", checkRole);
    };
  }, []);

  // ================= FETCH COMPLAINT STATISTICS =================

  const fetchStats = async () => {
    try {
      const response = await api.get("/complaints/stats");
      const data = response.data;

      setStats({
        totalComplaints: data.totalComplaints || 0,
        resolvedComplaints: data.resolvedComplaints || 0,
        resolutionRate: data.resolutionRate || 0,
      });
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Fetch when Home page loads
  useEffect(() => {
    fetchStats();

    // Refresh statistics every 10 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-50 text-gray-800 pt-20">

      {/* =========================================================
          HERO SECTION
      ========================================================= */}

      <section
        id="home"
        className="min-h-screen bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600 text-white flex items-center"
      >
        <div className="max-w-7xl mx-auto px-6 py-20 w-full">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* LEFT CONTENT */}

            <div>

              <p className="uppercase tracking-[4px] text-cyan-200 font-semibold mb-5">
                Smart Complaint Management
              </p>

              <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6">
                Report Your Issues.
                <br />

                <span className="text-cyan-200">
                  Get Them Resolved.
                </span>
              </h1>

              <p className="text-lg text-indigo-100 leading-relaxed mb-8 max-w-xl">
                Easily report your complaints, track their progress,
                and get faster solutions through our smart complaint
                management platform.
              </p>

              <div className="flex flex-wrap gap-4">
                {isAdmin ? (
                  <button
                    onClick={() => navigate("/admin-dashboard")}
                    className="bg-white text-indigo-700 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition"
                  >
                    Admin Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => navigate("/complaint")}
                      className="bg-white text-indigo-700 px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition"
                    >
                      Submit a Complaint
                    </button>

                    <button
                      onClick={() => navigate("/my-complaints")}
                      className="border-2 border-white text-white px-8 py-3 rounded-full font-bold hover:bg-white hover:text-indigo-700 transition"
                    >
                      My Complaints
                    </button>
                  </>
                )}
              </div>

            </div>


            {/* RIGHT IMAGE */}

            <div className="relative">

              <img
                src="https://cdn.prod.website-files.com/6474afeeb40eaf59586560eb/6542919d97b589dd282c0036_integratedcomplaint%20handeling-p-800.jpg"
                alt="Complaint Management"
                className="w-full h-[430px] object-cover rounded-3xl shadow-2xl"
              />

              {/* RESOLUTION BADGE */}

              <div className="absolute -bottom-6 -left-6 bg-white text-gray-800 rounded-2xl shadow-2xl px-6 py-5">

                <p className="text-sm text-gray-500">
                  Resolution Rate
                </p>

                <h3 className="text-3xl font-black text-green-600">
                  {loadingStats ? "..." : `${stats.resolutionRate}%`}
                </h3>

              </div>

            </div>

          </div>
        </div>
      </section>


      {/* =========================================================
          LIVE STATISTICS
      ========================================================= */}

      <section className="bg-white py-16">

        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-10">

            <p className="text-indigo-600 uppercase tracking-[3px] font-semibold">
              Live Statistics
            </p>

            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2">
              Resolve X at a Glance
            </h2>

            <p className="text-gray-500 mt-3">
              Statistics are automatically updated from our complaint system.
            </p>

          </div>


          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            {/* TOTAL COMPLAINTS */}

            <div className="bg-indigo-50 rounded-2xl p-7 text-center border border-indigo-100 hover:shadow-xl transition">

              <h2 className="text-4xl font-black text-indigo-600">

                {loadingStats
                  ? "..."
                  : `${stats.totalComplaints}+`}

              </h2>

              <p className="text-gray-600 mt-2 font-medium">
                Complaints Received
              </p>

            </div>


            {/* RESOLVED */}

            <div className="bg-green-50 rounded-2xl p-7 text-center border border-green-100 hover:shadow-xl transition">

              <h2 className="text-4xl font-black text-green-600">

                {loadingStats
                  ? "..."
                  : `${stats.resolvedComplaints}+`}

              </h2>

              <p className="text-gray-600 mt-2 font-medium">
                Complaints Resolved
              </p>

            </div>


            {/* RATE */}

            <div className="bg-purple-50 rounded-2xl p-7 text-center border border-purple-100 hover:shadow-xl transition">

              <h2 className="text-4xl font-black text-purple-600">

                {loadingStats
                  ? "..."
                  : `${stats.resolutionRate}%`}

              </h2>

              <p className="text-gray-600 mt-2 font-medium">
                Resolution Rate
              </p>

            </div>


            {/* RATING */}

            <div className="bg-orange-50 rounded-2xl p-7 text-center border border-orange-100 hover:shadow-xl transition">

              <h2 className="text-4xl font-black text-orange-500">
                4.8/5
              </h2>

              <p className="text-gray-600 mt-2 font-medium">
                User Rating
              </p>

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          COMPLAINT CATEGORIES
      ========================================================= */}

      <section
        id="categories"
        className="py-20 bg-gray-50"
      >

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-14">

            <p className="text-indigo-600 uppercase tracking-[3px] font-semibold">
              {isAdmin ? "Complaint Categories" : "Report An Issue"}
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3">
              Types of Complaints
            </h2>

            <p className="text-gray-500 mt-4 text-lg">
              {isAdmin
                ? "Active complaint categories monitored and managed across the system."
                : "Select a category and report your issue easily."}
            </p>

          </div>


          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {CATEGORY_LIST.map((cat) => {
              if (isAdmin) {
                return (
                  <div
                    key={cat.name}
                    className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 cursor-default select-none"
                  >
                    <div
                      className={`w-16 h-16 ${cat.bg} rounded-2xl flex items-center justify-center text-3xl mb-6`}
                    >
                      {cat.icon}
                    </div>

                    <h3 className="text-2xl font-bold mb-3 text-gray-900">
                      {cat.displayName || cat.name}
                    </h3>

                    <p className="text-gray-500 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={cat.name}
                  className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-2xl hover:-translate-y-1 transition duration-300 border border-gray-100"
                >
                  <div
                    className={`w-16 h-16 ${cat.bg} rounded-2xl flex items-center justify-center text-3xl mb-6`}
                  >
                    {cat.icon}
                  </div>

                  <h3 className="text-2xl font-bold mb-3">
                    {cat.displayName || cat.name}
                  </h3>

                  <p className="text-gray-500 leading-relaxed">
                    {cat.desc}
                  </p>

                  <button
                    onClick={() =>
                      navigate("/complaint", {
                        state: { category: cat.name },
                      })
                    }
                    className="text-indigo-600 font-semibold mt-6 hover:underline inline-block"
                  >
                    Report Issue →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* =========================================================
          HOW IT WORKS
      ========================================================= */}

      <section className="py-20 bg-white">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-14">

            <p className="text-indigo-600 uppercase tracking-[3px] font-semibold">
              Simple Process
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-3">
              How It Works
            </h2>

          </div>


          <div className="grid md:grid-cols-4 gap-10">

            <div className="text-center">

              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5">
                01
              </div>

              <h3 className="text-xl font-bold mb-3">
                Submit Complaint
              </h3>

              <p className="text-gray-500">
                Describe your problem and submit your complaint online.
              </p>

            </div>


            <div className="text-center">

              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5">
                02
              </div>

              <h3 className="text-xl font-bold mb-3">
                Admin Reviews
              </h3>

              <p className="text-gray-500">
                The administrator reviews your complaint and processes it.
              </p>

            </div>


            <div className="text-center">

              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5">
                03
              </div>

              <h3 className="text-xl font-bold mb-3">
                My Complaints Status
              </h3>

              <p className="text-gray-500">
                View real-time updates and status in your My Complaints dashboard.
              </p>

            </div>


            <div className="text-center">

              <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5">
                04
              </div>

              <h3 className="text-xl font-bold mb-3">
                Get Resolution
              </h3>

              <p className="text-gray-500">
                Receive an update when your complaint is successfully
                resolved.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          ABOUT
      ========================================================= */}

      <section
        id="about"
        className="py-20 bg-gray-50"
      >

        <div className="max-w-7xl mx-auto px-6">

          <div className="grid md:grid-cols-2 gap-12 items-center">

            <img
              src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=80"
              alt="Our Team"
              className="rounded-3xl shadow-xl w-full h-[400px] object-cover"
            />


            <div>

              <p className="text-indigo-600 uppercase tracking-[3px] font-semibold">
                About Us
              </p>

              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mt-3 mb-6">
                Making Complaint Management Smarter
              </h2>

              <p className="text-gray-600 leading-relaxed mb-5 text-lg">
                Resolve X is a smart complaint management platform
                designed to make reporting and resolving everyday issues
                simple and efficient.
              </p>

              <p className="text-gray-600 leading-relaxed mb-7">
                Users can submit complaints, track their status and
                receive updates while administrators manage complaints
                and work towards quick resolutions.
              </p>

              <button
                onClick={() => navigate("/about")}
                className="bg-indigo-600 text-white px-7 py-3 rounded-full font-semibold hover:bg-indigo-700 transition"
              >
                Learn More
              </button>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          USER FEEDBACK
      ========================================================= */}

      <section className="py-20 bg-white">

        <div className="max-w-7xl mx-auto px-6">

          <div className="text-center mb-12">

            <p className="text-indigo-600 uppercase tracking-[3px] font-semibold">
              User Feedback
            </p>

            <h2 className="text-4xl md:text-5xl font-black mt-3">
              What Our Users Say
            </h2>

          </div>


          <div className="grid md:grid-cols-3 gap-7">


            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition">

              <div className="text-yellow-400 text-xl mb-5">
                ★★★★★
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">
                "Very easy to submit and track my complaint. The process
                was simple and clear."
              </p>

              <h4 className="font-bold">
                Priya
              </h4>

              <p className="text-sm text-gray-500">
                Registered User
              </p>

            </div>


            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition">

              <div className="text-yellow-400 text-xl mb-5">
                ★★★★★
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">
                "My complaint was resolved quickly. I could easily check
                the status."
              </p>

              <h4 className="font-bold">
                Rahul
              </h4>

              <p className="text-sm text-gray-500">
                Registered User
              </p>

            </div>


            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition">

              <div className="text-yellow-400 text-xl mb-5">
                ★★★★☆
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">
                "A simple and user-friendly platform for reporting
                community problems."
              </p>

              <h4 className="font-bold">
                Anjali
              </h4>

              <p className="text-sm text-gray-500">
                Registered User
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =========================================================
          CALL TO ACTION
      ========================================================= */}

      <section className="bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600 text-white py-16">

        <div className="max-w-4xl mx-auto px-6 text-center">

          <h2 className="text-4xl md:text-5xl font-black mb-5">
            Have an Issue to Report?
          </h2>

          <p className="text-indigo-100 text-lg mb-8">
            Help improve your environment by reporting an issue today.
          </p>

          <button
            onClick={() => navigate(isAdmin ? "/admin-dashboard" : "/complaint")}
            className="bg-white text-indigo-700 px-8 py-3 rounded-full font-bold hover:scale-105 transition"
          >
            {isAdmin ? "Admin Dashboard" : "Submit Your Complaint"}
          </button>

        </div>

      </section>


      {/* =========================================================
          FOOTER
      ========================================================= */}

      <footer
        id="contact"
        className="text-gray-300 bg-gray-950"
      >

        <div className="max-w-7xl mx-auto px-6 py-14">

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">


            {/* BRAND */}

            <div>

              <h2 className="text-2xl font-black text-white mb-4">
                Resolve
                <span className="text-cyan-400">
                  X
                </span>
              </h2>

              <p className="text-gray-400 leading-relaxed">
                A smart platform for reporting, tracking and resolving
                complaints efficiently.
              </p>

            </div>


            {/* QUICK LINKS */}

            <div>

              <h3 className="text-white font-bold text-lg mb-5">
                Quick Links
              </h3>

              <ul className="space-y-3">

                <li>
                  <a
                    href="#home"
                    className="hover:text-cyan-400 transition"
                  >
                    Home
                  </a>
                </li>

                <li>
                  <a
                    href="#categories"
                    className="hover:text-cyan-400 transition"
                  >
                    Categories
                  </a>
                </li>

                <li>
                  <a
                    href="#about"
                    className="hover:text-cyan-400 transition"
                  >
                    About Us
                  </a>
                </li>

                <li>
                  <a
                    href="#contact"
                    className="hover:text-cyan-400 transition"
                  >
                    Contact Us
                  </a>
                </li>

              </ul>

            </div>


            {/* CATEGORIES */}

            <div>

              <h3 className="text-white font-bold text-lg mb-5">
                Complaint Categories
              </h3>

              <ul className="space-y-3">

                <li>Electricity</li>
                <li>Plumbing</li>
                <li>Network / WiFi</li>
                <li>Carpenter</li>
                <li>Cleaning</li>
                <li>Food</li>

              </ul>

            </div>


            {/* CONTACT */}

            <div>

              <h3 className="text-white font-bold text-lg mb-5">
                Contact Us
              </h3>

              <ul className="space-y-4 text-gray-400">

                <li>
                  support@resolvex.com
                </li>

                <li>
                  +91 98765 43210
                </li>

                <li>
                  Andhra Pradesh, India
                </li>

              </ul>

            </div>

          </div>

        </div>


        {/* FOOTER BOTTOM */}

        <div className="border-t border-gray-800">

          <div className="max-w-7xl mx-auto px-6 py-5 text-center">

            <p className="text-gray-500 text-sm">
              © 2026 Resolve X. All Rights Reserved.
            </p>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default Home;