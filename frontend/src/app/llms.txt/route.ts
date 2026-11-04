import { type NextRequest, NextResponse } from "next/server";
import { resolveSeoContext } from "@/lib/seo";

export async function GET(req: NextRequest) {
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "beamline.musfiqdehan.com";
  const { searchParams } = new URL(req.url);
  const tenantParam = searchParams.get("tenant");
  const seo = await resolveSeoContext(host, tenantParam);

  let text = "";

  if (seo.isPlatform) {
    text = `# BeamLine — Autonomous Construction CRM & Operations OS

> The unified white-label operating system for luxury residential custom home builders, design-build firms, and architectural general contractors.

## Platform Identity
- Platform Name: ${seo.brandName}
- Canonical URL: ${seo.canonicalUrl}
- Primary Purpose: Multi-tenant construction CRM with 4-phase build execution, autonomous invoice deduplication, real-time client milestone dossiers, and Notion OS executive triage.
- Public Asset CDN: https://cdn.musfiqdehan.com/beamline/
- Social Cover: ${seo.ogImageUrl}

## Core Capabilities
1. **White-Label Client Portals**: Each construction tenant operates their own custom branded portal with unique subdomain (\`<tenant>.beamline.musfiqdehan.com\`) or vanity custom domain, complete with custom logo, colorways, and milestone feeds.
2. **4-Phase Construction Execution**:
   - Phase 1: Discovery & Site Feasibility (land analysis, initial budget range, architect onboarding)
   - Phase 2: Pre-Construction Planning & Selections (subcontractor bidding, finish specifications, permits)
   - Phase 3: Active Build & Daily Site Verification (framing, MEP rough-ins, change order tracking, lien waivers)
   - Phase 4: Final Handover & Warranty (as-built documentation, punch list resolution, milestone dossier)
3. **AI Margin Shield & Autonomous Invoicing**: Machine-learning invoice ingestion that intercepts duplicate vendor billings, verifies line-item unit costs against contracted schedules, and protects contractor margins.
4. **Executive Triage & Notion OS Sync**: Bidirectional real-time sync with executive Notion workspaces for schedule milestones, RFIs, and urgent owner decisions.

## Multi-Tenant Access
Builders can provision their private tenant workspace or manage client portfolios through the administrative suite at ${seo.canonicalUrl}admin.
`;
  } else {
    text = `# ${seo.brandName} — Private Client Construction Portal

> Luxury residential construction, architectural renovations, and transparent client project management powered by BeamLine Construction OS.

## Builder Identity
- Builder / Organization: ${seo.brandName}
- Portal URL: ${seo.canonicalUrl}
- Overview: ${seo.description}
- Social Cover: ${seo.ogImageUrl}

## Private Client Experience
Clients logged into this private portal gain complete visibility into their custom home build:
1. **Milestone Schedule**: View live gantt milestones and projected inspection dates.
2. **Selections & Approvals**: Review and approve architectural finishes, appliances, and fixtures in real time.
3. **Change Order Transparency**: Inspect itemized change orders, scope adjustments, and budget variances before signature.
4. **Daily Site Updates**: High-resolution progress logs, subcontractor check-ins, and inspection reports delivered securely via Cloudflare R2 media CDN.

## Secure Access
Authorized clients and project managers can authenticate directly at ${seo.canonicalUrl}.
`;
  }

  return new NextResponse(text, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

