import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = (() => {
    try {
      const configured = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
      if (configured.protocol === "https:") return configured;
    } catch {
      // En desarrollo se usa el origen real de la solicitud local.
    }
    return new URL(request.url);
  })();
  const contactEmail = process.env.SECURITY_CONTACT_EMAIL?.trim();
  const contact = contactEmail
    ? `mailto:${contactEmail}`
    : `${origin.origin}/#contacto`;
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const body = [
    `Contact: ${contact}`,
    `Expires: ${expires}`,
    `Canonical: ${origin.origin}/.well-known/security.txt`,
    `Policy: ${origin.origin}/privacidad-cookies`,
    "Preferred-Languages: es, en",
    ""
  ].join("\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
