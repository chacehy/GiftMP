"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const reviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
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

    const { productId, rating, comment } = parsedData.data;

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

    let review;

    if (existingReview) {
      // Update existing review
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: { rating, comment },
      });
    } else {
      // Create new review
      review = await prisma.review.create({
        data: {
          rating,
          comment,
          productId,
          userId: session.user.id,
        },
      });
    }

    revalidatePath(`/product/${productId}`);
    
    return { success: true, review };
  } catch (error: any) {
    console.error("Submit review error:", error);
    return { success: false, error: error.message || "Failed to submit review." };
  }
}
