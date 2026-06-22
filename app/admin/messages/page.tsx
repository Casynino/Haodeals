"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquare, ChevronRight, Package } from "lucide-react"
import type { Conversation } from "@/types"

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const totalUnread = conversations.reduce((sum, c) => sum + c.adminUnread, 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/45 text-xs"></span>
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">MESSAGES</h1>
          {totalUnread > 0 && (
            <span className="px-2 py-0.5 bg-yellow-400/90 text-black text-[11px] font-bold tracking-widest">
              {totalUnread} UNREAD
            </span>
          )}
        </div>
        <Link
          href="/admin"
          className="text-[11px] tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          ← DASHBOARD
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border border-foreground/10 p-4 h-20 bg-foreground/5" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="border border-foreground/10 p-8">
            <MessageSquare className="h-10 w-10 opacity-20" />
          </div>
          <p className="text-[13px] tracking-widest text-foreground/40">No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const lastMessage = conv.messages?.[0]
            const hasUnread = conv.adminUnread > 0

            return (
              <Link
                key={conv.id}
                href={`/admin/messages/${conv.id}`}
                className="block border border-foreground/10 hover:border-foreground/25 transition-colors p-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {hasUnread && (
                        <span className="w-2 h-2 bg-yellow-400/80 rounded-full flex-shrink-0" />
                      )}
                      <p className={`text-xs truncate ${hasUnread ? "text-foreground/90 font-medium" : "text-foreground/65"}`}>
                        {conv.subject}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-[12px] text-foreground/50">
                        {conv.user.name ?? conv.user.email}
                        {conv.user.name && (
                          <span className="text-foreground/30 ml-1">({conv.user.email})</span>
                        )}
                      </p>
                      {conv.order && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-foreground/40 border border-foreground/10 px-1.5 py-0.5">
                          <Package className="h-2.5 w-2.5" />
                          {conv.order.trackingId ?? conv.order.id.slice(0, 8)}
                        </span>
                      )}
                    </div>

                    {lastMessage && (
                      <p className="text-[12px] text-foreground/35 truncate mt-1">
                        {lastMessage.senderRole === "customer" && <span className="text-foreground/50">Customer: </span>}
                        {lastMessage.senderRole === "system" && <span className="text-foreground/25">System: </span>}
                        {lastMessage.body}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-[12px] text-foreground/35">{formatRelativeDate(conv.lastMessageAt)}</p>
                    {hasUnread && (
                      <span className="w-5 h-5 flex items-center justify-center bg-yellow-400/90 text-black text-[11px] font-bold">
                        {conv.adminUnread > 9 ? "9+" : conv.adminUnread}
                      </span>
                    )}
                    <span className={`text-[11px] tracking-wide border px-2 py-0.5 ${
                      conv.status === "open"
                        ? "text-blue-400/60 border-blue-400/20"
                        : "text-foreground/30 border-foreground/15"
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-1.5">
                  <ChevronRight className="h-3 w-3 text-foreground/20 group-hover:text-foreground/50 transition-colors" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
