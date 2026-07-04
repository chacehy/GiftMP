"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { assertRole } from "@/lib/auth-guard";
import { imageUrlSchema } from "@/lib/schemas";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { UserRole } from "@/generated/prisma/enums";

const reviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  images: z.array(imageUrlSchema).max(5).default([]),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

/**
 * Submit a product review (Buyer action)
 */
export async function submitReview(data: ReviewInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to submit a review." };
    }

    const parsedData = reviewSchema.safeParse(data);
    if (!parsedData.success) {
      return { 
        success: false, 
        error: "Invalid input", 
        validationErrors: parsedData.error.flatten().fieldErrors 
      };
    }

    const { productId, rating, comment, images } = parsedData.data;

    // Optional but recommended: Verify the user has actually purchased this product before allowing a review.
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          buyerId: session.user.id,
          status: {
            in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"],
          },
        },
      },
    });

    if (!hasPurchased) {
      return { success: false, error: "You can only review products you have purchased." };
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    const review = await prisma.$transaction(async (tx) => {
      const saved = existingReview
        ? await tx.review.update({
            where: { id: existingReview.id },
            data: { rating, comment },
          })
        : await tx.review.create({
            data: { rating, comment, productId, userId: session.user.id },
          });

      // Overwrite photos on every submit (create-or-edit uses the same form).
      await tx.reviewImage.deleteMany({ where: { reviewId: saved.id } });
      if (images.length > 0) {
        await tx.reviewImage.createMany({
          data: images.map((url, position) => ({ url, position, reviewId: saved.id })),
        });
      }

      return saved;
    });

    revalidatePath(`/product/${productId}`);

    return { success: true, review };
  } catch (error: any) {
    console.error("Submit review error:", error);
    return { success: false, error: error.message || "Failed to submit review." };
  }
}

const respondSchema = z.object({
  reviewId: z.string().cuid(),
  response: z.string().min(1, "Response cannot be empty").max(500),
});

/**
 * Lets the seller who owns the reviewed product's shop respond once to a review.
 */
export async function respondToReview(data: z.infer<typeof respondSchema>) {
  try {
    const { session } = await assertRole([UserRole.SELLER, UserRole.ADMIN]);

    const parsed = respondSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid input" };
    }

    const { reviewId, response } = parsed.data;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { product: { include: { shop: true } } },
    });

    if (!review) {
      return { success: false, error: "Review not found." };
    }

    if (review.product.shop.userId !== session.user.id) {
      return { success: false, error: "You can only respond to reviews on your own products." };
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { sellerResponse: response, sellerRespondedAt: new Date() },
    });

    revalidatePath(`/product/${review.productId}`);

    return { success: true, review: updated };
  } catch (error: any) {
    console.error("Respond to review error:", error);
    return { success: false, error: error.message || "Failed to submit response." };
  }
}
