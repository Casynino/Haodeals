"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquare, ChevronRight, Plus, X, Send } from "lucide-react"
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

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newSubject, setNewSubject] = useState("")
  const [newBody, setNewBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => {
        setConversations(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleNewConversation(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubject.trim() || !newBody.trim()) return
    setSubmitting(true)
    setError("")

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: newSubject.trim(), body: newBody.trim() }),
    })

    if (res.ok) {
      const conv: Conversation = await res.json()
      setConversations((prev) => [conv, ...prev])
      setShowNew(false)
      setNewSubject("")
      setNewBody("")
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to send message")
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <span className="text-foreground/45 text-xs">//</span>
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">MESSAGES</h1>
        </div>
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-white/10 p-5 h-20 bg-foreground/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span className="text-foreground/45 text-xs">//</span>
          <h1 className="text-lg font-semibold tracking-[0.2em] text-foreground/90">MESSAGES</h1>
          {conversations.length > 0 && (
            <span className="text-xs text-foreground/50">{conversations.length} conversations</span>
          )}
        </div>
        <button
          onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-white/20 text-[11px] tracking-widest text-foreground/50 hover:text-foreground hover:border-white/40 transition-colors"
        >
          {showNew ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          {showNew ? "CANCEL" : "NEW.MESSAGE"}
        </button>
      </div>

      {/* New conversation form */}
      {showNew && (
        <div className="border border-white/15 p-5 mb-6 space-y-4">
          <p className="text-[12px] tracking-widest text-foreground/55">// NEW.SUPPORT.MESSAGE</p>
          <form onSubmit={handleNewConversation} className="space-y-3">
            <div>
              <label className="text-[12px] tracking-widest text-foreground/45 block mb-1.5">SUBJECT</label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="What do you need help with?"
                required
                className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] tracking-widest text-foreground/45 block mb-1.5">MESSAGE</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Describe your issue or question..."
                required
                rows={4}
                className="w-full bg-transparent border border-white/15 px-3 py-2 text-xs text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors resize-none"
              />
            </div>
            {error && <p className="text-[12px] text-red-400/70">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[12px] tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              {submitting ? "SENDING..." : "SEND.MESSAGE"}
            </button>
          </form>
        </div>
      )}

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center gap-6 text-center py-20">
          <div className="border border-white/10 p-8">
            <MessageSquare className="h-10 w-10 opacity-20" />
          </div>
          <div>
            <p className="text-[13px] tracking-widest text-foreground/50 mb-1">No messages yet</p>
            <p className="text-[11px] text-foreground/25">Order updates and support messages will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const lastMessage = conv.messages?.[0]
            const hasUnread = conv.customerUnread > 0

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="block border border-white/10 hover:border-white/25 transition-colors p-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      {hasUnread && (
                        <span className="w-2 h-2 bg-green-400/80 rounded-full flex-shrink-0" />
                      )}
                      <p className={`text-xs font-medium truncate ${hasUnread ? "text-foreground/90" : "text-foreground/70"}`}>
                        {conv.subject}
                      </p>
                    </div>
                    {conv.order && (
                      <p className="text-[12px] text-foreground/40 mb-1">
                        Order #{conv.order.trackingId ?? conv.order.id.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                    {lastMessage && (
                      <p className="text-[12px] text-foreground/45 truncate">
                        {lastMessage.senderRole === "admin" && <span className="text-yellow-400/60">Admin: </span>}
                        {lastMessage.senderRole === "system" && <span className="text-foreground/30">System: </span>}
                        {lastMessage.body}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <p className="text-[12px] text-foreground/35">{formatRelativeDate(conv.lastMessageAt)}</p>
                    {hasUnread && (
                      <span className="w-4 h-4 flex items-center justify-center bg-green-400/80 text-black text-[11px] font-bold">
                        {conv.customerUnread > 9 ? "9+" : conv.customerUnread}
                      </span>
                    )}
                    <span className={`text-[11px] tracking-wide border px-2 py-0.5 ${
                      conv.status === "open"
                        ? "text-blue-400/60 border-blue-400/20"
                        : "text-foreground/30 border-white/15"
                    }`}>
                      {conv.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-2">
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
