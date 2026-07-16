import nodemailer from "nodemailer";
import { BUSINESS } from "./config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatTime(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function vehicleLabel(v: string | null): string {
  if (!v) return "TBD";
  if (v === "rolls_royce") return "Rolls-Royce";
  if (v === "escalade") return "Cadillac Escalade";
  return v;
}

function emailTemplate(heading: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string): string {
  const cta = ctaLabel && ctaUrl
    ? `<tr><td style="padding:4px 40px 8px;text-align:center"><a href="${ctaUrl}" style="display:inline-block;border:1px solid rgba(212,160,23,0.5);color:#d4a017;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none;padding:14px 32px">${ctaLabel}</a></td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#111111">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#111111">
<tr><td align="center" style="padding:24px 16px">
<!--[if mso]><table width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0e1a;max-width:600px;margin:0 auto">
<tr><td style="height:3px;background:linear-gradient(90deg,#0a0e1a,#d4a017,#0a0e1a)"></td></tr>
<tr><td style="padding:40px 40px 8px;text-align:center">
<table cellpadding="0" cellspacing="0" border="0" align="center"><tr>
<td style="width:40px;height:1px;background-color:#d4a017;opacity:0.4"></td>
<td style="padding:0 16px"><p style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#d4a017;margin:0">Palm Vintage</p></td>
<td style="width:40px;height:1px;background-color:#d4a017;opacity:0.4"></td>
</tr></table>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:8px;letter-spacing:0.18em;text-transform:uppercase;color:#f5f0e8;opacity:0.3;margin:6px 0 0">Philadelphia</p>
</td></tr>
<tr><td style="padding:0 40px"><div style="height:1px;background-color:#f5f0e8;opacity:0.08"></div></td></tr>
<tr><td style="padding:32px 40px 0;text-align:center"><p style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#f5f0e8;margin:0;font-weight:normal">${heading}</p></td></tr>
<tr><td style="padding:28px 40px 0">${bodyHtml}</td></tr>
${cta}
<tr><td style="padding:24px 40px 0"><div style="height:1px;background-color:#f5f0e8;opacity:0.06"></div></td></tr>
<tr><td style="padding:20px 40px 32px;text-align:center"><p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:11px;color:#f5f0e8;opacity:0.25;margin:0;line-height:1.5">${BUSINESS.name} &middot; ${BUSINESS.venue}<br>${BUSINESS.address}</p></td></tr>
<tr><td style="height:3px;background:linear-gradient(90deg,#0a0e1a,#d4a017,#0a0e1a)"></td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;
}

const P = (text: string) =>
  `<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#f5f0e8;opacity:0.75;line-height:1.6;margin:0 0 16px">${text}</p>`;

function detailRow(label: string, value: string, isLast = false, isGold = false): string {
  const borderStyle = isLast ? "" : "border-bottom:1px solid rgba(245,240,232,0.06);";
  const valueColor = isGold ? "color:#d4a017" : "color:#f5f0e8;opacity:0.85";
  return `<tr><td style="padding:16px 20px;${borderStyle}">
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#f5f0e8;opacity:0.4;margin:0 0 4px">${label}</p>
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;${valueColor};margin:0">${value}</p>
</td></tr>`;
}

function detailCard(rows: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:rgba(245,240,232,0.04);border:1px solid rgba(245,240,232,0.1);margin:8px 0 16px">${rows}</table>`;
}

// ── Email functions ──────────────────────────────────────────

interface InquiryData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  program: string;
  message: string | null;
}

export async function sendInquiryNotification(inquiry: InquiryData) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping notification.");
    return;
  }

  const programLabels: Record<string, string> = {
    chauffeur: "Chauffeur Membership",
    special_event: "Special Event Experience",
    not_sure: "Not sure yet",
  };

  const body = P(`New membership inquiry from <strong style="color:#f5f0e8;font-weight:500">${inquiry.name}</strong>.`)
    + detailCard(
      detailRow("Program", programLabels[inquiry.program] || inquiry.program)
      + detailRow("Email", inquiry.email)
      + detailRow("Phone", inquiry.phone || "Not provided")
      + detailRow("Message", inquiry.message || "None", true)
    );

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to: BUSINESS.inquiryEmail,
    subject: `New Membership Inquiry — ${inquiry.name}`,
    html: emailTemplate("New Membership Inquiry", body, "View in Admin", `${process.env.NEXTAUTH_URL}/admin`),
  });
}

