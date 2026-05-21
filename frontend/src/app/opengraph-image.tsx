import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt =
  "Polagon — Decentralized prediction markets, polls, and soulbound reputation on Portaldot.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#08090C",
          backgroundImage:
            "radial-gradient(circle at 20% 10%, rgba(124,58,237,0.30) 0px, transparent 480px), radial-gradient(circle at 90% 90%, rgba(34,211,238,0.22) 0px, transparent 520px)",
          padding: "72px",
          color: "#F5F5F7",
          fontFamily: "Inter, system-ui",
        }}
      >
        {/* Header — logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 14,
              background: "linear-gradient(135deg, #7C3AED 0%, #22D3EE 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            P
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600 }}>
              Polagon
            </div>
            <div style={{ display: "flex", fontSize: 18, color: "#A1A1AA" }}>
              Predict. Stake. Earn reputation.
            </div>
          </div>
        </div>

        {/* Headline block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1056,
            }}
          >
            On-chain prediction markets, native to Portaldot.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#A1A1AA",
              maxWidth: 1056,
            }}
          >
            Markets · Polls · Soulbound PolagonScore. Built with Ink! 5.x · MIT
            licensed.
          </div>
        </div>

        {/* Footer row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#71717A",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <span>polagon.vercel.app</span>
            <span>·</span>
            <span>Portaldot Hackathon S1</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #27272A",
              backgroundColor: "rgba(34,211,238,0.06)",
              color: "#22D3EE",
            }}
          >
            <div
              style={{
                display: "flex",
                width: 8,
                height: 8,
                borderRadius: 999,
                backgroundColor: "#22D3EE",
              }}
            />
            Testnet preview
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
