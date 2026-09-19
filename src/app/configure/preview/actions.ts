"use server";

import { BASE_PRICE, PRODUCT_PRICES } from "@/config/products";
import { db } from "@/db";
import { getRazorpay } from "@/lib/razorpay";
import { currentUser } from "@clerk/nextjs/server";
import { Order } from "@prisma/client";

export const createCheckoutSession = async ({
  configId,
}: {
  configId: string;
}) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    );
  }

  const configuration = await db.configuration.findUnique({
    where: { id: configId },
  });

  if (!configuration) {
    throw new Error("No such configuration found");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("You need to be logged in");
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error("Your account does not have an email address");
  }

  const { finish, material } = configuration;

  let price = BASE_PRICE;
  if (finish === "textured") price += PRODUCT_PRICES.finish.textured;
  if (material === "polycarbonate")
    price += PRODUCT_PRICES.material.polycarbonate;

  await db.user.upsert({
    where: { id: user.id },
    update: { email },
    create: { id: user.id, email },
  });

  let order: Order | undefined;

  const existingOrder = await db.order.findFirst({
    where: {
      userId: user.id,
      configurationId: configuration.id,
    },
  });

  if (existingOrder) {
    order = existingOrder;
  } else {
    order = await db.order.create({
      data: {
        amount: price / 100,
        userId: user.id,
        configurationId: configuration.id,
      },
    });
  }

  const razorpayOrder = await getRazorpay().orders.create({
    amount: price,
    currency: "INR",
    receipt: order.id,
    notes: {
      userId: user.id,
      orderId: order.id,
      configurationId: configuration.id,
    },
  });

  return {
    orderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    localOrderId: order.id,
  };
};
