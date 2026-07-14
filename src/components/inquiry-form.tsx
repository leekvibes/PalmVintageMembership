"use client";

import { useState } from "react";

export function InquiryForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-px bg-gold/40 mx-auto mb-8" />
        <p className="font-script text-gold text-3xl mb-4">Thank you</p>
        <p className="font-body text-cream/60">
          A member of our team will be in touch shortly.
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-cream/5 border border-cream/15 px-4 py-3.5 text-cream font-body placeholder:text-cream/25 focus:outline-none focus:border-gold/40 transition-colors";
  const labelClass =
    "block text-[11px] uppercase tracking-[0.14em] text-cream/40 mb-2 font-sans";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <input type="hidden" name="source" value="membership_page" />
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className={inputClass}
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className={inputClass}
            placeholder="(555) 000-0000"
          />
        </div>
        <div>
          <label htmlFor="program" className={labelClass}>
            Program Interest *
          </label>
          <select
            id="program"
            name="program"
            required
            className={`${inputClass} appearance-none`}
          >
            <option value="" className="bg-navy-darkest">
              Select a program
            </option>
            <option value="chauffeur" className="bg-navy-darkest">
              Chauffeur Membership
            </option>
            <option value="special_event" className="bg-navy-darkest">
              Special Event Experience
            </option>
            <option value="not_sure" className="bg-navy-darkest">
              Not sure yet
            </option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className={labelClass}>
          Message / Preferred Dates
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Tell us about your interest, preferred dates, or any questions..."
        />
      </div>

      {status === "error" && (
        <p className="text-red-400 text-sm font-body">
          Something went wrong. Please try again or email us directly.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full border border-gold/50 text-gold font-serif text-sm uppercase tracking-[0.15em] px-8 py-4 hover:bg-gold/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "sending" ? "Submitting..." : "Submit Inquiry"}
      </button>
    </form>
  );
}
