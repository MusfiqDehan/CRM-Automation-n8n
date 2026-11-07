import { describe, expect, it } from "bun:test";
import { isPlatformApex, resolveSeoContext } from "../seo";

describe("SEO & Branding Context Resolver", () => {
  it("correctly identifies platform apex domains", () => {
    expect(isPlatformApex("beamline.musfiqdehan.com")).toBe(true);
    expect(isPlatformApex("www.beamline.musfiqdehan.com")).toBe(true);
    expect(isPlatformApex("localhost:3017")).toBe(true);
    expect(isPlatformApex("127.0.0.1:3017")).toBe(true);
  });

  it("correctly identifies tenant subdomains and custom domains", () => {
    expect(isPlatformApex("kevin.beamline.musfiqdehan.com")).toBe(false);
    expect(isPlatformApex("kevin.localhost:3017")).toBe(false);
    expect(isPlatformApex("kevinbuilds.com")).toBe(false);
  });

  it("respects explicit tenant query parameter as tenant workspace", () => {
    expect(isPlatformApex("beamline.musfiqdehan.com", "kevin")).toBe(false);
    expect(isPlatformApex("localhost:3017", "custom-builder")).toBe(false);
  });

  it("resolves platform default SEO context when backend is unreachable or returns null", async () => {
    const seo = await resolveSeoContext("beamline.musfiqdehan.com");
    expect(seo.isPlatform).toBe(true);
    expect(seo.canonicalUrl).toBe("https://beamline.musfiqdehan.com/");
    expect(seo.brandName.toLowerCase()).toBe("beamline");
    expect(seo.title).toContain("BeamLine");
    expect(seo.ogImageUrl).toContain("/api/og?type=platform");
    expect(seo.tenantSlug).toBeNull();
  });

  it("resolves tenant SEO context when inspecting a tenant slug", async () => {
    const seo = await resolveSeoContext("kevin.beamline.musfiqdehan.com");
    expect(seo.isPlatform).toBe(false);
    expect(seo.ogImageUrl).toContain("/api/og?type=tenant");
    expect(seo.ogImageUrl).toContain("kevin");
  });
});

