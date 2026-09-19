import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { BASE_PRICE, PRODUCT_PRICES } from "@/config/products";
import { db } from "@/db";
import { razorpay } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { configId } = await request.json();
    if (typeof configId !== "string") {
      return NextResponse.json({ error: "configId is required" }, { status: 400 });
    }

    const configuration = await db.configuration.findUnique({ where: { id: configId } });
    if (!configuration) {
      return NextResponse.json({ error: "Configuration not found" }, { status: 404 });
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "Account email is required" }, { status: 400 });
    }

    let amount = BASE_PRICE;
    if (configuration.material === "polycarbonate") amount += PRODUCT_PRICES.material.polycarbonate;
    if (configuration.finish === "textured") amount += PRODUCT_PRICES.finish.textured;
    const amountInPaise = amount * 100;
    if (amountInPaise < 100) {
      return NextResponse.json({ error: "Order amount is too low" }, { status: 400 });
    }

    await db.user.upsert({
      where: { id: user.id },
      update: { email },
      create: { id: user.id, email },
    });

    const order = await db.order.create({
      data: {
        amount,
        userId: user.id,
        configurationId: configuration.id,
      },
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
      notes: { localOrderId: order.id, configurationId: configuration.id },
    });

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      local_order_id: order.id,
    });
  } catch (error) {
    console.error("Razorpay order creation failed", error);
    return NextResponse.json({ error: "Unable to create payment order" }, { status: 500 });
  }
}
