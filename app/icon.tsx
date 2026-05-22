import { ImageResponse } from "next/og"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon() {
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
          gap: 0,
        }}
      >
        <span
          style={{
            color: "#ee0000",
            fontSize: 260,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          hão
        </span>
        <span
          style={{
            color: "#0a0a0a",
            fontSize: 110,
            fontWeight: 900,
            lineHeight: 1,
            marginTop: -8,
          }}
        >
          deals
        </span>
      </div>
    ),
    { ...size }
  )
}
