import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? "HaoDeals <noreply@haodeals.vercel.app>"
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "casmiry21@icloud.com"

export async function sendWelcomeEmail(to: string, name: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to HaoDeals",
    html: `
      <div style="font-family:monospace;max-width:480px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:32px;border:1px solid #222">
        <p style="font-size:10px;letter-spacing:0.3em;color:#555;margin:0 0 24px">// SYSTEM.MESSAGE</p>
        <h1 style="font-size:18px;font-weight:900;letter-spacing:0.15em;margin:0 0 8px">WELCOME, ${name.toUpperCase()}</h1>
        <p style="font-size:11px;color:#888;letter-spacing:0.1em;margin:0 0 24px">YOUR ACCOUNT HAS BEEN ACTIVATED</p>
        <hr style="border:none;border-top:1px solid #222;margin:0 0 24px"/>
        <p style="font-size:10px;color:#666;margin:0 0 8px">ACCESS YOUR WALLET TO TOP UP AND START SHOPPING THE BEST DEALS IN TANZANIA.</p>
        <a href="${process.env.AUTH_URL ?? "https://haodeals.vercel.app"}/products"
           style="display:inline-block;margin-top:16px;padding:10px 24px;background:#e5e5e5;color:#0a0a0a;font-size:10px;font-weight:700;letter-spacing:0.2em;text-decoration:none">
          BROWSE.DEALS →
        </a>
        <p style="font-size:8px;color:#444;margin:32px 0 0;letter-spacing:0.1em">HAODEALS · TANZANIA'S BEST DEALS PLATFORM</p>
      </div>
    `,
  }).catch((err) => console.error("[email] welcome failed:", err))
}

export async function sendOrderNotificationToAdmin(order: {
  id: string
  total: number
  address: string
  userName: string
  userEmail: string
  userPhone?: string | null
  items: { name: string; quantity: number; price: number }[]
}) {
  if (!process.env.RESEND_API_KEY) return
  const itemRows = order.items
    .map((i) => `<tr><td style="padding:4px 0;color:#888;font-size:10px">${i.name.toUpperCase()}</td><td style="padding:4px 0;color:#888;font-size:10px;text-align:right">×${i.quantity}</td><td style="padding:4px 0;color:#4ade80;font-size:10px;text-align:right">TSh ${(i.price * i.quantity).toLocaleString()}</td></tr>`)
    .join("")

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[NEW ORDER] #${order.id.slice(0, 8).toUpperCase()} — TSh ${order.total.toLocaleString()}`,
    html: `
      <div style="font-family:monospace;max-width:520px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;padding:32px;border:1px solid #222">
        <p style="font-size:10px;letter-spacing:0.3em;color:#555;margin:0 0 24px">// NEW.ORDER.ALERT</p>
        <h1 style="font-size:16px;font-weight:900;letter-spacing:0.15em;margin:0 0 4px">ORDER #${order.id.slice(0, 8).toUpperCase()}</h1>
        <p style="font-size:22px;font-weight:900;color:#4ade80;letter-spacing:0.1em;margin:0 0 24px">TSh ${order.total.toLocaleString()}</p>
        <hr style="border:none;border-top:1px solid #222;margin:0 0 20px"/>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">${itemRows}</table>
        <hr style="border:none;border-top:1px solid #222;margin:0 0 20px"/>
        <div style="font-size:10px;color:#666;space-y:4px">
          <p style="margin:0 0 4px"><span style="color:#444;letter-spacing:0.1em">CUSTOMER:</span> ${order.userName} &lt;${order.userEmail}&gt;</p>
          ${order.userPhone ? `<p style="margin:0 0 4px"><span style="color:#444;letter-spacing:0.1em">PHONE:</span> ${order.userPhone}</p>` : ""}
          <p style="margin:0 0 4px"><span style="color:#444;letter-spacing:0.1em">ADDRESS:</span> ${order.address}</p>
        </div>
        <a href="${process.env.AUTH_URL ?? "https://haodeals.vercel.app"}/admin/orders"
           style="display:inline-block;margin-top:24px;padding:10px 24px;background:#e5e5e5;color:#0a0a0a;font-size:10px;font-weight:700;letter-spacing:0.2em;text-decoration:none">
          VIEW IN ADMIN →
        </a>
      </div>
    `,
  }).catch((err) => console.error("[email] order notification failed:", err))
}
