import type { Metadata, Viewport } from "next"
import { Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"

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
  metadataBase: new URL("https://haodeals.vercel.app"),
  title: {
    default: "HaoDeals — Good Deals Delivered",
    template: "%s | HaoDeals",
  },
  description:
    "HaoDeals — Tanzania's best deals on electronics, fashion, home goods, and more. Good deals delivered.",
  keywords: ["deals", "Tanzania", "electronics", "fashion", "shopping", "haodeals", "discounts"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://haodeals.vercel.app",
    siteName: "HaoDeals",
    title: "HaoDeals — Good Deals Delivered",
    description: "Tanzania's best deals on electronics, fashion, home goods, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "HaoDeals — Good Deals Delivered",
    description: "Tanzania's best deals on electronics, fashion, home goods, and more.",
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
    title: "HaoDeals",
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
      className={`${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      {/* Patch BroadcastChannel BEFORE any ES module runs — prevents next-auth
          from syncing signIn/signOut across tabs in real time. Each tab keeps
          its own session state; updates only happen on navigation/refresh. */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){var R=window.BroadcastChannel;if(!R)return;var N={name:"next-auth",onmessage:null,onmessageerror:null,postMessage:function(){},addEventListener:function(){},removeEventListener:function(){},dispatchEvent:function(){return true},close:function(){}};window.BroadcastChannel=function(n){return n==="next-auth"?N:new R(n)};window.BroadcastChannel.prototype=R.prototype})()` }} />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-mono">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
