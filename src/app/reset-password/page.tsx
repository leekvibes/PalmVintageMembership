"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 mb-4">Invalid reset link. No token provided.</p>
        <a href="/forgot-password" className="text-gold text-sm hover:text-gold-bright transition-colors">
          Request a new reset link
        </a>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reset password");
      }

      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full border border-gold/40 flex items-center justify-center mx-auto mb-6">
          <span className="text-gold text-2xl">&#10003;</span>
        </div>
        <h2 className="text-xl font-light text-cream mb-3">Password Reset</h2>
        <p className="text-cream/60 mb-6">Your password has been updated. You can now sign in.</p>
        <a
          href="/login"
          className="border border-gold/60 text-gold px-8 py-3 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 transition-colors inline-block"
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <>
      <p className="text-cream/40 text-sm text-center mb-6">
        Enter your new password below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-cream/5 border border-cream/15 px-4 py-3 pr-12 text-cream focus:outline-none focus:border-gold/50 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 hover:text-cream/70 transition-colors text-xs uppercase tracking-wider"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-xs uppercase tracking-[0.12em] text-cream/50 mb-2">
            Confirm Password
          </label>
          <input
            type={showPassword ? "text" : "password"}
            id="confirm"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-cream/5 border border-cream/15 px-4 py-3 text-cream focus:outline-none focus:border-gold/50 transition-colors"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full border border-gold/60 text-gold px-8 py-3.5 text-sm uppercase tracking-[0.14em] hover:bg-gold/10 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-navy-darkest px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-gold uppercase tracking-[0.18em] text-sm font-mono mb-3">
            Palm Vintage
          </p>
          <h1 className="text-2xl font-light text-cream tracking-tight">
            Set New Password
          </h1>
        </div>
        <Suspense fallback={<p className="text-cream/40 text-center text-sm">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
