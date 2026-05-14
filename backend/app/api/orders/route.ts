import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function GET(request: NextRequest) {
  try {
    const userId = parseInt(request.headers.get("x-user-id")!);
    
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));
    
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
    
    return NextResponse.json({ orders: ordersWithItems });
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
        unitPrice,
      };
    });
    
    const receipt = `order_${userId}_${Date.now()}`;
    const razorpayOrder = await createRazorpayOrder(total, receipt);
    
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId,
        total,
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
