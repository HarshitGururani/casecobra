import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/db";

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json();

    if (typeof imageUrl !== "string" || !imageUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    const existingConfiguration = await db.configuration.findFirst({
      where: { imageUrl },
      select: { id: true },
    });

    if (existingConfiguration) {
      return NextResponse.json({ configId: existingConfiguration.id });
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Uploaded image cannot be read" },
        { status: 400 },
      );
    }

    const metadata = await sharp(await response.arrayBuffer()).metadata();
    const configuration = await db.configuration.create({
      data: {
        imageUrl,
        width: metadata.width || 500,
        height: metadata.height || 500,
      },
    });

    return NextResponse.json({ configId: configuration.id });
  } catch (error) {
    console.error("Upload completion fallback failed", error);
    return NextResponse.json(
      { error: "Unable to create image configuration" },
      { status: 500 },
    );
  }
}