export async function sendBookingReceived(to: string, booking: {
  userName: string;
  date: string;
  pickupTime: string;
  returnTime: string | null;
  pickupAddress: string;
  dropoffAddress: string | null;
  vehicleRequest: string | null;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping booking received email.");
    return;
  }

  const body = P(`Hi ${booking.userName},`)
    + P("Your booking request has been received. We will review and confirm within 6 hours.")
    + detailCard(
      detailRow("Date", booking.date)
      + detailRow("Pickup Time", formatTime(booking.pickupTime))
      + (booking.returnTime ? detailRow("Drop-off Time", formatTime(booking.returnTime)) : "")
      + detailRow("Pickup Address", booking.pickupAddress)
      + (booking.dropoffAddress ? detailRow("Drop-off Address", booking.dropoffAddress) : "")
      + detailRow("Vehicle Preference", vehicleLabel(booking.vehicleRequest), true, true)
    );

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Booking Request Received — ${booking.date}`,
    html: emailTemplate("Request Received", body, "View in Portal", `${process.env.NEXTAUTH_URL}/dashboard`),
  });
}

export async function sendBookingConfirmed(to: string, booking: {
  userName: string;
  date: string;
  pickupTime: string;
  returnTime: string | null;
  pickupAddress: string;
  dropoffAddress: string | null;
  vehicleAssigned: string | null;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping booking confirmed email.");
    return;
  }

  const body = P(`Hi ${booking.userName},`)
    + P("Your ride has been confirmed. Here are the details:")
    + detailCard(
      detailRow("Date", booking.date)
      + detailRow("Pickup Time", formatTime(booking.pickupTime))
      + (booking.returnTime ? detailRow("Drop-off Time", formatTime(booking.returnTime)) : "")
      + detailRow("Pickup Address", booking.pickupAddress)
      + (booking.dropoffAddress ? detailRow("Drop-off Address", booking.dropoffAddress) : "")
      + detailRow("Vehicle", vehicleLabel(booking.vehicleAssigned), true, true)
    );

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Ride is Confirmed — ${booking.date}`,
    html: emailTemplate("Your Ride is Confirmed", body, "View in Portal", `${process.env.NEXTAUTH_URL}/dashboard`),
  });
}

export async function sendRideStarting(to: string, booking: {
  userName: string;
  date: string;
  pickupTime: string;
  vehicleAssigned: string | null;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping ride starting email.");
    return;
  }

  const vLabel = vehicleLabel(booking.vehicleAssigned);
  const body = P(`Hi ${booking.userName},`)
    + P(`Your <strong style="color:#d4a017;font-weight:500">${vLabel}</strong> is on the way for your <strong style="color:#f5f0e8;font-weight:500">${formatTime(booking.pickupTime)}</strong> pickup.`)
    + P("Enjoy the ride.");

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: "Your Ride Is On the Way",
    html: emailTemplate("Your Ride Is On the Way", body),
  });
}

export async function sendRatingRequest(to: string, booking: {
  userName: string;
  bookingId: string;
  date: string;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping rating request email.");
    return;
  }

  const body = P(`Hi ${booking.userName},`)
    + P(`We hope you enjoyed your ride on ${booking.date}. We would love to hear your feedback.`);

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: "How Was Your Ride?",
    html: emailTemplate("How Was Your Ride?", body, "Rate Your Ride", `${process.env.NEXTAUTH_URL}/dashboard`),
  });
}

export async function sendBookingNotification(booking: {
  userName: string;
  date: string;
  pickupTime: string;
  returnTime: string | null;
  pickupAddress: string;
  dropoffAddress: string | null;
  vehicleRequest: string | null;
  passengers?: number;
  notes?: string | null;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping booking notification.");
    return;
  }

  const body = P(`A new booking request from <strong style="color:#f5f0e8;font-weight:500">${booking.userName}</strong>.`)
    + detailCard(
      detailRow("Date", booking.date)
      + detailRow("Pickup Time", formatTime(booking.pickupTime))
      + (booking.returnTime ? detailRow("Drop-off Time", formatTime(booking.returnTime)) : "")
      + detailRow("Pickup Address", booking.pickupAddress)
      + detailRow("Drop-off Address", booking.dropoffAddress || "Same as pickup")
      + detailRow("Vehicle Preference", vehicleLabel(booking.vehicleRequest))
      + (booking.passengers ? detailRow("Passengers", String(booking.passengers)) : "")
      + detailRow("Notes", booking.notes || "None", true)
    );

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to: BUSINESS.inquiryEmail,
    subject: `New Booking Request — ${booking.userName}`,
    html: emailTemplate("New Booking Request", body, "View in Admin", `${process.env.NEXTAUTH_URL}/admin`),
  });
}

