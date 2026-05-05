"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const shopSchema = z.object({
  name: z.string().min(3, "Shop name must be at least 3 characters").max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export type ShopInput = z.infer<typeof shopSchema>;

/**
 * Creates a new shop for the authenticated user and upgrades their role to SELLER
 */
export async function createShop(data: ShopInput) {
  try {
    // 1. Verify Authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validate input
    const parsedData = shopSchema.safeParse(data);
    if (!parsedData.success) {
      return { 
        success: false, 
        error: "Invalid input", 
        validationErrors: parsedData.error.flatten().fieldErrors 
      };
    }

    const { name, slug, description, bannerUrl, logoUrl } = parsedData.data;

    // 3. Check if slug is taken
    const existingShop = await prisma.shop.findUnique({
      where: { slug },
    });

    if (existingShop) {
      return { success: false, error: "Shop URL slug is already taken." };
    }

    // 4. Create shop and upgrade user role
    const shop = await prisma.$transaction(async (tx) => {
      const newShop = await tx.shop.create({
        data: {
          name,
          slug,
          description,
          bannerUrl: bannerUrl || null,
          logoUrl: logoUrl || null,
          userId: session.user.id,
        },
      });

      // Upgrade user role to SELLER if they are currently a BUYER
      if ((session.user as any).role === "BUYER" || !(session.user as any).role) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { role: "SELLER" },
        });
      }

      return newShop;
    });

    return { success: true, shop };
  } catch (error: any) {
    console.error("Create shop error:", error);
    return { success: false, error: error.message || "Failed to create shop." };
  }
}

/**
 * Updates an existing shop
 */
export async function updateShop(data: ShopInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const parsedData = shopSchema.safeParse(data);
    if (!parsedData.success) {
      return { 
        success: false, 
        error: "Invalid input", 
        validationErrors: parsedData.error.flatten().fieldErrors 
      };
    }

    const { name, slug, description, bannerUrl, logoUrl } = parsedData.data;

    // Verify ownership
    const shop = await prisma.shop.findUnique({
      where: { userId: session.user.id },
    });

    if (!shop) {
      return { success: false, error: "Shop not found." };
    }

    // Check slug collision if they are changing it
    if (slug !== shop.slug) {
      const existingShop = await prisma.shop.findUnique({
        where: { slug },
      });

      if (existingShop) {
        return { success: false, error: "Shop URL slug is already taken." };
      }
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        name,
        slug,
        description,
        bannerUrl: bannerUrl || null,
        logoUrl: logoUrl || null,
      },
    });

    return { success: true, shop: updatedShop };
  } catch (error: any) {
    console.error("Update shop error:", error);
    return { success: false, error: error.message || "Failed to update shop." };
  }
}
