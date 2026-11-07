import type { OAuthPublicConfig } from "./types";

export interface ResolvedSeoContext {
  isPlatform: boolean;
  host: string;
  protocol: string;
  canonicalUrl: string;
  title: string;
  description: string;
  brandName: string;
  logoUrl: string;
  ogImageUrl: string;
  tenantSlug: string | null;
  tenant: OAuthPublicConfig["tenant"];
  publicTenants: NonNullable<OAuthPublicConfig["public_tenants"]>;
}

export async function fetchServerOAuthConfig(
  hostHeader: string,
  tenantParam?: string | null
): Promise<OAuthPublicConfig | null> {
  const backendInternal =
    process.env.BACKEND_INTERNAL_URL || "http://localhost:8017";

  let endpoint = `${backendInternal.replace(/\/+$/, "")}/api/v1/auth/oauth-config/`;
  if (tenantParam) {
    endpoint += `?tenant=${encodeURIComponent(tenantParam)}`;
  }

  try {
    const res = await fetch(endpoint, {
      headers: {
        Host: hostHeader,
        "X-Forwarded-Host": hostHeader,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export function isPlatformApex(host: string, tenantParam?: string | null): boolean {
  if (tenantParam) return false;
  const h = (host || "").toLowerCase().split(":")[0];
  if (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "beamline.musfiqdehan.com" ||
    h === "musfiqdehan.com" ||
    h === "www.beamline.musfiqdehan.com"
  ) {
    return true;
  }
  if (h.includes(".beamline.musfiqdehan.com") || h.includes(".localhost")) {
    const sub = h.split(".")[0];
    if (sub && sub !== "www" && sub !== "app" && sub !== "api" && sub !== "beamline") {
      return false;
    }
    return true;
  }
  return false;
}

export async function resolveSeoContext(
  hostHeader: string,
  searchTenant?: string | null
): Promise<ResolvedSeoContext> {
  const host = hostHeader || "beamline.musfiqdehan.com";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const isApex = isPlatformApex(host, searchTenant);
  const config = await fetchServerOAuthConfig(host, searchTenant);

  const publicTenants = config?.public_tenants || [];
  const tenant = config?.tenant || null;
  
  // Deduce tenant slug if subdomain or search parameter
  let tenantSlug = tenant?.slug || searchTenant || null;
  if (!tenantSlug && !isApex) {
    const parts = host.split(":")[0].split(".");
    if (parts.length > 2) {
      tenantSlug = parts[0];
    }
  }

  if (isApex) {
    const platName = config?.platform_name || "BeamLine";
    const title =
      config?.site_title ||
      `${platName} — Multi-Tenant Construction CRM & Autonomous Operations OS`;
    const description =
      config?.site_description ||
      "White-labeled CRM, 4-phase project execution, autonomous invoice deduplication, and executive triage for high-value custom home builders.";
    const logoUrl =
      config?.logo_url || `${protocol}://${host}/icon.svg`;
    const ogImageUrl =
      config?.social_cover_url ||
      `${protocol}://${host}/api/og?type=platform`;

    return {
      isPlatform: true,
      host,
      protocol,
      canonicalUrl: `${protocol}://${host}/`,
      title,
      description,
      brandName: platName,
      logoUrl,
      ogImageUrl,
      tenantSlug: null,
      tenant: null,
      publicTenants,
    };
  }

  // Tenant Context
  const brandName =
    tenant?.name ||
    (tenantSlug
      ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1) + " Construction"
      : "Custom Residential Builder");
  const title =
    tenant?.site_title ||
    `${brandName} — Private Client Portal & Custom Residential Construction`;
  const description =
    tenant?.site_description ||
    `Follow every milestone, agreement, design selection, and site update from discovery to move-in day with ${brandName}.`;
  const logoUrl =
    tenant?.logo_url || `${protocol}://${host}/icon.svg`;
  const ogImageUrl =
    tenant?.social_cover_url ||
    `${protocol}://${host}/api/og?type=tenant&tenant=${encodeURIComponent(tenantSlug || "tenant")}`;

  return {
    isPlatform: false,
    host,
    protocol,
    canonicalUrl: tenant?.custom_domain
      ? `https://${tenant.custom_domain}/`
      : `${protocol}://${host}/`,
    title,
    description,
    brandName,
    logoUrl,
    ogImageUrl,
    tenantSlug,
    tenant,
    publicTenants,
  };
}
