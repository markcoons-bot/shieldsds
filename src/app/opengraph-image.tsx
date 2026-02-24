import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ShieldSDS — OSHA HazCom Compliance for Small Businesses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0B1426 0%, #132039 50%, #1A2D4D 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #F59E0B, #D97706, #F59E0B)",
            display: "flex",
          }}
        />

        {/* Shield emoji as icon stand-in */}
        <div
          style={{
            fontSize: 72,
            marginBottom: 16,
            display: "flex",
          }}
        >
          🛡️
        </div>

        {/* Logo text */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#FFFFFF",
            }}
          >
            Shield
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "#F59E0B",
            }}
          >
            SDS
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 24,
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          OSHA HazCom Compliance Made Simple for Small Businesses
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 24,
              border: "1px solid #D97706",
              color: "#F59E0B",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            SDS Library
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 24,
              border: "1px solid #D97706",
              color: "#F59E0B",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Labels
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 24,
              border: "1px solid #D97706",
              color: "#F59E0B",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Training
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 24,
              border: "1px solid #D97706",
              color: "#F59E0B",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Inspections
          </div>
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 24,
            display: "flex",
            color: "#475569",
            fontSize: 14,
          }}
        >
          shieldsds.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
