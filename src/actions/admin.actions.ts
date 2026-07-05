"use server";

import { z } from "zod";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertRole } from "@/lib/auth-guard";
import { UserRole } from "@/generated/prisma/enums";

const shopInputSchema = z.object({
  name: z.string().min(3, "Shop name must be at least 3 characters").max(50),
  slug: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional(),
});

const createSellerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  shop: shopInputSchema,
});

const promoteBuyerSchema = z.object({
  email: z.string().email("Invalid email address"),
  shop: shopInputSchema,
});

export type CreateSellerInput = z.infer<typeof createSellerSchema>;
export type PromoteBuyerInput = z.infer<typeof promoteBuyerSchema>;

function generateThrowawayPassword() {
  // Never surfaced to the admin or the seller; the seller sets their own
  // password via the invite email triggered right after account creation.
  return randomBytes(24).toString("base64url");
}

/**
 * Creates a brand-new seller account + shop, then sends the seller a
 * "set your password" email. Admin-only.
 */
export async function createSellerWithShop(data: CreateSellerInput) {
  try {
    await assertRole([UserRole.ADMIN]);

    const parsed = createSellerSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input",
        validationErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name, email, shop } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    const existingShop = await prisma.shop.findUnique({ where: { slug: shop.slug } });
    if (existingShop) {
      return { success: false, error: "Shop URL slug is already taken." };
    }

    // Better Auth owns password hashing + the Account row; it is not part
    // of the Prisma transaction below, so we compensate manually if the
    // transaction fails after the user was created.
    const signUpResult = await auth.api.signUpEmail({
      body: { name, email, password: generateThrowawayPassword() },
    });

    const newUserId = signUpResult.user.id;

    try {
      const shopRecord = await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: newUserId },
          data: { role: UserRole.SELLER, emailVerified: true },
        });

        return tx.shop.create({
          data: {
            name: shop.name,
            slug: shop.slug,
            description: shop.description,
            userId: newUserId,
          },
        });
      });

      await auth.api.requestPasswordReset({
        body: { email, redirectTo: "/reset-password" },
      });

      return { success: true, seller: { id: newUserId, name, email }, shop: shopRecord };
    } catch (transactionError) {
      // Roll back the orphaned auth user created above.
      await prisma.user.delete({ where: { id: newUserId } }).catch(() => {});
      throw transactionError;
    }
  } catch (error: any) {
    console.error("Create seller error:", error);
    return { success: false, error: error.message || "Failed to create seller." };
  }
}

/**
 * Promotes an existing buyer to seller and creates their shop atomically.
 * Admin-only.
 */
export async function promoteBuyerToSeller(data: PromoteBuyerInput) {
  try {
    await assertRole([UserRole.ADMIN]);

    const parsed = promoteBuyerSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input",
        validationErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { email, shop } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email }, include: { shop: true } });
    if (!user) {
      return { success: false, error: "No user found with this email." };
    }

    if (user.role !== UserRole.BUYER) {
      return { success: false, error: `This user is already a ${user.role.toLowerCase()}.` };
    }

    if (user.shop) {
      return { success: false, error: "This user already has a shop." };
    }

    const existingShop = await prisma.shop.findUnique({ where: { slug: shop.slug } });
    if (existingShop) {
      return { success: false, error: "Shop URL slug is already taken." };
    }

    const shopRecord = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { role: UserRole.SELLER },
      });

      return tx.shop.create({
        data: {
          name: shop.name,
          slug: shop.slug,
          description: shop.description,
          userId: user.id,
        },
      });
    });

    return {
      success: true,
      seller: { id: user.id, name: user.name, email: user.email },
      shop: shopRecord,
    };
  } catch (error: any) {
    console.error("Promote buyer error:", error);
    return { success: false, error: error.message || "Failed to promote buyer." };
  }
}

/**
 * Lists all sellers with their shop for the admin sellers table.
 */
export async function listSellers() {
  await assertRole([UserRole.ADMIN]);

  return prisma.user.findMany({
    where: { role: UserRole.SELLER },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      shop: {
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true, orders: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Lists buyers eligible for promotion (BUYER role, no shop yet).
 */
export async function listPromotableBuyers() {
  await assertRole([UserRole.ADMIN]);

  return prisma.user.findMany({
    where: { role: UserRole.BUYER, shop: null },
    select: { id: true, name: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

/**
 * Platform-wide counts for the admin overview page.
 */
export async function getAdminStats() {
  await assertRole([UserRole.ADMIN]);

  const [buyers, sellers, shops, products, orders] = await Promise.all([
    prisma.user.count({ where: { role: UserRole.BUYER } }),
    prisma.user.count({ where: { role: UserRole.SELLER } }),
    prisma.shop.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);

  return { buyers, sellers, shops, products, orders };
}
