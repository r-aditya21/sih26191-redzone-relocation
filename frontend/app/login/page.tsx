"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { login } from "../../lib/auth";
import { useAuth } from "../../lib/AuthContext";

export default function LoginPage() {
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await login(email, password);
      setSession(token, user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>RakshaGrid</h1>
        <p style={styles.subtitle}>Sign in to continue</p>

        <label style={styles.label}>
          Email
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>

        <p style={styles.footerText}>
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1120" },
  card: { width: 360, padding: 32, borderRadius: 12, background: "#111827", display: "flex", flexDirection: "column", gap: 12 },
  title: { color: "#fff", margin: 0, fontSize: 24 },
  subtitle: { color: "#9ca3af", margin: "0 0 8px 0", fontSize: 14 },
  label: { color: "#d1d5db", fontSize: 13, display: "flex", flexDirection: "column", gap: 4 },
  input: { padding: "8px 10px", borderRadius: 6, border: "1px solid #374151", background: "#1f2937", color: "#fff" },
  button: { marginTop: 8, padding: "10px 0", borderRadius: 6, border: "none", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 },
  error: { color: "#f87171", fontSize: 13, margin: 0 },
  footerText: { color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 8 },
};
