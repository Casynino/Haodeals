import nodemailer from "nodemailer"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "haodealtz@gmail.com"
const APP_URL = process.env.AUTH_URL ?? "https://haodeals.vercel.app"

function createTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return null
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  })
}

/* ─────────────────────────────────────────────
   Shared header / footer HTML snippets
───────────────────────────────────────────── */
const htmlHeader = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5;border-radius:4px;overflow:hidden">
    <div style="background:#ee0000;padding:20px 32px;display:flex;align-items:center">
      <span style="font-family:monospace;font-weight:900;font-size:20px;color:#ffffff;letter-spacing:0.1em">hão<span style="color:rgba(255,255,255,0.7)">deals</span></span>
    </div>
    <div style="padding:32px">
`

const htmlFooter = (unsubscribeUrl?: string) => `
    </div>
    <div style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:16px 32px">
      <p style="font-family:monospace;font-size:10px;color:#999;margin:0;letter-spacing:0.05em">
        HaoDeals · Tanzania's best deals platform · ${APP_URL}
        ${unsubscribeUrl ? `<br/><a href="${unsubscribeUrl}" style="color:#bbb;text-decoration:underline">Unsubscribe from these emails</a>` : ""}
      </p>
    </div>
  </div>
`

/* ─────────────────────────────────────────────
   Welcome email
───────────────────────────────────────────── */
export async function sendWelcomeEmail(to: string, name: string) {
  const transport = createTransport()
  if (!transport) return

  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  await transport.sendMail({
    from: `HaoDeals <${process.env.GMAIL_USER}>`,
    replyTo: ADMIN_EMAIL,
    to,
    subject: `Welcome to HaoDeals, ${displayName}!`,
    text: `
Hi ${displayName},

Welcome to HaoDeals! Your account is now active.

Access your wallet, top up, and start shopping the best deals in Tanzania.

Browse deals: ${APP_URL}/products

—
HaoDeals · Tanzania's best deals platform
${APP_URL}
    `.trim(),
    html: `
${htmlHeader}
      <h1 style="font-size:22px;font-weight:800;color:#0a0a0a;margin:0 0 6px">Welcome, ${displayName}!</h1>
      <p style="font-size:13px;color:#666;margin:0 0 24px">Your account is ready to go.</p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px"/>
      <p style="font-size:14px;color:#333;line-height:1.6;margin:0 0 24px">
        Access your wallet to top up and start shopping the best deals in Tanzania.
      </p>
      <a href="${APP_URL}/products"
         style="display:inline-block;padding:12px 28px;background:#ee0000;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.05em;text-decoration:none;border-radius:3px">
        Browse Deals →
      </a>
${htmlFooter()}
    `,
  }).catch((err) => console.error("[email] welcome failed:", err))
}

/* ─────────────────────────────────────────────
   Deal announcement broadcast
───────────────────────────────────────────── */
export async function sendDealAnnouncement(
  recipients: string[],
  subject: string,
  message: string,
  link?: string,
) {
  const transport = createTransport()
  if (!transport) return { sent: 0, failed: 0 }

  const ctaUrl = link ? (link.startsWith("http") ? link : APP_URL + link) : `${APP_URL}/products`
  const ctaLabel = link ? "View Deal →" : "Browse Deals →"
  const unsubscribeMailto = `mailto:${ADMIN_EMAIL}?subject=Unsubscribe`

  let sent = 0, failed = 0

  for (const to of recipients) {
    await transport.sendMail({
      from: `HaoDeals <${process.env.GMAIL_USER}>`,
      replyTo: ADMIN_EMAIL,
      to,
      subject,
      headers: {
        "List-Unsubscribe": `<${unsubscribeMailto}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "Precedence": "bulk",
      },
      text: `
${subject}

${message}

${ctaLabel}: ${ctaUrl}

—
HaoDeals · Tanzania's best deals platform
You received this because you have an account with us.
To unsubscribe, reply to this email with "Unsubscribe" in the subject.
      `.trim(),
      html: `
${htmlHeader}
        <h1 style="font-size:20px;font-weight:800;color:#0a0a0a;margin:0 0 20px">${subject}</h1>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 20px"/>
        <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 24px;white-space:pre-line">${message}</p>
        <a href="${ctaUrl}"
           style="display:inline-block;padding:12px 28px;background:#ee0000;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.05em;text-decoration:none;border-radius:3px">
          ${ctaLabel}
        </a>
${htmlFooter(unsubscribeMailto)}
      `,
    }).then(() => sent++).catch(() => failed++)
  }

  return { sent, failed }
}

/* ─────────────────────────────────────────────
   New order alert to admin
───────────────────────────────────────────── */
export async function sendOrderNotificationToAdmin(order: {
  id: string
  total: number
  address: string
  userName: string
  userEmail: string
  userPhone?: string | null
  items: { name: string; quantity: number; price: number }[]
}) {
  const transport = createTransport()
  if (!transport) return

  const itemLines = order.items
    .map((i) => `  • ${i.name} ×${i.quantity}  —  TSh ${(i.price * i.quantity).toLocaleString()}`)
    .join("\n")

  const itemRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0">${i.name}</td>
        <td style="padding:6px 0;font-size:13px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0">×${i.quantity}</td>
        <td style="padding:6px 0;font-size:13px;color:#0a0a0a;font-weight:700;text-align:right;border-bottom:1px solid #f0f0f0">TSh ${(i.price * i.quantity).toLocaleString()}</td>
      </tr>`,
    )
    .join("")

  await transport.sendMail({
    from: `HaoDeals <${process.env.GMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: `New Order #${order.id.slice(0, 8).toUpperCase()} — TSh ${order.total.toLocaleString()}`,
    text: `
New Order Received

Order: #${order.id.slice(0, 8).toUpperCase()}
Total: TSh ${order.total.toLocaleString()}

Items:
${itemLines}

Customer: ${order.userName} <${order.userEmail}>
${order.userPhone ? `Phone: ${order.userPhone}\n` : ""}Address: ${order.address}

View in admin: ${APP_URL}/admin/orders
    `.trim(),
    html: `
${htmlHeader}
      <h1 style="font-size:18px;font-weight:800;color:#0a0a0a;margin:0 0 4px">New Order Received</h1>
      <p style="font-family:monospace;font-size:13px;color:#666;margin:0 0 4px">#${order.id.slice(0, 8).toUpperCase()}</p>
      <p style="font-size:28px;font-weight:900;color:#ee0000;margin:0 0 24px">TSh ${order.total.toLocaleString()}</p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 20px"/>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
        ${itemRows}
      </table>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 20px"/>
      <div style="font-size:13px;color:#555;line-height:1.8">
        <p style="margin:0"><strong style="color:#333">Customer:</strong> ${order.userName} &lt;${order.userEmail}&gt;</p>
        ${order.userPhone ? `<p style="margin:0"><strong style="color:#333">Phone:</strong> ${order.userPhone}</p>` : ""}
        <p style="margin:0"><strong style="color:#333">Address:</strong> ${order.address}</p>
      </div>
      <a href="${APP_URL}/admin/orders"
         style="display:inline-block;margin-top:24px;padding:12px 28px;background:#0a0a0a;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.05em;text-decoration:none;border-radius:3px">
        View in Admin →
      </a>
${htmlFooter()}
    `,
  }).catch((err) => console.error("[email] order notification failed:", err))
}
