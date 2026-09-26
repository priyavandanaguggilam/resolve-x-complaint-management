import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 pt-20">
      <div className="text-center max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-200">
        <div className="text-6xl font-black text-indigo-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          Page Not Found
        </h1>
        <p className="text-slate-500 mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block bg-linear-to-r from-indigo-600 to-cyan-500 text-white font-semibold px-6 py-3 rounded-xl shadow hover:scale-105 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
