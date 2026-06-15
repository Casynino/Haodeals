import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"
import { ntzs } from "@/lib/ntzs"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function requireAdmin() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  return !!session?.user && role === "admin"
}

// Preview: live balances of a source wallet and the treasury, before any move.
export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const treasuryId = process.env.NTZS_TREASURY_USER_ID
  if (!treasuryId) return NextResponse.json({ error: "Treasury not configured" }, { status: 503 })

  const fromId = new URL(req.url).searchParams.get("from")?.trim()
  if (!fromId) return NextResponse.json({ error: "Missing source wallet id" }, { status: 400 })

  try {
    const [from, treasury] = await Promise.all([
      ntzs.getUser(fromId),
      ntzs.getUser(treasuryId),
    ])
    return NextResponse.json({
      treasuryId,
      isSameAsTreasury: fromId === treasuryId,
      from:     { id: fromId,     balanceTzs: from.balanceTzs ?? 0,     walletAddress: from.walletAddress ?? null },
      treasury: { id: treasuryId, balanceTzs: treasury.balanceTzs ?? 0, walletAddress: treasury.walletAddress ?? null },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read wallet (check the ID)" },
      { status: 502 }
    )
  }
}

// Execute: move funds from a source wallet into the treasury.
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const treasuryId = process.env.NTZS_TREASURY_USER_ID
  if (!treasuryId) return NextResponse.json({ error: "Treasury not configured" }, { status: 503 })

  const { fromUserId, amount } = await req.json()
  const fromId = String(fromUserId ?? "").trim()
  if (!fromId) return NextResponse.json({ error: "Missing source wallet id" }, { status: 400 })
  if (fromId === treasuryId) {
    return NextResponse.json({ error: "Source wallet is already the treasury" }, { status: 400 })
  }

  // Read the live source balance and clamp the amount to it
  let sourceBalance: number
  try {
    const from = await ntzs.getUser(fromId)
    sourceBalance = Math.floor(from.balanceTzs ?? 0)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not read source wallet" },
      { status: 502 }
    )
  }

  const amt = amount != null ? Math.floor(Number(amount)) : sourceBalance
  if (!amt || amt <= 0) return NextResponse.json({ error: "Nothing to transfer" }, { status: 400 })
  if (amt > sourceBalance) {
    return NextResponse.json({
      error: `Amount ${amt.toLocaleString()} exceeds source balance ${sourceBalance.toLocaleString()}`,
    }, { status: 400 })
  }

  try {
    const transfer = await ntzs.transfer({
      fromUserId: fromId,
      toUserId: treasuryId,
      amountTzs: amt,
      metadata: { reason: "treasury_consolidation" },
    })

    // Audit trail (not a balance change)
    await prisma.notification.create({
      data: {
        type: "treasury_consolidation",
        title: `Treasury top-up — TSh ${amt.toLocaleString()}`,
        body: `Moved ${amt.toLocaleString()} TZS from wallet ${fromId} into the treasury`,
        metadata: { fromUserId: fromId, treasuryId, amountTzs: amt, transferId: transfer.id },
      },
    }).catch(() => {})

    return NextResponse.json({ transferred: amt, from: fromId, to: treasuryId, transferId: transfer.id, status: transfer.status })
  } catch (err) {
    console.error("[treasury consolidate] transfer failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transfer failed" },
      { status: 502 }
    )
  }
}
