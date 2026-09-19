import { createUploadthing, type FileRouter } from "uploadthing/next";
import { z } from "zod";
import sharp from "sharp";
import { db } from "@/db";
const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } }, { awaitServerData: true })
    .input(z.object({ configId: z.string().optional() }))
    .middleware(async ({ input }) => {
      return { input };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const { configId } = metadata.input;
      console.log("[upload] server complete", {
        configId,
        fileKey: file.key,
      });

      try {
        const res = await fetch(file.ufsUrl);
        console.log("[upload] image fetched", res.status);
        const buffer = await res.arrayBuffer();
        const imgMetadata = await sharp(buffer).metadata();
        const { width, height } = imgMetadata;
        console.log("[upload] image metadata", { width, height });

        if (!configId) {
          console.log("[upload] creating configuration");
          const configuration = await db.configuration.create({
            data: {
              imageUrl: file.ufsUrl,
              height: height || 500,
              width: width || 500,
            },
          });

          console.log("[upload] configuration created", configuration.id);
          return { configId: configuration.id };
        }

        const updatedConfiguration = await db.configuration.update({
          where: { id: configId },
          data: { croppedImageUrl: file.ufsUrl },
        });

        console.log("[upload] configuration updated", updatedConfiguration.id);
        return { configId: updatedConfiguration.id };
      } catch (error) {
        console.error("[upload] server error", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
