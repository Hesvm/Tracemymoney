import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Trace My Money";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f5f2ed",
          backgroundImage:
            "radial-gradient(circle, #c8bfb0 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative"
        }}
      >
        {/* Left blurred card hint */}
        <div
          style={{
            position: "absolute",
            left: -20,
            top: "50%",
            transform: "translateY(-50%)",
            width: 260,
            background: "rgba(255,255,255,0.7)",
            borderRadius: 20,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            opacity: 0.5,
            filter: "blur(2px)"
          }}
        >
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Rent</div>
          <div style={{ fontSize: 13, color: "#aaa" }}>2026, may 20</div>
        </div>

        {/* Right blurred card hint */}
        <div
          style={{
            position: "absolute",
            right: -20,
            top: "30%",
            width: 280,
            background: "rgba(255,255,255,0.7)",
            borderRadius: 20,
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            opacity: 0.5,
            filter: "blur(2px)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: "#ff6b35", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14 }}>🐷</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#2d2d2d" }}>Savings</div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 4 }}>$700 on cash</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>~ 120,000,000 T at time</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>$500 USDT on Wallex</div>
        </div>

        {/* Center content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 28
          }}
        >
          {/* Logo + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 18,
                background: "#f5f2ed",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 40
              }}
            >
              💵
            </div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 800,
                color: "#1a1a1a",
                letterSpacing: "-1px"
              }}
            >
              Trace My Money
            </div>
          </div>

          {/* Main card */}
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              borderRadius: 24,
              padding: "28px 36px",
              width: 480,
              boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
              display: "flex",
              flexDirection: "column",
              gap: 0
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: "#4caf72",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 16
                  }}
                >
                  ↓
                </div>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: "#2d2d2d"
                  }}
                >
                  Income
                </span>
              </div>
              <span style={{ fontSize: 22, color: "#aaa", fontWeight: 300 }}>+</span>
            </div>

            {/* Items */}
            {[
              { amount: "90,000,000 T", label: "Salary", sub: "~ $500 at time", date: "2026, may 20" },
              { amount: "15,000,000 T", label: "Rent", sub: "~90$ at time", date: "2026, may 20" },
              { amount: "$1400", label: "Project", sub: "~ 230,000,000 T at time", date: "2026, may 20" }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingTop: i === 0 ? 0 : 16,
                  paddingBottom: i === 2 ? 0 : 16,
                  borderBottom: i < 2 ? "1px solid #f0ece6" : "none"
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>
                    {item.amount} :: {item.label}
                  </div>
                  <div style={{ fontSize: 13, color: "#999", fontStyle: "italic" }}>
                    {item.sub}
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "#aaa", marginTop: 2 }}>{item.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
