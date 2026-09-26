import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import api from "../api/client";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState("");
  const [notificationType, setNotificationType] = useState("success");

  const showNotification = (message, type = "success") => {
    setNotification(message);
    setNotificationType(type);

    setTimeout(() => {
      setNotification("");
    }, 3500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification("Please enter email and password", "error");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data;

      // Store JWT token & refresh token
      localStorage.setItem("token", data.token);
      localStorage.setItem("refreshToken", data.refreshToken);

      // Store user information
      localStorage.setItem("user", JSON.stringify(data.user));

      // Trigger navbar & listeners
      window.dispatchEvent(new Event("userChanged"));

      showNotification(`Welcome back, ${data.user.name}!`);

      setTimeout(() => {
        // Redirect to intended route if available, otherwise role-based landing
        const from = location.state?.from?.pathname;
        if (from) {
          navigate(from, { replace: true });
        } else if (data.user.role === "admin") {
          navigate("/", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 900);
    } catch (error) {
      console.error("Login error:", error);
      const errMsg =
        error.response?.data?.message || "Invalid credentials or server error";
      showNotification(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-700 via-purple-700 to-cyan-600 flex items-center justify-center px-6 py-12">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-2xl shadow-xl font-semibold text-white flex items-center gap-3 ${
            notificationType === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          <span>{notificationType === "error" ? "✕" : "✓"}</span>
          <span>{notification}</span>
        </div>
      )}

      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 sm:p-10">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-black">RX</span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2 text-sm">
            Login to your Resolve X account
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-sm">
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              required
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-slate-700 font-semibold text-sm">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-indigo-600 text-xs font-semzibold hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white py-3.5 rounded-xl font-bold shadow-lg hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div className="mt-6 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
          <p className="font-bold text-slate-700 mb-1">Demo Logins:</p>
          <p>
            • Admin: <span className="font-mono text-indigo-600">admin@resolvex.com</span> / <span className="font-mono">admin123</span>
          </p>
          <p>
            • Student: <span className="font-mono text-indigo-600">student@resolvex.com</span> / <span className="font-mono">student123</span>
          </p>
        </div>

        {/* Register Link */}
        <p className="text-center text-slate-500 mt-6 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 font-bold hover:underline"
          >
            Register here
          </Link>
        </p>

        {/* Back Home */}
        <div className="text-center mt-3">
          <Link
            to="/"
            className="text-slate-400 hover:text-indigo-600 text-xs font-semibold transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;