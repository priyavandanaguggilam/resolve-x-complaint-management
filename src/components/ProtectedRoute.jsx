import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let user;
  try {
    user = JSON.parse(storedUser);
  } catch {
    user = null;
  }

  if (!user || user.status === "disabled") {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  return children;
}
