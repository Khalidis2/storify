import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RateLimitOptions = {
  namespace: string;
  identifier?: string;
  limit: number;
  windowMs: number;
};

type RateLimitRow = {
  count: number;
  windowStart: Date;
};

export function getClientIdentifier(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const address = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  return address || "unknown";
}

export async function checkRateLimit(
  request: Request,
  { namespace, identifier, limit, windowMs }: RateLimitOptions
) {
  const now = new Date();
  const resetBefore = new Date(now.getTime() - windowMs);
  const fingerprint = createHash("sha256")
    .update(identifier ?? getClientIdentifier(request))
    .digest("hex");
  const key = `${namespace}:${fingerprint}`;

  const rows = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "updatedAt")
    VALUES (${key}, 1, ${now}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."windowStart" <= ${resetBefore} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimitBucket"."windowStart" <= ${resetBefore} THEN ${now}
        ELSE "RateLimitBucket"."windowStart"
      END,
      "updatedAt" = ${now}
    RETURNING "count", "windowStart"
  `;

  const row = rows[0];
  if (!row) throw new Error("Rate limit bucket was not returned");

  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((row.windowStart.getTime() + windowMs - now.getTime()) / 1000)
  );

  return {
    allowed: row.count <= limit,
    retryAfterSeconds,
  };
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please wait and try again." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    }
  );
}
