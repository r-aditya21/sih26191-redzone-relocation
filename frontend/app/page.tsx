"use client";
import Dashboard from "./ui/Dashboard";
import { useAuth } from "../lib/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1120", color: "#9ca3af" }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    // AuthProvider is already redirecting to /login; render nothing meanwhile.
    return null;
  }

  return <Dashboard />;
}