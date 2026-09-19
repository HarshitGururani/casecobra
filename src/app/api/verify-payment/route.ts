import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      local_order_id: localOrderId,
    } = await request.json();

    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string" ||
      typeof localOrderId !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing payment fields" },
        { status: 400 },
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    const isValid =
      signature.length === expectedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 },
      );
    }

    const order = await db.order.findFirst({
      where: { id: localOrderId, userId: user.id },
    });
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });

    await db.order.update({
      where: { id: order.id },
      data: { isPaid: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Razorpay payment verification failed", error);
    return NextResponse.json(
      { error: "Unable to verify payment" },
      { status: 500 },
    );
  }
}