export async function sendDailyBriefing(
  to: string,
  data: {
    date: string;
    bookings: {
      userName: string;
      pickupTime: string;
      returnTime: string | null;
      pickupAddress: string;
      dropoffAddress: string | null;
      vehicleAssigned: string | null;
      status: string;
      passengers: number;
      notes: string | null;
    }[];
  }
) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured. Daily briefing skipped.");
    return;
  }

  const count = data.bookings.length;
  const subject = count === 0
    ? `Daily Briefing: No rides on ${data.date}`
    : `Daily Briefing: ${count} ride${count > 1 ? "s" : ""} on ${data.date}`;

  let body: string;
  if (count === 0) {
    body = P(`No rides scheduled for today, ${data.date}.`) + P("Enjoy the downtime.");
  } else {
    const rows = data.bookings
      .sort((a, b) => a.pickupTime.localeCompare(b.pickupTime))
      .map((b, i) => {
        const time = `${formatTime(b.pickupTime)}${b.returnTime ? ` – ${formatTime(b.returnTime)}` : ""}`;
        const vehicle = vehicleLabel(b.vehicleAssigned);
        const statusBadge = b.status === "confirmed" ? "CONFIRMED" : b.status === "pending" ? "PENDING" : b.status.toUpperCase().replace("_", " ");
        const noteRow = b.notes
          ? `<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#f5f0e8;opacity:0.5;margin:6px 0 0;font-style:italic">&ldquo;${b.notes}&rdquo;</p>`
          : "";
        const isLast = i === data.bookings.length - 1;
        const borderStyle = isLast ? "" : "border-bottom:1px solid rgba(245,240,232,0.06);";

        return `<tr><td style="padding:16px 20px;${borderStyle}">
<div style="display:flex;justify-content:space-between;align-items:baseline">
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#f5f0e8;opacity:0.9;margin:0"><strong>${b.userName}</strong></p>
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#d4a017;margin:0">${statusBadge}</p>
</div>
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#f5f0e8;opacity:0.6;margin:6px 0 0">${time} &middot; ${vehicle} &middot; ${b.passengers} pax</p>
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#f5f0e8;opacity:0.5;margin:4px 0 0">Pickup: ${b.pickupAddress}${b.dropoffAddress ? ` → ${b.dropoffAddress}` : ""}</p>
${noteRow}
</td></tr>`;
      })
      .join("");

    body = P(`You have <strong style="color:#d4a017">${count} ride${count > 1 ? "s" : ""}</strong> scheduled for ${data.date}.`)
      + detailCard(rows);
  }

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html: emailTemplate(subject, body, "Open Dashboard", process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/admin` : undefined),
  });
}

export async function sendPendingReminder(
  to: string,
  bookings: {
    userName: string;
    date: string;
    pickupTime: string;
    returnTime: string | null;
    vehicleRequest: string | null;
    hoursWaiting: number;
  }[]
) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured. Pending reminder skipped.");
    return;
  }
  if (bookings.length === 0) return;

  const count = bookings.length;
  const rows = bookings
    .map((b, i) => {
      const isLast = i === bookings.length - 1;
      const borderStyle = isLast ? "" : "border-bottom:1px solid rgba(245,240,232,0.06);";
      const time = `${formatTime(b.pickupTime)}${b.returnTime ? ` – ${formatTime(b.returnTime)}` : ""}`;
      return `<tr><td style="padding:16px 20px;${borderStyle}">
<div style="display:flex;justify-content:space-between;align-items:baseline">
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;color:#f5f0e8;opacity:0.9;margin:0"><strong>${b.userName}</strong></p>
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#d4a017;margin:0">Waiting ${b.hoursWaiting}h</p>
</div>
<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#f5f0e8;opacity:0.6;margin:6px 0 0">${b.date} &middot; ${time} &middot; ${vehicleLabel(b.vehicleRequest)}</p>
</td></tr>`;
    })
    .join("");

  const body = P(`You have <strong style="color:#d4a017">${count} booking request${count > 1 ? "s" : ""}</strong> still awaiting confirmation. Please review and confirm or decline.`)
    + detailCard(rows);

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: `Action Needed: ${count} booking${count > 1 ? "s" : ""} awaiting confirmation`,
    html: emailTemplate("Bookings Awaiting Confirmation", body, "Review in Admin", process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/admin` : undefined),
  });
}

export async function sendWaitlistOpening(to: string, data: {
  userName: string;
  date: string;
  pickupTime: string;
  vehicleRequest: string | null;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured. Waitlist opening skipped.");
    return;
  }

  const vLabel = data.vehicleRequest ? vehicleLabel(data.vehicleRequest) : "a vehicle";
  const body = P(`Hi ${data.userName},`)
    + P(`Good news — <strong style="color:#d4a017;font-weight:500">${vLabel}</strong> may now be available for your requested time on <strong style="color:#f5f0e8;font-weight:500">${data.date}</strong> around ${formatTime(data.pickupTime)}.`)
    + P("Availability is first-come — book now to secure it.");

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: `A Spot May Have Opened — ${data.date}`,
    html: emailTemplate("A Spot May Have Opened", body, "Book Now", `${process.env.NEXTAUTH_URL}/dashboard`),
  });
}

export async function sendPasswordReset(to: string, userName: string, resetUrl: string) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured. Reset URL:", resetUrl);
    return;
  }

  const body = P(`Hi ${userName},`)
    + P("You requested a password reset. Click the button below to set a new password.")
    + `<div style="height:8px"></div>`
    + `<p style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;color:#f5f0e8;opacity:0.4;line-height:1.6;margin:16px 0 0;text-align:center">This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>`;

  await transporter.sendMail({
    from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
    to,
    subject: "Reset Your Password",
    html: emailTemplate("Reset Your Password", body, "Reset Password", resetUrl),
  });
}
