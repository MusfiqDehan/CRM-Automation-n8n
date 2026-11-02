import { expect, test } from "@playwright/test";

test.describe("Beamline — Commercial Multi-Tenant CRM & OS E2E Verification", () => {
  test("loads Overview Landing Page, verifies executive action items and benefits", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByText("Beamline").first()
    ).toBeVisible();
    await expect(
      page.getByText("Purpose-built for luxury residential builders").first()
    ).toBeVisible();
  });

  test("navigates to Admin Sales Dashboard & Pipeline, checks visual KPIs and funnel", async ({
    page,
  }) => {
    await page.goto("/admin");
    // Verify top KPIs on executive dashboard
    await expect(page.getByText("Total Pipeline Value").first()).toBeVisible();
    await expect(page.getByText("Sales Pipeline Overview").first()).toBeVisible();

    // Switch to Sales & Clients (CRM) tab
    const crmTabBtn = page.getByRole("tab", { name: /Sales/i }).or(page.getByRole("button", { name: /Sales/i })).first();
    await crmTabBtn.click();
    await page.waitForTimeout(500);

    // Verify Executive Pipeline Overview Visual Header and Funnel
    await expect(
      page.getByText("Sales Dashboard & Executive Pipeline Overview").first()
    ).toBeVisible();
    await expect(page.getByText("Total Active Pipeline").first()).toBeVisible();
    await expect(page.getByText("Weighted Revenue (Risk-Adjusted)").first()).toBeVisible();
    await expect(page.getByText("Luxury Home Sales Conversion Funnel").first()).toBeVisible();

    // Verify Deals Table rendered below funnel
    await expect(page.getByText("Deals & Opportunities").first()).toBeVisible();
  });

  test("navigates across Projects and Automation tabs", async ({
    page,
  }) => {
    await page.goto("/admin");
    
    // Switch to Builds/Projects tab (supports both desktop sidebar and mobile bottom nav)
    const projectsTab = page
      .getByRole("button", { name: /Active Builds/i })
      .or(page.getByRole("button", { name: /^Builds$/i }))
      .filter({ visible: true })
      .first();
    await projectsTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(
      page
        .getByRole("heading", { name: /Active Construction Projects/i })
        .filter({ visible: true })
        .first()
    ).toBeVisible();

    // Switch to Invoices/Automation tab (supports desktop and mobile)
    const autoTab = page
      .getByRole("button", { name: /Invoices & Bills/i })
      .or(page.getByRole("button", { name: /^Invoices$/i }))
      .filter({ visible: true })
      .first();
    await autoTab.click({ force: true });
    await page.waitForTimeout(500);
    await expect(
      page
        .getByRole("heading", { name: /Subcontractor Invoices/i })
        .filter({ visible: true })
        .first()
    ).toBeVisible();
  });

  test("verifies Beamline multi-tenant header, tenant settings modal and superadmin control plane", async ({
    page,
  }) => {
    await page.goto("/admin");

    // Verify Beamline branding visible in viewport
    await expect(page.getByText("Beamline").filter({ visible: true }).first()).toBeVisible();

    // Verify Superadmin button exists and opens modal
    const superAdminBtn = page.locator('button[title*="Superadmin"]').filter({ visible: true }).first();
    await expect(superAdminBtn).toBeVisible();
    await superAdminBtn.click();

    // Verify Superadmin modal opened
    await expect(page.getByText("Beamline Platform Superadmin Console").first()).toBeVisible();
    await expect(page.getByText(/Client Directory/i).first()).toBeVisible();
    await expect(page.getByText(/Platform OAuth & Domain/i).first()).toBeVisible();

    // Close Superadmin modal
    const closeSuperAdminBtn = page.locator('div[role="dialog"] button, .fixed button:has(svg.lucide-x)').first();
    if (await closeSuperAdminBtn.isVisible()) {
      await closeSuperAdminBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
    await page.waitForTimeout(400);

    // Verify Org Settings modal opens
    const orgSettingsBtn = page.locator('button[title*="Client Organization Settings"]').filter({ visible: true }).first();
    await expect(orgSettingsBtn).toBeVisible();
    await orgSettingsBtn.click();

    // Verify Org Settings modal elements
    await expect(page.getByText("Client Organization Settings").first()).toBeVisible();
    await expect(page.getByText(/Domains & Branding/i).first()).toBeVisible();
    await expect(page.getByText(/Review Thresholds/i).first()).toBeVisible();
  });
});
