import { NextResponse } from "next/server";
import { z } from "zod";
import { recordProductClick } from "@/lib/catalog-products";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  getRequestIdentityFromHeaders,
  isSmallJsonRequest,
  isTrustedRequestOrigin
} from "@/lib/security/request";

const clickSchema = z.object({
  productId: z.string().uuid(),
  clickType: z.enum(["whatsapp", "view"])
});

export async function POST(request: Request) {
  try {
    if (!isSmallJsonRequest(request)) {
      return NextResponse.json({ ok: false }, { status: 415 });
    }
    if (!isTrustedRequestOrigin(request)) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }
    const parsed = clickSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
    const identity = getRequestIdentityFromHeaders(request.headers);
    const limit = await consumeRateLimit({
      scope: `product-click-${parsed.data.clickType}`,
      identifier: identity.fingerprint,
      limit: parsed.data.clickType === "whatsapp" ? 30 : 120,
      windowSeconds: 600
    });
    if (!limit.allowed) {
      return NextResponse.json(
        { ok: false },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }
    await recordProductClick(parsed.data.productId, parsed.data.clickType);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
