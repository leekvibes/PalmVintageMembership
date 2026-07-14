"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send reset email");
      }

      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-darkest px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-gold uppercase tracking-[0.18em] text-sm font-mono mb-3">
            Palm Vintage
          </p>
          <h1 className="text-2xl font-light text-cream tracking-tight">
            Reset Password
          </h1>
        </div>

        {status === "sent" ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-6">
              <span className="text-gold text-2xl">&#10003;</span>
            </div>
            <p className="text-cream/60 mb-4">
              If an account exists for <strong className="text-cream/80">{email}</strong>,
              you will receive a password reset email shortly.
            </p>
            <a href="/login" className="text-gold text-sm hover:text-gold-bright transition-colors">
              Back to login
            </a>
          </div>
        ) : (
          <>
            <p className="text-cream/40 text-sm text-center mb-6">
              Enter your email address and we will send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full border border-gold/60 text-gold px-8 py-3.5 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
            <div className="text-center mt-6">
              <a href="/login" className="text-cream/40 text-xs hover:text-gold transition-colors">
                Back to login
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
