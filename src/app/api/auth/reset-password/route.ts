import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";

export async function POST(request: Request) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });

  if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash },
    }),
    prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({ success: true });
}
