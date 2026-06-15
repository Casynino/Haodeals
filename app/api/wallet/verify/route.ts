import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ntzs } from "@/lib/ntzs"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Reconcile the caller's pending deposits directly against nTZS.
 *
 * The webhook (`deposit.completed`) is the primary path, but if it never
 * arrives (misconfigured URL, signature mismatch, etc.) a minted deposit
 * would stay "pending" forever. This actively polls nTZS for each pending
 * deposit and updates the DB so the balance credits regardless.
 */
export async function POST() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id as string

  const pending = await prisma.transaction.findMany({
    where: { userId, type: "deposit", status: "pending", ntzsId: { not: null } },
    select: { id: true, ntzsId: true },
  })

  let completed = 0
  let failed = 0

  await Promise.all(
    pending.map(async (tx) => {
      try {
        const dep = await ntzs.getDeposit(tx.ntzsId!)
        if (dep.status === "completed") {
          await prisma.transaction.update({ where: { id: tx.id }, data: { status: "completed" } })
          completed++
        } else if (dep.status === "failed") {
          await prisma.transaction.update({ where: { id: tx.id }, data: { status: "failed" } })
          failed++
        }
      } catch {
        // nTZS unreachable or deposit not found — leave as pending, retry next poll
      }
    })
  )

  return NextResponse.json(
    { checked: pending.length, completed, failed },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  )
}
