"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createChargilyCheckout } from "@/lib/chargily";

const updateOrderStatusSchema = z.object({
  orderId: z.string().cuid(),
  status: z.enum([
    "PENDING", 
    "PAID", 
    "PROCESSING", 
    "SHIPPED", 
    "DELIVERED", 
    "CANCELLED", 
    "REFUNDED"
  ]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/**
 * Updates the status of an order (Seller action)
 */
export async function updateOrderStatus(data: UpdateOrderStatusInput) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const parsedData = updateOrderStatusSchema.safeParse(data);
    if (!parsedData.success) {
      return { 
        success: false, 
        error: "Invalid input", 
        validationErrors: parsedData.error.flatten().fieldErrors 
      };
    }

    const { orderId, status } = parsedData.data;

    // Verify the seller owns the shop associated with this order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.shop.userId !== session.user.id) {
      return { success: false, error: "Unauthorized to update this order" };
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    revalidatePath("/dashboard/orders");
    
    return { success: true, order: updatedOrder };
  } catch (error: any) {
    console.error("Update order status error:", error);
    return { success: false, error: error.message || "Failed to update order status." };
  }
}

/**
 * Creates an order from the user's cart and initiates Chargily checkout
 */
export async function createOrder(shippingAddress: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!shippingAddress || shippingAddress.trim().length < 5) {
      return { success: false, error: "Please provide a valid shipping address." };
    }

    // 1. Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return { success: false, error: "Your cart is empty." };
    }

    // 2. Group items by shop (Etsy orders are per shop)
    // For this MVP, we'll assume a single order per checkout or handle multiple shops.
    // Let's keep it simple: one order per shop in the cart.
    const itemsByShop = cart.items.reduce((acc, item) => {
      const shopId = item.product.shopId;
      if (!acc[shopId]) acc[shopId] = [];
      acc[shopId].push(item);
      return acc;
    }, {} as Record<string, typeof cart.items>);

    const shopIds = Object.keys(itemsByShop);
    
    // For MVP, let's just process the first shop found or restrict cart to one shop at a time.
    // Let's process all shops but create separate orders.
    // However, Chargily checkout usually handles one total amount.
    // Let's create one "Order" per shop.
    
    const orders = [];
    let totalAmount = 0;

    for (const shopId of shopIds) {
      const shopItems = itemsByShop[shopId];
      const shopTotal = shopItems.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);
      totalAmount += shopTotal;

      // Create order record
      const order = await prisma.order.create({
        data: {
          totalAmount: shopTotal,
          shippingAddress,
          buyerId: session.user.id,
          shopId,
          status: "PENDING",
          items: {
            create: shopItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
      });
      orders.push(order);
    }

    // 3. Initiate Chargily Checkout for the total amount
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const checkoutResult = await createChargilyCheckout({
      amount: totalAmount,
      success_url: `${appUrl}/orders/success`,
      failure_url: `${appUrl}/cart?error=payment_failed`,
      webhook_endpoint: `${appUrl}/api/webhooks/chargily`,
      metadata: {
        order_ids: orders.map(o => o.id).join(","),
        user_id: session.user.id,
      },
    });

    if (!checkoutResult.success || !checkoutResult.url) {
      return { success: false, error: checkoutResult.message || "Failed to initiate payment." };
    }

    // 4. Update orders with Chargily ID
    await prisma.order.updateMany({
      where: {
        id: { in: orders.map(o => o.id) },
      },
      data: {
        chargilyCheckoutId: checkoutResult.id,
      },
    });

    return { success: true, url: checkoutResult.url };
  } catch (error: any) {
    console.error("Create order error:", error);
    return { success: false, error: error.message || "Failed to create order." };
  }
}
