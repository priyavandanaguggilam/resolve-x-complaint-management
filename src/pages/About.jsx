
import React from "react";
import { useNavigate } from "react-router-dom";

function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pt-20">

      {/* ================= HERO ================= */}
      <section className="bg-white py-20 border-b border-gray-100">

        <div className="max-w-6xl mx-auto px-6">

          <div className="grid md:grid-cols-2 gap-14 items-center">

            {/* LEFT */}
            <div>

              <p className="text-indigo-600 font-bold uppercase tracking-[3px] text-sm mb-4">
                About Resolve X
              </p>

              <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
                Smarter Way to
                <span className="text-indigo-600">
                  {" "}Manage Complaints
                </span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
                Resolve X is a smart complaint management platform that
                connects users and administrators through a simple,
                transparent and efficient complaint resolution process.
              </p>

              <div className="flex flex-wrap gap-4 mt-8">

                <button
                  onClick={() => navigate("/complaint")}
                  className="bg-indigo-600 text-white px-7 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg"
                >
                  Submit a Complaint
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="border border-gray-300 text-gray-700 px-7 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
                >
                  Back to Home
                </button>

              </div>

            </div>


            {/* RIGHT */}
            <div className="relative">

              <div className="bg-indigo-600 rounded-3xl p-2 shadow-2xl">

                <img
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=80"
                  alt="Resolve X Team"
                  className="w-full h-[390px] object-cover rounded-2xl"
                />

              </div>

              {/* SMALL INFO CARD */}
              <div className="absolute -bottom-7 -left-5 bg-white rounded-2xl shadow-xl border border-gray-100 px-6 py-5">

                <p className="text-sm text-gray-500">
                  Our Goal
                </p>

                <p className="text-xl font-black text-gray-900 mt-1">
                  Faster Resolution
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= ABOUT PROJECT ================= */}
      <section className="py-20 bg-slate-50">

        <div className="max-w-6xl mx-auto px-6">

          <div className="max-w-3xl">

            <p className="text-indigo-600 font-bold uppercase tracking-[3px] text-sm mb-3">
              Our Platform
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
              What is Resolve X?
            </h2>

            <p className="text-gray-600 text-lg leading-relaxed">
              Resolve X provides a centralized platform where users can
              report problems and easily monitor the progress of their
              complaints. Instead of depending on manual communication,
              every complaint can be submitted, reviewed and tracked
              through one system.
            </p>

          </div>


          {/* INFORMATION CARDS */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">

            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition">

              <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                01
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Simple Reporting
              </h3>

              <p className="text-gray-500 leading-relaxed">
                Users can submit their problems quickly by selecting
                the appropriate complaint category and providing details.
              </p>

            </div>


            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition">

              <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                02
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Transparent Tracking
              </h3>

              <p className="text-gray-500 leading-relaxed">
                Users can check the current status of their complaints
                and stay informed throughout the resolution process.
              </p>

            </div>


            <div className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm hover:shadow-xl transition">

              <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                03
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Efficient Management
              </h3>

              <p className="text-gray-500 leading-relaxed">
                Administrators can manage complaints, update statuses
                and work towards resolving issues efficiently.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ================= HOW IT HELPS ================= */}
      <section className="py-20 bg-white">

        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-14">

            <p className="text-indigo-600 font-bold uppercase tracking-[3px] text-sm mb-3">
              Why Resolve X
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-gray-900">
              Built for Better Complaint Management
            </h2>

            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-lg">
              Everything you need to report, manage and resolve
              complaints in one convenient platform.
            </p>

          </div>


          <div className="grid md:grid-cols-2 gap-8">

            {/* CARD 1 */}
            <div className="border border-gray-200 rounded-2xl p-8 hover:border-indigo-300 hover:shadow-lg transition">

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                For Users
              </h3>

              <p className="text-gray-500 leading-relaxed mb-5">
                Users get a simple way to communicate their problems
                and monitor the progress of every submitted complaint.
              </p>

              <ul className="space-y-3 text-gray-600">

                <li>
                  • Easy complaint submission
                </li>

                <li>
                  • Category-based reporting
                </li>

                <li>
                  • Complaint status tracking
                </li>

                <li>
                  • Personal complaint history
                </li>

              </ul>

            </div>


            {/* CARD 2 */}
            <div className="border border-gray-200 rounded-2xl p-8 hover:border-indigo-300 hover:shadow-lg transition">

              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                For Administrators
              </h3>

              <p className="text-gray-500 leading-relaxed mb-5">
                Administrators can organize complaints and monitor
                their resolution from a centralized dashboard.
              </p>

              <ul className="space-y-3 text-gray-600">

                <li>
                  • View all complaints
                </li>

                <li>
                  • Category-based management
                </li>

                <li>
                  • Update complaint status
                </li>

                <li>
                  • Monitor resolution progress
                </li>

              </ul>

            </div>

          </div>

        </div>

      </section>


      {/* ================= CATEGORIES ================= */}
      <section className="py-20 bg-slate-50">

        <div className="max-w-6xl mx-auto px-6">

          <div className="text-center mb-12">

            <p className="text-indigo-600 font-bold uppercase tracking-[3px] text-sm mb-3">
              Complaint Categories
            </p>

            <h2 className="text-4xl font-black text-gray-900">
              Report Different Types of Issues
            </h2>

          </div>


          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">

            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition">
              Electricity
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition">
              Plumbing
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition">
              Network / WiFi
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition">
              Carpenter
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition">
              Cleaning
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 text-center font-semibold text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition">
              Food
            </div>

          </div>

        </div>

      </section>


      {/* ================= CTA ================= */}
      <section className="py-20 bg-gray-900 text-white">

        <div className="max-w-4xl mx-auto px-6 text-center">

          <p className="text-indigo-300 uppercase tracking-[3px] font-bold text-sm mb-4">
            Get Started
          </p>

          <h2 className="text-4xl md:text-5xl font-black mb-5">
            Have an Issue?
          </h2>

          <p className="text-gray-400 text-lg mb-8">
            Report your complaint and let Resolve X help you get it
            resolved efficiently.
          </p>

          <button
            onClick={() => navigate("/complaint")}
            className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition"
          >
            Submit a Complaint
          </button>

        </div>

      </section>


      {/* ================= FOOTER ================= */}
      <footer className="bg-gray-950 text-gray-500 py-7">

        <div className="max-w-6xl mx-auto px-6 text-center">

          <p>
            © 2026 Resolve X. All Rights Reserved.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default About;

