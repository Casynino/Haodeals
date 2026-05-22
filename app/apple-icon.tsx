import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
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
        <span
          style={{
            color: "#ee0000",
            fontSize: 90,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          hão
        </span>
        <span
          style={{
            color: "#0a0a0a",
            fontSize: 38,
            fontWeight: 900,
            lineHeight: 1,
            marginTop: -4,
          }}
        >
          deals
        </span>
      </div>
    ),
    { ...size }
  )
}
