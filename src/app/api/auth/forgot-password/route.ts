import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { BUSINESS } from "@/lib/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordReset.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  if (process.env.SMTP_USER) {
    await transporter.sendMail({
      from: `"${BUSINESS.name}" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: "Reset Your Password",
      text: [
        `Hi ${user.name},`,
        "",
        `You requested a password reset. Click the link below to set a new password:`,
        resetUrl,
        "",
        `This link expires in 1 hour.`,
        "",
        `If you did not request this, you can safely ignore this email.`,
        "",
        `— ${BUSINESS.name}`,
      ].join("\n"),
    });
  } else {
    console.log("[email] SMTP not configured. Reset URL:", resetUrl);
  }

  return NextResponse.json({ success: true });
}
