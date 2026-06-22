import { ImageResponse } from "next/og"

export const alt = "Hǎodeals — Good Deals Delivered"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial Black, Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", lineHeight: 1 }}>
          <span style={{ color: "#ee0000", fontSize: 148, fontWeight: 900 }}>hǎo</span>
          <span style={{ color: "#0a0a0a", fontSize: 148, fontWeight: 900 }}>deals</span>
        </div>
        <div
          style={{
            color: "#888888",
            fontSize: 30,
            letterSpacing: "0.3em",
            marginTop: 20,
            fontWeight: 400,
          }}
        >
          GOOD DEALS DELIVERED
        </div>
      </div>
    ),
    { ...size }
  )
}
