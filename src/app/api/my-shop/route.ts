import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json(null);

    const shop = await prisma.shop.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json(shop);
  } catch {
    return NextResponse.json(null);
  }
}
