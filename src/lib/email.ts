import nodemailer from "nodemailer";
import { BUSINESS } from "./config";

const transporter = nodemailer.createTransport({
  service: "gmail",
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

export async function sendBookingConfirmed(to: string, booking: {
  userName: string;
  date: string;
  pickupTime: string;
  pickupAddress: string;
  vehicleAssigned: string | null;
}) {
  if (!process.env.SMTP_USER) {
    console.log("[email] SMTP not configured, skipping booking confirmed email.");
    return;
  }

  const vehicleLabel = booking.vehicleAssigned === "rolls_royce" ? "Rolls-Royce"
    : booking.vehicleAssigned === "escalade" ? "Cadillac Escalade"
    : booking.vehicleAssigned || "TBD";

  await transporter.sendMail({
    from: `"Palm Vintage" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Ride is Confirmed — ${booking.date}`,
    text: [
      `Hi ${booking.userName},`,
      "",
      `Your ride has been confirmed.`,
      "",
      `Date: ${booking.date}`,
      `Pickup Time: ${booking.pickupTime}`,
      `Pickup Address: ${booking.pickupAddress}`,
      `Vehicle: ${vehicleLabel}`,
      "",
      `You can view your booking details in the member portal:`,
      `${process.env.NEXTAUTH_URL}/dashboard`,
      "",
      `— ${BUSINESS.name}`,
    ].join("\n"),
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

  const vehicleLabel = booking.vehicleAssigned === "rolls_royce" ? "Rolls-Royce"
    : booking.vehicleAssigned === "escalade" ? "Cadillac Escalade"
    : booking.vehicleAssigned || "your vehicle";

  await transporter.sendMail({
    from: `"Palm Vintage" <${process.env.SMTP_USER}>`,
    to,
    subject: `Your Ride Is On the Way`,
    text: [
      `Hi ${booking.userName},`,
      "",
      `Your ${vehicleLabel} is on the way for your ${booking.pickupTime} pickup.`,
      "",
      `Enjoy the ride!`,
      "",
      `— ${BUSINESS.name}`,
    ].join("\n"),
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

  await transporter.sendMail({
    from: `"Palm Vintage" <${process.env.SMTP_USER}>`,
    to,
    subject: `How Was Your Ride?`,
    text: [
      `Hi ${booking.userName},`,
      "",
      `We hope you enjoyed your ride on ${booking.date}.`,
      `We would love to hear your feedback — please rate your ride in the member portal:`,
      `${process.env.NEXTAUTH_URL}/dashboard`,
      "",
      `— ${BUSINESS.name}`,
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
