import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const host = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").toLowerCase();
  
  // Detect whether platform or tenant
  const isPlatformApex =
    !searchParams.get("tenant") &&
    (host === "beamline.musfiqdehan.com" ||
      host === "www.beamline.musfiqdehan.com" ||
      host === "localhost:3017" ||
      host === "localhost" ||
      host === "127.0.0.1:3017" ||
      host === "127.0.0.1" ||
      searchParams.get("type") === "platform");

  const title = searchParams.get("title");
  const desc = searchParams.get("desc");
  const name = searchParams.get("name");
  const tenantSlug = searchParams.get("tenant") || (host.includes(".beamline") ? host.split(".")[0] : null);

  if (isPlatformApex) {
    const displayTitle = title || "Autonomous Construction CRM & Operations OS";
    const displayDesc =
      desc ||
      "White-labeled client workspaces, 4-phase build execution, AI margin protection, and automated invoice deduplication for custom home builders.";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0c0a09",
            backgroundImage:
              "radial-gradient(circle at 85% 25%, rgba(245, 158, 11, 0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.12), transparent 40%)",
            padding: "54px 64px",
            border: "2px solid #292524",
            color: "#fafaf9",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 60%, #d97706 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(245, 158, 11, 0.25)",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderLeft: "4px solid #0c0a09",
                    borderBottom: "4px solid #0c0a09",
                    transform: "rotate(45deg)",
                  }}
                />
              </div>
              <div style={{ display: "flex", fontSize: "32px", fontWeight: 900, letterSpacing: "-0.03em" }}>
                Beam<span style={{ color: "#f59e0b" }}>Line</span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                borderRadius: "999px",
                backgroundColor: "#1c1917",
                border: "1px solid #44403c",
                fontSize: "13px",
                fontWeight: 700,
                color: "#e7e5e4",
                letterSpacing: "0.04em",
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: "#10b981" }} />
              CONSTRUCTION OS v2.4
            </div>
          </div>

          {/* Center Main Text */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
            <div
              style={{
                fontSize: "52px",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: "1.1",
                color: "#ffffff",
              }}
            >
              {displayTitle}
            </div>
            <div
              style={{
                fontSize: "22px",
                fontWeight: 400,
                color: "#a8a29e",
                lineHeight: "1.4",
                maxWidth: "880px",
              }}
            >
              {displayDesc}
            </div>
          </div>

          {/* 4 Feature Badges */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { title: "White-Label Portals", subtitle: "Custom domains & subdomains" },
              { title: "4-Phase Site Checklists", subtitle: "Pre-con to handover" },
              { title: "AI Margin Shield", subtitle: "100% duplicate protection" },
              { title: "Executive Triage", subtitle: "Notion OS bidirectional sync" },
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  backgroundColor: "#1c1917",
                  border: "1px solid #292524",
                  flex: 1,
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#f59e0b" }}>{f.title}</div>
                <div style={{ fontSize: "12px", color: "#78716c", fontWeight: 500 }}>{f.subtitle}</div>
              </div>
            ))}
          </div>

          {/* Footer Bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #292524",
              paddingTop: "18px",
              fontSize: "13px",
              color: "#78716c",
              fontWeight: 600,
            }}
          >
            <div>beamline.musfiqdehan.com</div>
            <div>TRUSTED BY HIGH-END CUSTOM BUILDERS &amp; ARCHITECTURAL CONTRACTORS</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // Tenant Social Cover
  const tenantName = name || (tenantSlug ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) + "'s Builds" : "Custom Residential Builder");
  const tenantTitle = title || `${tenantName} — Private Client Portal & Custom Build OS`;
  const tenantDesc =
    desc ||
    `Follow every milestone, agreement, design selection, and site update from discovery to move-in day with ${tenantName}.`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0c0a09",
          backgroundImage:
            "radial-gradient(circle at 80% 25%, rgba(245, 158, 11, 0.16), transparent 45%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.1), transparent 40%)",
          padding: "54px 64px",
          border: "2px solid #292524",
          color: "#fafaf9",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                backgroundColor: "#f59e0b",
                color: "#0c0a09",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "20px",
                boxShadow: "0 8px 24px rgba(245, 158, 11, 0.25)",
              }}
            >
              {tenantName.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.02em" }}>
                {tenantName}
              </div>
              <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 700, letterSpacing: "0.05em" }}>
                CUSTOM RESIDENTIAL HOMES
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: "#1c1917",
              border: "1px solid #44403c",
              fontSize: "13px",
              fontWeight: 800,
              color: "#f59e0b",
              letterSpacing: "0.06em",
            }}
          >
            <div style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: "#10b981" }} />
            PRIVATE CLIENT PORTAL
          </div>
        </div>

        {/* Center Main Text */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "980px" }}>
          <div
            style={{
              fontSize: "48px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: "1.15",
              color: "#ffffff",
            }}
          >
            {tenantTitle}
          </div>
          <div
            style={{
              fontSize: "21px",
              fontWeight: 400,
              color: "#a8a29e",
              lineHeight: "1.4",
              maxWidth: "880px",
            }}
          >
            {tenantDesc}
          </div>
        </div>

        {/* 4-Phase Client Journey Showcase */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { step: "01", name: "Discover", text: "Vision & Site Alignment" },
            { step: "02", name: "Plan", text: "Scope, Schedule & Selections" },
            { step: "03", name: "Build", text: "Live Site Checklists & Progress" },
            { step: "04", name: "Welcome Home", text: "Warranty & Full Records" },
          ].map((s, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "16px 20px",
                borderRadius: "14px",
                backgroundColor: "#1c1917",
                border: "1px solid #292524",
                flex: 1,
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#f59e0b" }}>PHASE {s.step}</div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>{s.name}</div>
              <div style={{ fontSize: "11px", color: "#78716c", fontWeight: 500 }}>{s.text}</div>
            </div>
          ))}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #292524",
            paddingTop: "18px",
            fontSize: "13px",
            color: "#78716c",
            fontWeight: 600,
          }}
        >
          <div>Direct Builder Communication · Secure Approvals · Live Site Updates</div>
          <div>Powered by BeamLine Construction OS</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

