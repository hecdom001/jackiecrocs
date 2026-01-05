import { NextResponse } from "next/server";

export function GET(req: Request) {
  const h = new Headers(req.headers);

  return NextResponse.json({
    city: h.get("x-vercel-ip-city") ?? null,
    region: h.get("x-vercel-ip-country-region") ?? null,
    country: h.get("x-vercel-ip-country") ?? null,
  });
}
