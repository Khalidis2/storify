import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  MAX_UPLOAD_REQUEST_BYTES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_BURST_LIMIT,
  UPLOAD_BURST_WINDOW_MS,
  UPLOAD_DAILY_LIMIT,
  UPLOAD_DAILY_WINDOW_MS,
} from "@/lib/upload-limits";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function hasValidSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (type === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  if (type === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  return false;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "Upload request is too large." },
      { status: 413 }
    );
  }

  try {
    const [burstLimit, dailyLimit] = await Promise.all([
      checkRateLimit(request, {
        namespace: "upload-burst",
        identifier: session.user.id,
        limit: UPLOAD_BURST_LIMIT,
        windowMs: UPLOAD_BURST_WINDOW_MS,
      }),
      checkRateLimit(request, {
        namespace: "upload-daily",
        identifier: session.user.id,
        limit: UPLOAD_DAILY_LIMIT,
        windowMs: UPLOAD_DAILY_WINDOW_MS,
      }),
    ]);
    const blocked = [burstLimit, dailyLimit].filter((limit) => !limit.allowed);
    if (blocked.length > 0) {
      return rateLimitResponse(
        Math.max(...blocked.map((limit) => limit.retryAfterSeconds))
      );
    }
  } catch (error) {
    console.error("Upload rate limit check failed", error);
    return NextResponse.json(
      { error: "Uploads are temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const extension = EXTENSIONS[file.type];
  if (!extension) {
    return NextResponse.json(
      { error: "Please upload a JPG, PNG, or WEBP image." },
      { status: 400 }
    );
  }
  if (file.size === 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be between 1 byte and 4MB." },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidSignature(file.type, bytes)) {
    return NextResponse.json(
      { error: "The file content does not match a supported image format." },
      { status: 400 }
    );
  }

  const pathname = `uploads/${session.user.id}/${crypto.randomUUID()}.${extension}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Blob upload failed", error);
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: "Image uploads aren't configured for this deployment." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
