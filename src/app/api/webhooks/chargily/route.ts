import { NextResponse } from 'next/server';
import { verifySignature } from '@chargily/chargily-pay';
import { prisma } from '@/lib/prisma';

/**
 * Chargily Pay V2 Webhook Handler for Etsy Clone
 */
export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get('signature');
        const secretKey = process.env.CHARGILY_SECRET_KEY;

        if (!signature || !secretKey) {
            console.error('Chargily Webhook: Missing signature or secret key');
            return NextResponse.json({ error: 'Missing signature or secret key' }, { status: 400 });
        }

        // 1. Verify Signature
        try {
            verifySignature(Buffer.from(rawBody), signature, secretKey);
        } catch (sigError: any) {
            console.error('Chargily Webhook: Invalid signature', sigError.message);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
        }

        const body = JSON.parse(rawBody);
        const event = body.type;
        const checkout = body.data;

        // 2. Handle successful payment
        if (event === 'checkout.paid') {
            const { order_ids, user_id } = checkout.metadata;

            if (!order_ids) {
                console.error('Chargily Webhook: Missing order_ids in metadata');
                return NextResponse.json({ error: 'Missing order_ids' }, { status: 400 });
            }

            const ids = order_ids.split(',');

            console.log('Chargily fulfillment started for orders:', ids);

            // Update orders status to PAID and decrement stock in a transaction
            await prisma.$transaction(async (tx) => {
                // Update all associated orders
                await tx.order.updateMany({
                    where: {
                        id: { in: ids },
                    },
                    data: {
                        status: 'PAID',
                    },
                });

                // Get all order items to decrement stock
                const orderItems = await tx.orderItem.findMany({
                    where: {
                        orderId: { in: ids },
                    },
                    include: {
                        product: true,
                    },
                });

                // Decrement stock for each product
                for (const item of orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }

                // Clear the user's cart
                if (user_id) {
                  const cart = await tx.cart.findUnique({
                    where: { userId: user_id },
                  });
                  if (cart) {
                    await tx.cartItem.deleteMany({
                      where: { cartId: cart.id },
                    });
                  }
                }
            });

            console.log('Chargily Webhook: Fulfillment successful for orders', ids);
        } else if (event === 'checkout.failed') {
            const { order_ids } = checkout.metadata;
            if (order_ids) {
                const ids = order_ids.split(',');
                await prisma.order.updateMany({
                    where: {
                        id: { in: ids },
                    },
                    data: {
                        status: 'CANCELLED',
                    },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Chargily Webhook Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
