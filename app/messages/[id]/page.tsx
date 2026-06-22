"use client"

import { useEffect, useRef, useState, use } from "react"
import Link from "next/link"
import { ChevronLeft, Send } from "lucide-react"
import type { Conversation, Message } from "@/types"
import { OrderSummaryCard } from "@/components/OrderSummaryCard"

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyBody, setReplyBody] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function load(silent = false) {
    if (!silent) setLoading(true)
    const res = await fetch(`/api/messages/${id}`)
    if (res.ok) {
      const data = await res.json()
      setConversation(data)
    }
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    load()
  }, [id])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation?.messages?.length])

  // Poll every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => load(true), 8000)
    return () => clearInterval(timer)
  }, [id])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!replyBody.trim() || sending) return
    setSending(true)
    setError("")

    const res = await fetch(`/api/messages/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: replyBody.trim() }),
    })

    if (res.ok) {
      const newMsg: Message = await res.json()
      setConversation((prev) =>
        prev
          ? { ...prev, messages: [...(prev.messages ?? []), newMsg] }
          : prev
      )
      setReplyBody("")
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to send")
    }
    setSending(false)
    inputRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-foreground/5 w-1/3" />
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-14 bg-foreground/5 ${i % 2 === 0 ? "ml-16" : "mr-16"}`} />
          ))}
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-foreground/40 text-xs tracking-widest">Conversation not found</p>
        <Link href="/messages" className="text-[12px] text-foreground/30 hover:text-foreground/60 transition-colors mt-3 inline-block">
          ← Back to messages
        </Link>
      </div>
    )
  }

  const messages = conversation.messages ?? []

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="mb-5 border-b border-white/10 pb-4">
        <Link
          href="/messages"
          className="flex items-center gap-1.5 text-[12px] tracking-widest text-foreground/40 hover:text-foreground/70 transition-colors mb-3"
        >
          <ChevronLeft className="h-3 w-3" /> BACK TO INBOX
        </Link>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-[0.15em] text-foreground/90">{conversation.subject}</h1>
          <span className={`text-[11px] tracking-wide border px-2 py-0.5 flex-shrink-0 mt-1 ${
            conversation.status === "open"
              ? "text-blue-400/60 border-blue-400/20"
              : "text-foreground/30 border-white/15"
          }`}>
            {conversation.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Order details card */}
      {conversation.order && <OrderSummaryCard order={conversation.order} />}

      {/* Messages */}
      <div className="flex-1 space-y-3 mb-5 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-center text-[12px] text-foreground/25 tracking-wider py-8">No messages yet.</p>
        )}
        {messages.map((msg) => {
          if (msg.senderRole === "system") {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="max-w-[80%] text-center">
                  <p className="text-[12px] text-foreground/40 italic px-4 py-2 border border-white/8 bg-foreground/[0.02]">
                    {msg.body}
                  </p>
                  <p className="text-[11px] text-foreground/25 mt-1">
                    {new Date(msg.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )
          }

          const isCustomer = msg.senderRole === "customer"

          return (
            <div key={msg.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] space-y-1 ${isCustomer ? "items-end" : "items-start"} flex flex-col`}>
                <div className={`px-4 py-2.5 text-xs text-foreground/80 border ${
                  isCustomer
                    ? "bg-foreground/10 border-white/15"
                    : "bg-yellow-400/[0.05] border-yellow-400/20"
                }`}>
                  {msg.body}
                </div>
                <div className={`flex items-center gap-1.5 text-[11px] text-foreground/30 ${isCustomer ? "flex-row-reverse" : ""}`}>
                  {!isCustomer && (
                    <span className="text-yellow-400/60 font-medium">
                      {msg.sender?.name ?? "Support"}
                    </span>
                  )}
                  <span>
                    {new Date(msg.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {conversation.status !== "closed" && (
        <form onSubmit={handleSend} className="border-t border-white/10 pt-4">
          {error && <p className="text-[12px] text-red-400/70 mb-2">{error}</p>}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
              placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
              rows={3}
              className="flex-1 bg-transparent border border-white/15 px-3 py-2 text-xs text-foreground/70 placeholder:text-foreground/20 focus:outline-none focus:border-white/40 transition-colors resize-none"
            />
            <button
              type="submit"
              disabled={sending || !replyBody.trim()}
              className="px-3 py-2 bg-foreground text-background text-xs hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5 self-end"
            >
              <Send className="h-3.5 w-3.5" />
              {sending ? "..." : "Send"}
            </button>
          </div>
          <p className="text-[11px] text-foreground/25 mt-1.5">Our support team typically replies within a few hours.</p>
        </form>
      )}

      {conversation.status === "closed" && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-[12px] text-foreground/35 text-center tracking-wider">This conversation is closed.</p>
        </div>
      )}
    </div>
  )
}
