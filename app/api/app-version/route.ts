import { NextResponse } from "next/server"

// Returns the current deployment ID so the client can detect when a new
// version has gone live. Vercel sets VERCEL_DEPLOYMENT_ID automatically on
// every deploy — the client bundle bakes in NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID
// at build time, then polls this endpoint; a mismatch triggers the banner.
export const dynamic = "force-dynamic"
export const revalidate = 0

export function GET() {
  return NextResponse.json({
    version: process.env.VERCEL_DEPLOYMENT_ID ?? "local",
  })
}
