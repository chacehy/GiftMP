"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const productSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  categoryId: z.string().min(1, "Category is required"),
  isPublished: z.boolean().default(false),
  images: z.array(z.string().url()).min(1, "At least one image is required"),
});

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Helper: Get current user's shop
 */
async function getMyShop() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
  });

  if (!shop) {
    throw new Error("You must create a shop first before listing products.");
  }

  return { session, shop };
}

/**
 * Create a new product listing
 */
export async function createProduct(data: ProductInput) {
  try {
    const { shop } = await getMyShop();

    const parsedData = productSchema.safeParse(data);
    if (!parsedData.success) {
      return { 
        success: false, 
        error: "Invalid input", 
        validationErrors: parsedData.error.flatten().fieldErrors 
      };
    }

    const { title, description, price, stock, categoryId, isPublished, images } = parsedData.data;

    const product = await prisma.$transaction(async (tx) => {
      // 1. Create the product
      const newProduct = await tx.product.create({
        data: {
          title,
          description,
          price,
          stock,
          categoryId,
          isPublished,
          shopId: shop.id,
        },
      });

      // 2. Create the related product images
      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            url,
            position: index,
            productId: newProduct.id,
          })),
        });
      }

      return newProduct;
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/shop/${shop.slug}`);
    
    return { success: true, product };
  } catch (error: any) {
    console.error("Create product error:", error);
    return { success: false, error: error.message || "Failed to create product." };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, data: ProductInput) {
  try {
    const { shop } = await getMyShop();

    // Verify ownership
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct || existingProduct.shopId !== shop.id) {
      return { success: false, error: "Product not found or unauthorized." };
    }

    const parsedData = productSchema.safeParse(data);
    if (!parsedData.success) {
      return { 
        success: false, 
        error: "Invalid input", 
        validationErrors: parsedData.error.flatten().fieldErrors 
      };
    }

    const { title, description, price, stock, categoryId, isPublished, images } = parsedData.data;

    const product = await prisma.$transaction(async (tx) => {
      // 1. Update product details
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          title,
          description,
          price,
          stock,
          categoryId,
          isPublished,
        },
      });

      // 2. Overwrite images (simple approach: delete all existing, insert new ones)
      await tx.productImage.deleteMany({
        where: { productId },
      });

      if (images && images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((url, index) => ({
            url,
            position: index,
            productId,
          })),
        });
      }

      return updated;
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/shop/${shop.slug}`);
    revalidatePath(`/product/${productId}`);

    return { success: true, product };
  } catch (error: any) {
    console.error("Update product error:", error);
    return { success: false, error: error.message || "Failed to update product." };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string) {
  try {
    const { shop } = await getMyShop();

    // Verify ownership
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct || existingProduct.shopId !== shop.id) {
      return { success: false, error: "Product not found or unauthorized." };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    revalidatePath("/dashboard/products");
    revalidatePath(`/shop/${shop.slug}`);

    return { success: true };
  } catch (error: any) {
    console.error("Delete product error:", error);
    return { success: false, error: error.message || "Failed to delete product." };
  }
}
