import nodemailer from "nodemailer"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "haodealtz@gmail.com"
const APP_URL     = process.env.APP_URL ?? process.env.AUTH_URL ?? "https://haodealtz.com"

function createTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return null
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    pool: true,
  })
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/** Invisible preview text — controls inbox snippet, hides from rendered email */
function previewText(text: string) {
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;opacity:0;">${text}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>`
}

/** Full HTML document wrapper — missing DOCTYPE is the #1 spam trigger */
function wrapHtml(preview: string, body: string, unsubscribeUrl?: string) {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>HaoDeals</title>
  <style>
    body { margin:0; padding:0; background:#f4f4f4; }
    a { color: #ee0000; }
    @media only screen and (max-width:600px) {
      .email-container { width:100% !important; }
      .email-body { padding:24px 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${previewText(preview)}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f4f4f4;">
    <tr><td style="padding:24px 16px;">
      <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="520" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">
        <!-- Header -->
        <tr>
          <td style="background:#ee0000;padding:20px 32px;">
            <span style="font-family:Georgia,serif;font-weight:900;font-size:22px;color:#ffffff;letter-spacing:0.05em;">hão<span style="color:rgba(255,255,255,0.75);">deals</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td class="email-body" style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:16px 32px;">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#999;margin:0;line-height:1.6;">
              HaoDeals &middot; Tanzania&rsquo;s best deals &middot;
              <a href="${APP_URL}" style="color:#bbb;text-decoration:underline;">${APP_URL.replace("https://", "")}</a>
              ${unsubscribeUrl ? `<br/><a href="${unsubscribeUrl}" style="color:#bbb;text-decoration:underline;">Unsubscribe</a>` : ""}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/** Standard transactional email headers (NOT bulk — avoids promotions tab) */
const transactionalHeaders = {
  "X-Mailer": "HaoDeals Mailer",
  "X-Priority": "3",
  "Importance": "Normal",
  "Auto-Submitted": "auto-generated",
}

/* ─────────────────────────────────────────────
   Welcome email  (transactional)
───────────────────────────────────────────── */
export async function sendWelcomeEmail(to: string, name: string) {
  const transport = createTransport()
  if (!transport) return

  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  const body = `
    <h1 style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#0a0a0a;margin:0 0 8px;">Welcome, ${displayName}!</h1>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#777;margin:0 0 24px;">Your account is ready.</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;"/>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;margin:0 0 8px;">
      You&rsquo;re now part of HaoDeals &mdash; the best place to shop online in Tanzania.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;margin:0 0 28px;">
      Browse daily deals on tech, fashion, shoes, accessories and more. Get fast delivery anywhere in Tanzania.
    </p>
    <a href="${APP_URL}/products"
       style="display:inline-block;padding:13px 32px;background:#ee0000;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:3px;">
      Browse Deals &rarr;
    </a>
  `

  await transport.sendMail({
    from: `HaoDeals <${process.env.GMAIL_USER}>`,
    replyTo: ADMIN_EMAIL,
    to,
    subject: `Welcome to HaoDeals, ${displayName}!`,
    headers: transactionalHeaders,
    text: `Hi ${displayName},\n\nWelcome to HaoDeals! Your account is ready.\n\nBrowse deals on tech, fashion, shoes, accessories and more — with fast delivery across Tanzania.\n\n${APP_URL}/products\n\n— HaoDeals`,
    html: wrapHtml(`Hi ${displayName}, welcome to HaoDeals! Your account is now active.`, body),
  }).catch((err) => console.error("[email] welcome failed:", err))
}

/* ─────────────────────────────────────────────
   Deal announcement  (marketing — bulk)
───────────────────────────────────────────── */
export async function sendDealAnnouncement(
  recipients: string[],
  subject: string,
  message: string,
  link?: string,
) {
  const transport = createTransport()
  if (!transport) return { sent: 0, failed: 0 }

  const ctaUrl   = link ? (link.startsWith("http") ? link : APP_URL + link) : `${APP_URL}/products`
  const ctaLabel = "View Deal"
  const unsubscribeUrl = `mailto:${ADMIN_EMAIL}?subject=Unsubscribe`

  // Clean the subject — remove ALL CAPS words and excessive punctuation
  const safeSubject = subject.replace(/!{2,}/g, "!").trim()

  const body = `
    <h1 style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:#0a0a0a;margin:0 0 20px;">${safeSubject}</h1>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 20px;"/>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.8;margin:0 0 28px;white-space:pre-line;">${message}</p>
    <a href="${ctaUrl}"
       style="display:inline-block;padding:13px 32px;background:#ee0000;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:3px;">
      ${ctaLabel} &rarr;
    </a>
  `

  const plainText = `${safeSubject}\n\n${message}\n\n${ctaLabel}: ${ctaUrl}\n\n---\nHaoDeals · ${APP_URL}\nTo unsubscribe, reply with "Unsubscribe" in the subject.`

  let sent = 0, failed = 0

  for (const to of recipients) {
    await transport.sendMail({
      from: `HaoDeals <${process.env.GMAIL_USER}>`,
      replyTo: ADMIN_EMAIL,
      to,
      subject: safeSubject,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "Precedence": "bulk",
        "X-Mailer": "HaoDeals Mailer",
        "Auto-Submitted": "auto-generated",
      },
      text: plainText,
      html: wrapHtml(message.slice(0, 120).replace(/\n/g, " "), body, unsubscribeUrl),
    }).then(() => sent++).catch(() => failed++)
  }

  return { sent, failed }
}

/* ─────────────────────────────────────────────
   Password reset  (transactional)
───────────────────────────────────────────── */
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const transport = createTransport()
  if (!transport) return

  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  const body = `
    <h1 style="font-family:Arial,sans-serif;font-size:22px;font-weight:800;color:#0a0a0a;margin:0 0 6px;">Reset your password</h1>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#777;margin:0 0 24px;">Hi ${displayName},</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;"/>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;margin:0 0 8px;">
      We received a request to reset your HaoDeals password.
    </p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#999;margin:0 0 28px;">
      This link expires in <strong style="color:#666;">1 hour</strong>. If you didn&rsquo;t request this, ignore this email.
    </p>
    <a href="${resetUrl}"
       style="display:inline-block;padding:13px 32px;background:#ee0000;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;border-radius:3px;">
      Reset Password &rarr;
    </a>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;margin:28px 0 0;line-height:1.6;">
      Your password won&rsquo;t change unless you click the button above and set a new one.
    </p>
  `

  await transport.sendMail({
    from: `HaoDeals <${process.env.GMAIL_USER}>`,
    replyTo: ADMIN_EMAIL,
    to,
    subject: "Your HaoDeals password reset link",
    headers: transactionalHeaders,
    text: `Hi ${displayName},\n\nWe received a request to reset your HaoDeals password.\n\nReset link (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\n— HaoDeals`,
    html: wrapHtml(`Reset your HaoDeals password — link expires in 1 hour.`, body),
  }).catch((err) => console.error("[email] password reset failed:", err))
}

/* ─────────────────────────────────────────────
   Order status update  (transactional — customer)
───────────────────────────────────────────── */

const STATUS_LABELS: Record<string, string> = {
  payment_confirmed:  "Payment Confirmed",
  order_received:     "Order Received",
  packaging:          "Packaging in Progress",
  ready_for_delivery: "Ready for Delivery",
  in_transit:         "In Transit",
  out_for_delivery:   "Out for Delivery",
  delivered:          "Delivered",
  cancelled:          "Order Cancelled",
  refund_processing:  "Refund Processing",
  refunded:           "Refund Completed",
}

const STATUS_COLORS: Record<string, string> = {
  delivered: "#16a34a",
  cancelled: "#dc2626",
  refunded:  "#16a34a",
  refund_processing: "#ea580c",
}

export async function sendOrderStatusEmail(
  to: string,
  name: string,
  order: {
    orderId: string
    trackingId?: string | null
    status: string
    message: string
  }
) {
  const transport = createTransport()
  if (!transport) return

  const displayName = name.charAt(0).toUpperCase() + name.slice(1)
  const statusLabel = STATUS_LABELS[order.status] ?? order.status
  const accentColor = STATUS_COLORS[order.status] ?? "#ee0000"
  const shortId = order.orderId.slice(0, 8).toUpperCase()
  const trackingUrl = `${APP_URL}/orders/${order.orderId}`

  const body = `
    <h1 style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:#0a0a0a;margin:0 0 4px;">Order Update</h1>
    <p style="font-family:monospace;font-size:12px;color:#666;margin:0 0 4px;">#${shortId}${order.trackingId ? ` · ${order.trackingId}` : ""}</p>
    <p style="font-family:Arial,sans-serif;font-size:22px;font-weight:900;color:${accentColor};margin:0 0 24px;">${statusLabel}</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 20px;"/>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;margin:0 0 28px;">Hi ${displayName},<br/><br/>${order.message}</p>
    <a href="${trackingUrl}"
       style="display:inline-block;padding:13px 32px;background:#ee0000;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;">
      Track Your Order &rarr;
    </a>
  `

  await transport.sendMail({
    from: `HaoDeals <${process.env.GMAIL_USER}>`,
    replyTo: ADMIN_EMAIL,
    to,
    subject: `Order #${shortId} — ${statusLabel}`,
    headers: transactionalHeaders,
    text: `Hi ${displayName},\n\nYour order #${shortId} status: ${statusLabel}\n\n${order.message}\n\nTrack your order: ${trackingUrl}\n\n— HaoDeals`,
    html: wrapHtml(`Order #${shortId}: ${statusLabel}`, body),
  }).catch((err) => console.error("[email] order status failed:", err))
}

/* ─────────────────────────────────────────────
   Loyalty promo code  (transactional)
───────────────────────────────────────────── */
export async function sendPromoCodeEmail(
  to: string,
  name: string,
  code: string,
  percent: number
) {
  const transport = createTransport()
  if (!transport) return

  const displayName = name.charAt(0).toUpperCase() + name.slice(1)

  const body = `
    <h1 style="font-family:Arial,sans-serif;font-size:20px;font-weight:800;color:#0a0a0a;margin:0 0 6px;">A gift from us 🎁</h1>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#777;margin:0 0 24px;">Thank you, ${displayName}!</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 24px;"/>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;margin:0 0 20px;">
      Your order has been delivered — thank you for shopping with HaoDeals! As a token of our appreciation, here's an exclusive discount code just for you:
    </p>
    <div style="text-align:center;margin:0 0 28px;">
      <div style="display:inline-block;padding:16px 32px;background:#f9f9f9;border:2px dashed #ee0000;">
        <p style="font-family:monospace;font-size:22px;font-weight:900;color:#ee0000;letter-spacing:0.12em;margin:0;">${code}</p>
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#999;margin:6px 0 0;">${percent}% off your next order · Valid for 30 days</p>
      </div>
    </div>
    <a href="${APP_URL}/products"
       style="display:inline-block;padding:13px 32px;background:#ee0000;color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:700;text-decoration:none;">
      Shop Now &rarr;
    </a>
    <p style="font-family:Arial,sans-serif;font-size:12px;color:#aaa;margin:28px 0 0;line-height:1.6;">
      Enter this code at checkout. One-time use. Cannot be combined with other offers.
    </p>
  `

  await transport.sendMail({
    from: `HaoDeals <${process.env.GMAIL_USER}>`,
    replyTo: ADMIN_EMAIL,
    to,
    subject: `${displayName}, here's ${percent}% off your next order! 🎁`,
    headers: transactionalHeaders,
    text: `Hi ${displayName},\n\nThank you for your order! Here's ${percent}% off your next purchase:\n\nCode: ${code}\nValid for 30 days.\n\nShop now: ${APP_URL}/products\n\n— HaoDeals`,
    html: wrapHtml(`Your exclusive ${percent}% discount code: ${code}`, body),
  }).catch((err) => console.error("[email] promo code failed:", err))
}

/* ─────────────────────────────────────────────
   New order alert  (transactional — admin only)
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
    .map((i) => `
      <tr>
        <td style="padding:7px 0;font-family:Arial,sans-serif;font-size:13px;color:#333;border-bottom:1px solid #f0f0f0;">${i.name}</td>
        <td style="padding:7px 0;font-family:Arial,sans-serif;font-size:13px;color:#666;text-align:center;border-bottom:1px solid #f0f0f0;">×${i.quantity}</td>
        <td style="padding:7px 0;font-family:Arial,sans-serif;font-size:13px;color:#0a0a0a;font-weight:700;text-align:right;border-bottom:1px solid #f0f0f0;">TSh ${(i.price * i.quantity).toLocaleString()}</td>
      </tr>`)
    .join("")

  const body = `
    <h1 style="font-family:Arial,sans-serif;font-size:18px;font-weight:800;color:#0a0a0a;margin:0 0 4px;">New Order</h1>
    <p style="font-family:monospace;font-size:13px;color:#666;margin:0 0 4px;">#${order.id.slice(0, 8).toUpperCase()}</p>
    <p style="font-family:Arial,sans-serif;font-size:32px;font-weight:900;color:#ee0000;margin:0 0 24px;">TSh ${order.total.toLocaleString()}</p>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 20px;"/>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:20px;">
      ${itemRows}
    </table>
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:0 0 20px;"/>
    <div style="font-family:Arial,sans-serif;font-size:13px;color:#555;line-height:1.9;">
      <p style="margin:0;"><strong style="color:#333;">Customer:</strong> ${order.userName} &lt;${order.userEmail}&gt;</p>
      ${order.userPhone ? `<p style="margin:0;"><strong style="color:#333;">Phone:</strong> ${order.userPhone}</p>` : ""}
      <p style="margin:0;"><strong style="color:#333;">Address:</strong> ${order.address}</p>
    </div>
    <a href="${APP_URL}/admin/orders"
       style="display:inline-block;margin-top:24px;padding:12px 28px;background:#0a0a0a;color:#ffffff;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;border-radius:3px;">
      View in Admin &rarr;
    </a>
  `

  await transport.sendMail({
    from: `HaoDeals <${process.env.GMAIL_USER}>`,
    to: ADMIN_EMAIL,
    subject: `New order #${order.id.slice(0, 8).toUpperCase()} — TSh ${order.total.toLocaleString()}`,
    headers: transactionalHeaders,
    text: `New Order #${order.id.slice(0, 8).toUpperCase()}\nTotal: TSh ${order.total.toLocaleString()}\n\nItems:\n${itemLines}\n\nCustomer: ${order.userName} <${order.userEmail}>\n${order.userPhone ? `Phone: ${order.userPhone}\n` : ""}Address: ${order.address}\n\nAdmin: ${APP_URL}/admin/orders`,
    html: wrapHtml(`New order from ${order.userName} — TSh ${order.total.toLocaleString()}`, body),
  }).catch((err) => console.error("[email] order notification failed:", err))
}
