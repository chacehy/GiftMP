"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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
