import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendInquiryNotification } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, program, message } = body;

    if (!name || !email || !program) {
      return NextResponse.json(
        { error: "Name, email, and program are required" },
        { status: 400 }
      );
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        program,
        message: message || null,
      },
    });

    await sendInquiryNotification(inquiry).catch(console.error);

    return NextResponse.json({ success: true, id: inquiry.id });
  } catch (error) {
    console.error("Inquiry submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
