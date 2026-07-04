import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { assertRole } from "@/lib/auth-guard";
import { uploadFile } from "@/lib/storage";
import { UserRole } from "@/generated/prisma/enums";

const ALLOWED_BUCKETS = ["product-images", "shop-assets", "review-images"] as const;
type Bucket = (typeof ALLOWED_BUCKETS)[number];

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function POST(req: Request) {
  try {
    const { session } = await assertRole([UserRole.SELLER, UserRole.ADMIN]);

    const formData = await req.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (typeof bucket !== "string" || !ALLOWED_BUCKETS.includes(bucket as Bucket)) {
      return NextResponse.json({ error: "Invalid upload destination" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WEBP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "Image must be smaller than 5MB" }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const key = `${session.user.id}/${randomUUID()}.${extension}`;

    const url = await uploadFile(bucket, key, file, file.type);

    return NextResponse.json({ url });
  } catch (error: any) {
    if (error.message === "Unauthorized" || error.message === "Forbidden") {
      return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 401 : 403 });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
