import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      include: {
        children: { orderBy: { name: "asc" } },
      },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json([]);
  }
}
