import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { WhatsAppButton } from "@/components/WhatsAppButton"
import { BottomNav } from "@/components/BottomNav"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ee0000",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://haodealtz.com"),
  title: {
    default: "Hǎodeals — Good Deals Delivered",
    template: "%s | Hǎodeals",
  },
  description:
    "A collection of limited deals — now in stock. Tap to explore, shop, and enjoy fast delivery.",
  keywords: ["deals", "Tanzania", "electronics", "fashion", "shopping", "haodeals", "discounts"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://haodealtz.com",
    siteName: "Hǎodeals",
    title: "Hǎodeals — Good Deals Delivered",
    description: "A collection of limited deals — now in stock. Tap to explore, shop, and enjoy fast delivery.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hǎodeals — Good Deals Delivered",
    description: "A collection of limited deals — now in stock. Tap to explore, shop, and enjoy fast delivery.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: "/favicon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Hǎodeals",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        {/* Runs before ANY Next.js/module code — next-auth reads window.BroadcastChannel
            at useEffect time, so this is guaranteed to be in place first.
            Effect: login/logout on Tab A stays on Tab A only. */}
        <Script id="bc-isolation" strategy="beforeInteractive">{`(function(){var R=window.BroadcastChannel;if(!R||window.__bcPatched)return;var N={name:"next-auth",onmessage:null,onmessageerror:null,postMessage:function(){},addEventListener:function(){},removeEventListener:function(){},dispatchEvent:function(){return true},close:function(){}};window.BroadcastChannel=function(n){return n==="next-auth"?N:new R(n)};window.BroadcastChannel.prototype=R.prototype;window.__bcPatched=true})();`}</Script>
        <Providers>
          <Navbar />
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>
          <Footer />
          <WhatsAppButton />
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
