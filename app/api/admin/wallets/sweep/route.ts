import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { adminAuth as auth } from "@/auth-admin"
import { ntzs } from "@/lib/ntzs"
import { computeBalance } from "@/lib/wallet"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Migration sweep — one-time reconciliation of pre-migration per-user wallets.
 *
 * For every user that still has an individual nTZS wallet (`ntzsUserId`):
 *   1. Read the REAL balance held in their personal nTZS wallet (source of truth).
 *   2. Transfer that balance into the shared HaoDeals treasury.
 *   3. Pin their DB ledger balance to the real swept amount via a signed
 *      `adjustment` transaction.
 *   4. Detach the legacy wallet (null `ntzsUserId`) so the user is now on the
 *      treasury model and can never be swept twice.
 *
 * After this runs, treasury holds == sum of all user ledger balances (1:1).
 */
export async function POST() {
  const session = await auth()
  const role = (session?.user as { role?: string })?.role
  if (!session?.user || role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const treasuryUserId = process.env.NTZS_TREASURY_USER_ID
  if (!treasuryUserId) {
    return NextResponse.json({ error: "NTZS_TREASURY_USER_ID is not configured" }, { status: 503 })
  }

  const legacyUsers = await prisma.user.findMany({
    where: { ntzsUserId: { not: null } },
    select: { id: true, name: true, email: true, ntzsUserId: true },
  })

  type Result = {
    email: string
    realBalance: number
    ledgerBefore: number
    adjustment: number
    transferred: number
    status: "swept" | "no_funds" | "error"
    error?: string
  }
  const results: Result[] = []
  let totalSwept = 0

  for (const u of legacyUsers) {
    try {
      // 1. Real balance held in the user's individual nTZS wallet
      const ntzsUser = await ntzs.getUser(u.ntzsUserId!)
      const realBalance = Math.floor(ntzsUser.balanceTzs ?? 0)

      // 2. Sweep the real balance into treasury (skip if nothing to move)
      let transferred = 0
      if (realBalance > 0) {
        await ntzs.transfer({
          fromUserId: u.ntzsUserId!,
          toUserId: treasuryUserId,
          amountTzs: realBalance,
          metadata: { reason: "migration_sweep", userId: u.id },
        })
        transferred = realBalance
        totalSwept += realBalance
      }

      // 3. Pin the ledger balance to the real amount
      const ledgerBefore = await computeBalance(u.id)
      const adjustment = realBalance - ledgerBefore
      if (adjustment !== 0) {
        await prisma.transaction.create({
          data: {
            userId: u.id,
            type: "adjustment",
            amountTzs: adjustment,
            status: "completed",
            description: `Balance reconciliation (migration sweep): ${adjustment > 0 ? "+" : ""}${adjustment.toLocaleString()} TZS`,
          },
        })
      }

      // 4. Detach legacy wallet so this user is now treasury-model and never re-swept
      await prisma.user.update({
        where: { id: u.id },
        data: { ntzsUserId: null, ntzsWalletAddress: null },
      })

      results.push({
        email: u.email,
        realBalance,
        ledgerBefore,
        adjustment,
        transferred,
        status: realBalance > 0 ? "swept" : "no_funds",
      })
    } catch (err) {
      results.push({
        email: u.email,
        realBalance: 0,
        ledgerBefore: 0,
        adjustment: 0,
        transferred: 0,
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const swept   = results.filter((r) => r.status === "swept").length
  const noFunds = results.filter((r) => r.status === "no_funds").length
  const errors  = results.filter((r) => r.status === "error").length

  return NextResponse.json({
    processed: legacyUsers.length,
    swept,
    noFunds,
    errors,
    totalSwept,
    results,
  })
}
