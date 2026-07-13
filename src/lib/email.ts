import nodemailer from "nodemailer";
import { BUSINESS } from "./config";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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
    console.log("[email] Inquiry received:", inquiry);
    return;
  }

  const programLabels: Record<string, string> = {
    chauffeur: "Chauffeur Membership",
    special_event: "Special Event Experience",
    not_sure: "Not sure yet",
  };

  await transporter.sendMail({
    from: `"Palm Vintage Membership" <${process.env.SMTP_USER}>`,
    to: BUSINESS.inquiryEmail,
    subject: `New Membership Inquiry — ${inquiry.name}`,
    text: [
      `New membership inquiry from ${inquiry.name}`,
      "",
      `Program: ${programLabels[inquiry.program] || inquiry.program}`,
      `Name: ${inquiry.name}`,
      `Email: ${inquiry.email}`,
      `Phone: ${inquiry.phone || "Not provided"}`,
      `Message: ${inquiry.message || "None"}`,
      "",
      `View in admin: ${process.env.NEXTAUTH_URL}/admin/inquiries`,
    ].join("\n"),
  });
}

export async function sendBookingNotification(booking: {
  userName: string;
  date: string;
  pickupTime: string;
  pickupAddress: string;
  dropoffAddress: string | null;
  vehicleRequest: string | null;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping booking notification.");
    console.log("[email] Booking:", booking);
    return;
  }

  await transporter.sendMail({
    from: `"Palm Vintage Membership" <${process.env.SMTP_USER}>`,
    to: BUSINESS.inquiryEmail,
    subject: `New Booking Request — ${booking.userName}`,
    text: [
      `New booking request from ${booking.userName}`,
      "",
      `Date: ${booking.date}`,
      `Pickup Time: ${booking.pickupTime}`,
      `Pickup Address: ${booking.pickupAddress}`,
      `Drop-off Address: ${booking.dropoffAddress || "Same as pickup"}`,
      `Vehicle Preference: ${booking.vehicleRequest || "No preference"}`,
      "",
      `View in admin: ${process.env.NEXTAUTH_URL}/admin/bookings`,
    ].join("\n"),
  });
}
