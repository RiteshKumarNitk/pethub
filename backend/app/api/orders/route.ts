import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const [totalResult] = await db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.userId, userId));

    const total = totalResult?.total ?? 0;

    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            qty: orderItems.qty,
            unitPrice: orderItems.unitPrice,
            productName: products.name,
            productImage: products.imageUrl,
          })
          .from(orderItems)
          .leftJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, order.id));

        return { ...order, items };
      })
    );

    return NextResponse.json({
      orders: ordersWithItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const { items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items are required" }, { status: 400 });
    }

    const productIds = items.map((item: { productId: number }) => item.productId);
    const productResults = await Promise.all(
      productIds.map((id: number) => db.select().from(products).where(eq(products.id, id)).limit(1))
    );

    const productMap = new Map(productResults.map(([p]) => [p.id, p]));

    let total = 0;
    const orderItemsData = items.map((item: { productId: number; qty: number }) => {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const unitPrice = parseFloat(product.price.toString());
      total += unitPrice * item.qty;
      return {
        productId: item.productId,
        qty: item.qty,
        unitPrice: unitPrice.toString(),
      };
    });

    const receipt = `order_${userId}_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(total, receipt);

    const [newOrder] = await db
      .insert(orders)
      .values({
        userId,
        total: total.toString(),
        status: "pending",
        razorpayOrderId: razorpayOrder.id,
      })
      .returning();

    await Promise.all(
      orderItemsData.map((item) =>
        db.insert(orderItems).values({
          orderId: newOrder.id,
          ...item,
        })
      )
    );

    return NextResponse.json({
      order: newOrder,
      razorpayOrderId: razorpayOrder.id,
      amount: total,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    const { orderId } = await request.json();

    const [existing] = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (existing.status === "cancelled") {
      return NextResponse.json({ error: "Order is already cancelled" }, { status: 400 });
    }

    if (existing.status !== "pending") {
      return NextResponse.json({ error: "Only pending orders can be cancelled" }, { status: 400 });
    }

    const [updated] = await db
      .update(orders)
      .set({ status: "cancelled" })
      .where(eq(orders.id, orderId))
      .returning();

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("Cancel order error:", error);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }
}
