"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Loader2, Camera, Save, KeyRound, User, Phone, MapPin, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm]   = useState({ name: "", phone: "", image: "", address: "" })
  const [pass, setPass]   = useState({ current: "", next: "", confirm: "" })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext,    setShowNext]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [savingPw,  setSavingPw]  = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/settings")
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      const u = session.user as { name?: string; phone?: string | null; image?: string | null }
      setForm((prev) => ({
        ...prev,
        name:  u.name  ?? "",
        phone: u.phone ?? "",
        image: u.image ?? "",
      }))
      // Load full profile to get address
      fetch("/api/profile")
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.address) setForm((prev) => ({ ...prev, address: data.address ?? "" }))
        })
        .catch(() => {})
    }
  }, [session])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    // Reuse the upload endpoint but save to avatars/ prefix
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (res.ok) {
      const { url } = await res.json()
      setForm((f) => ({ ...f, image: url }))
    } else {
      toast.error("UPLOAD FAILED", { className: "font-mono text-xs" })
    }
    setUploading(false)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, phone: form.phone || null, image: form.image || null, address: form.address || null }),
    })
    if (res.ok) {
      await update({ name: form.name, phone: form.phone || null, image: form.image || null })
      toast.success("PROFILE.UPDATED", { className: "font-mono text-xs" })
    } else {
      const d = await res.json()
      toast.error(d.error ?? "UPDATE FAILED", { className: "font-mono text-xs" })
    }
    setSaving(false)
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pass.next !== pass.confirm) {
      toast.error("PASSWORDS DO NOT MATCH", { className: "font-mono text-xs" })
      return
    }
    setSavingPw(true)
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pass.current, newPassword: pass.next }),
    })
    if (res.ok) {
      toast.success("PASSWORD.UPDATED", { className: "font-mono text-xs" })
      setPass({ current: "", next: "", confirm: "" })
    } else {
      const d = await res.json()
      toast.error(d.error ?? "PASSWORD CHANGE FAILED", { className: "font-mono text-xs" })
    }
    setSavingPw(false)
  }

  if (status === "loading") {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center font-mono">
        <div className="flex items-center gap-2 text-foreground/30 text-[12px]">
          <Loader2 className="h-3 w-3 animate-spin" /> LOADING...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl font-mono space-y-4">

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-foreground/10 pb-4">
        <span className="text-foreground/30 text-[12px]">//</span>
        <h1 className="text-[13px] tracking-[0.3em] text-foreground/70">ACCOUNT.SETTINGS</h1>
      </div>

      {/* Avatar */}
      <div className="border border-foreground/15 p-5 space-y-4">
        <p className="text-[11px] tracking-widest text-foreground/40">// PROFILE.PICTURE</p>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 border border-foreground/20 overflow-hidden bg-foreground/5 flex-shrink-0">
            {form.image ? (
              <Image src={form.image} alt="avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-6 w-6 text-foreground/20" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-foreground/60" />
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 border border-foreground/20 text-[12px] tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40"
            >
              <Camera className="h-3 w-3" />
              {uploading ? "UPLOADING..." : "CHANGE.PHOTO"}
            </button>
            <p className="text-[10px] text-foreground/20">JPG, PNG, WEBP · MAX 4MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Profile info */}
      <form onSubmit={handleSaveProfile} className="border border-foreground/15 p-5 space-y-4 relative">
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-foreground/20" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-foreground/20" />

        <p className="text-[11px] tracking-widest text-foreground/40">// PERSONAL.INFO</p>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-widest text-foreground/30 block">EMAIL.ADDRESS</label>
          <p className="text-[12px] text-foreground/40 px-3 py-2 border border-foreground/10 bg-foreground/5">
            {session?.user?.email}
          </p>
          <p className="text-[10px] text-foreground/20">EMAIL CANNOT BE CHANGED</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-widest text-foreground/30 flex items-center gap-1.5 mb-1">
            <User className="h-2.5 w-2.5" /> DISPLAY.NAME
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            minLength={2}
            required
            className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[12px] text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-widest text-foreground/30 flex items-center gap-1.5 mb-1">
            <Phone className="h-2.5 w-2.5" /> PHONE.NUMBER
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+255 712 345 678"
            className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[12px] text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
          />
          <p className="text-[10px] text-foreground/20">USED FOR MOBILE MONEY PAYMENTS</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] tracking-widest text-foreground/30 flex items-center gap-1.5 mb-1">
            <MapPin className="h-2.5 w-2.5" /> DELIVERY.ADDRESS
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Kariakoo Street, Dar es Salaam"
            className="w-full bg-transparent border border-foreground/15 px-3 py-2 text-[12px] text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
          />
          <p className="text-[10px] text-foreground/20">AUTO-FILLED AT CHECKOUT</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-foreground text-background text-[12px] tracking-widest font-bold hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> SAVING...</> : <><Save className="h-3.5 w-3.5" /> SAVE.CHANGES</>}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handleChangePassword} className="border border-foreground/15 p-5 space-y-4">
        <p className="text-[11px] tracking-widest text-foreground/40">// CHANGE.PASSWORD</p>

        {[
          { label: "CURRENT.PASSWORD", key: "current" as const, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
          { label: "NEW.PASSWORD",     key: "next"    as const, show: showNext,    toggle: () => setShowNext(!showNext) },
          { label: "CONFIRM.PASSWORD", key: "confirm" as const, show: showNext,    toggle: () => setShowNext(!showNext) },
        ].map(({ label, key, show, toggle }) => (
          <div key={key} className="space-y-1.5">
            <label className="text-[10px] tracking-widest text-foreground/30 block">{label}</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pass[key]}
                onChange={(e) => setPass({ ...pass, [key]: e.target.value })}
                placeholder="••••••••"
                required
                minLength={key !== "current" ? 6 : 1}
                className="w-full bg-transparent border border-foreground/15 px-3 py-2 pr-9 text-[12px] text-foreground/80 placeholder:text-foreground/20 focus:outline-none focus:border-foreground/40 transition-colors"
              />
              <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors">
                {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={savingPw}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-foreground/20 text-[12px] tracking-widest text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
        >
          {savingPw ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> UPDATING...</> : <><KeyRound className="h-3.5 w-3.5" /> UPDATE.PASSWORD</>}
        </button>
      </form>
    </div>
  )
}
