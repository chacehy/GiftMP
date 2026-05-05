"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const addToCartSchema = z.object({
  productId: z.string().cuid(),
  quantity: z.coerce.number().int().positive().default(1),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

const updateCartItemSchema = z.object({
  cartItemId: z.string().cuid(),
  quantity: z.coerce.number().int().positive(),
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

/**
 * Helper: Get or create the user's cart
 */
async function getOrCreateCart(userId: string) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
}

/**
 * Adds a product to the authenticated user's cart
 */
export async function addToCart(data: AddToCartInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "You must be logged in to add items to your cart." };
    }

    const parsedData = addToCartSchema.safeParse(data);
    if (!parsedData.success) {
      return { 
        success: false, 
        error: "Invalid input", 
        validationErrors: parsedData.error.flatten().fieldErrors 
      };
    }

    const { productId, quantity } = parsedData.data;

    // Check if product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isPublished) {
      return { success: false, error: "Product not found or unavailable." };
    }

    if (product.stock < quantity) {
      return { success: false, error: `Only ${product.stock} items available in stock.` };
    }

    const cart = await getOrCreateCart(session.user.id);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        return { success: false, error: `Cannot add more than available stock (${product.stock}).` };
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    revalidatePath("/cart");
    
    return { success: true };
  } catch (error: any) {
    console.error("Add to cart error:", error);
    return { success: false, error: error.message || "Failed to add item to cart." };
  }
}

/**
 * Updates the quantity of a cart item
 */
export async function updateCartItemQuantity(data: UpdateCartItemInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const parsedData = updateCartItemSchema.safeParse(data);
    if (!parsedData.success) {
      return { success: false, error: "Invalid input" };
    }

    const { cartItemId, quantity } = parsedData.data;

    // Verify ownership via cart
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: true,
        product: true,
      },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return { success: false, error: "Item not found or unauthorized." };
    }

    if (quantity > cartItem.product.stock) {
      return { success: false, error: `Only ${cartItem.product.stock} items available in stock.` };
    }

    const updated = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    revalidatePath("/cart");
    
    return { success: true, cartItem: updated };
  } catch (error: any) {
    console.error("Update cart item error:", error);
    return { success: false, error: error.message || "Failed to update cart item." };
  }
}

/**
 * Removes an item from the cart
 */
export async function removeCartItem(cartItemId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify ownership
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== session.user.id) {
      return { success: false, error: "Item not found or unauthorized." };
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    revalidatePath("/cart");
    
    return { success: true };
  } catch (error: any) {
    console.error("Remove cart item error:", error);
    return { success: false, error: error.message || "Failed to remove item from cart." };
  }
}

/**
 * Clears the user's cart (usually after successful checkout)
 */
export async function clearCart() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    revalidatePath("/cart");
    
    return { success: true };
  } catch (error: any) {
    console.error("Clear cart error:", error);
    return { success: false, error: error.message || "Failed to clear cart." };
  }
}
