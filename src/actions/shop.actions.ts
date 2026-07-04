"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/auth-guard";
import { UserRole } from "@/generated/prisma/enums";

const shopSchema = z.object({
  name: z.string().min(3, "Shop name must be at least 3 characters").max(50),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export type ShopInput = z.infer<typeof shopSchema>;

/**
 * Updates an existing shop. Shops themselves are created only by admins
 * (see src/actions/admin.actions.ts); sellers may only edit their own.
 */
export async function updateShop(data: ShopInput) {
  try {
    const { session } = await assertRole([UserRole.SELLER, UserRole.ADMIN]);

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
