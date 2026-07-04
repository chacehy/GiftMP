"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { assertRole } from "@/lib/auth-guard";
import { imageUrlSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";
import { ProductType, UserRole } from "@/generated/prisma/enums";

const variantOptionSchema = z.object({
  label: z.string().min(1, "Option label is required").max(50),
  priceDelta: z.coerce.number().default(0),
  stock: z.coerce.number().int().nonnegative(),
});

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required").max(50),
  options: z.array(variantOptionSchema).min(1, "Add at least one option"),
});

const productSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be a positive number"),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  categoryId: z.string().min(1, "Category is required"),
  isPublished: z.boolean().default(false),
  images: z.array(imageUrlSchema).min(1, "At least one image is required"),
  type: z.enum([ProductType.HANDMADE, ProductType.VINTAGE, ProductType.SUPPLY]).default(ProductType.HANDMADE),
  tags: z.array(z.string().min(1).max(30)).max(13).default([]),
  materials: z.array(z.string().min(1).max(30)).max(13).default([]),
  processingTime: z.string().max(100).optional().or(z.literal("")),
  personalization: z.string().max(300).optional().or(z.literal("")),
  variant: variantSchema.optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

/**
 * Helper: Get current user's shop
 */
async function getMyShop() {
  const { session } = await assertRole([UserRole.SELLER, UserRole.ADMIN]);

  const shop = await prisma.shop.findUnique({
    where: { userId: session.user.id },
  });

  if (!shop) {
    throw new Error("You must create a shop first before listing products.");
  }

  return { session, shop };
}

function effectiveStock(data: ProductInput) {
  if (data.variant && data.variant.options.length > 0) {
    return data.variant.options.reduce((sum, o) => sum + o.stock, 0);
  }
  return data.stock;
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

    const {
      title, description, price, categoryId, isPublished, images,
      type, tags, materials, processingTime, personalization, variant,
    } = parsedData.data;

    const product = await prisma.$transaction(async (tx) => {
      // 1. Create the product
      const newProduct = await tx.product.create({
        data: {
          title,
          description,
          price,
          stock: effectiveStock(parsedData.data),
          categoryId,
          isPublished,
          shopId: shop.id,
          type,
          tags,
          materials,
          processingTime: processingTime || null,
          personalization: personalization || null,
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

      // 3. Create the variant group + options, if provided
      if (variant) {
        await tx.productVariant.create({
          data: {
            name: variant.name,
            productId: newProduct.id,
            options: {
              createMany: {
                data: variant.options.map((o) => ({
                  label: o.label,
                  priceDelta: o.priceDelta,
                  stock: o.stock,
                })),
              },
            },
          },
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
 * Fetch a single product owned by the current seller, for editing.
 */
export async function getMyProduct(productId: string) {
  const { shop } = await getMyShop();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { position: "asc" } },
      variant: { include: { options: true } },
    },
  });

  if (!product || product.shopId !== shop.id) {
    return null;
  }

  return product;
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

    const {
      title, description, price, categoryId, isPublished, images,
      type, tags, materials, processingTime, personalization, variant,
    } = parsedData.data;

    const product = await prisma.$transaction(async (tx) => {
      // 1. Update product details
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          title,
          description,
          price,
          stock: effectiveStock(parsedData.data),
          categoryId,
          isPublished,
          type,
          tags,
          materials,
          processingTime: processingTime || null,
          personalization: personalization || null,
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

      // 3. Overwrite the variant group (deleting cascades its options; any
      // matching cart lines are cascade-deleted too, and past order items
      // keep their price/variantLabel snapshot regardless).
      await tx.productVariant.deleteMany({ where: { productId } });

      if (variant) {
        await tx.productVariant.create({
          data: {
            name: variant.name,
            productId,
            options: {
              createMany: {
                data: variant.options.map((o) => ({
                  label: o.label,
                  priceDelta: o.priceDelta,
                  stock: o.stock,
                })),
              },
            },
          },
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
