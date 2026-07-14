import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const methods = await prisma.paymentMethod.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(methods);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, last4, brand, expMonth, expYear, isDefault } = body;

  if (!type || !last4) {
    return NextResponse.json({ error: "Type and last4 are required" }, { status: 400 });
  }

  if (isDefault) {
    await prisma.paymentMethod.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const method = await prisma.paymentMethod.create({
    data: {
      userId: session.user.id,
      type,
      last4,
      brand: brand || null,
      expMonth: expMonth || null,
      expYear: expYear || null,
      isDefault: isDefault || false,
    },
  });

  return NextResponse.json(method);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const method = await prisma.paymentMethod.findUnique({ where: { id } });
  if (!method || method.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.paymentMethod.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
