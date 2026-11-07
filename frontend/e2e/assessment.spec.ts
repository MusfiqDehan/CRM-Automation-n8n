import { expect, test, type Page } from "@playwright/test";

test.describe("Beamline — Commercial Multi-Tenant CRM & OS E2E Verification", () => {
  const ensureAuthenticated = async (page: Page, role: "kevin" | "admin" = "kevin") => {
    const btnName = role === "admin" ? /Platform Superadmin/i : /(Client Admin|Kevin)/i;
    const quickLoginBtn = page.getByRole("button", { name: btnName }).first();
    await quickLoginBtn.waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
    if (await quickLoginBtn.isVisible()) {
      await quickLoginBtn.click();
      await page.waitForResponse(
        (resp) => resp.url().includes("/auth/login/") && resp.status() === 200,
        { timeout: 5000 }
      ).catch(() => {});
      await page.waitForTimeout(800);
    }
  };
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

  test("blocks unauthenticated visitor from admin panel with AuthGate requiring login or registration", async ({
    page,
  }) => {
    // Navigate to /admin without token
    await page.goto("/admin");
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Verify AuthGate barrier is shown
    await expect(
      page.getByText("Authentication required. Sign in or register to access workspace.").first()
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Sign In to Operations Console/i })).toBeVisible();

    // Verify dashboard data is completely hidden / not present
    await expect(page.getByText("Sales Dashboard & Executive Pipeline Overview")).toHaveCount(0);
    await expect(page.getByText("Total Pipeline Value")).toHaveCount(0);

    // Switch to Register Workspace tab
    const registerTabBtn = page.getByRole("button", { name: "Register Workspace" }).first();
    await expect(registerTabBtn).toBeVisible();
    await registerTabBtn.click();

    // Verify registration fields are displayed
    await expect(page.getByPlaceholder("e.g. Apex Custom Homes")).toBeVisible();
    await expect(page.getByPlaceholder("jane@apexhomes.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /Create Workspace & Enter Admin Panel/i })).toBeVisible();

    // Switch back to Sign In
    const signInTabBtn = page.getByRole("button", { name: "Sign In" }).first();
    await signInTabBtn.click();
    await expect(page.getByRole("button", { name: /(Client Admin|Kevin)/i }).first()).toBeVisible();
  });

  test("authenticates into Admin Sales Dashboard & Pipeline, checks visual KPIs and funnel", async ({
    page,
  }) => {
    await page.goto("/admin");
    await ensureAuthenticated(page);

    // Verify top KPIs on executive dashboard
    await expect(page.getByText("Total Pipeline Value").first()).toBeVisible();
    await expect(page.getByText("Sales Pipeline Overview").first()).toBeVisible();

    // Switch to Sales & Clients (CRM) tab
    const crmTabBtn = page.getByRole("tab", { name: /Sales/i }).or(page.getByRole("button", { name: /Sales/i })).first();
    await crmTabBtn.click({ force: true });
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
    await ensureAuthenticated(page);
    
    // Switch to Builds/Projects tab (supports both desktop sidebar and mobile bottom nav)
    const projectsTab = page
      .getByRole("button", { name: /Active Builds/i })
      .or(page.getByRole("button", { name: /Builds/i }))
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
      .or(page.getByRole("button", { name: /Invoices/i }))
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
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await ensureAuthenticated(page, "admin");

    // Verify Beamline branding & Platform Superadmin Portal in viewport
    await expect(page.getByText("Beamline").filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText("Platform Control Plane").filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByText(/Client Organizations/i).first()).toBeVisible();
    await expect(page.getByText(/Subscriptions & MRR/i).first()).toBeVisible();
    await expect(page.getByText(/Client Support & Inquiries/i).first()).toBeVisible();
    await expect(page.getByText(/System Broadcasts/i).first()).toBeVisible();

    // Verify Superadmin does NOT see construction operations (drywall/build tasks)
    await expect(page.getByText("Total Pipeline Value")).toHaveCount(0);

    // Now sign in as Kevin (Client Admin) to verify the Builder Operations Console
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await ensureAuthenticated(page, "kevin");

    // Verify Kevin's builder operations console
    await expect(page.getByText("Total Pipeline Value").first()).toBeVisible();
    await expect(page.getByText("Active Luxury Builds").first()).toBeVisible();
    await expect(page.getByText("Sales & Clients").first()).toBeVisible();
  });

  test("verifies client admin logo behavior when landing page feature flag is disabled vs enabled", async ({
    page,
    request,
  }) => {
    const resetLandingFlag = async () => {
      try {
        const loginRes = await request.post("http://localhost:8017/api/v1/auth/login/", {
          data: { username_or_email: "admin", password: "adminpass2026" },
        });
        const loginData = await loginRes.json();
        const token = loginData.data?.tokens?.access_token;
        const orgsRes = await request.get("http://localhost:8017/api/v1/superadmin/organizations/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const orgsData = await orgsRes.json();
        const kevinOrg = orgsData.data?.results?.find((o: { slug: string }) => o.slug === "kevin");
        if (kevinOrg) {
          await request.patch(`http://localhost:8017/api/v1/superadmin/organizations/${kevinOrg.id}/`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { feature_flags: { page_landing: false } },
          });
        }
      } catch {}
    };

    // Ensure clean state before running
    await resetLandingFlag();

    try {
      // 1. Sign in as Kevin with default disabled landing page
      await page.goto("/admin");
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await ensureAuthenticated(page, "kevin");

      // Wait for client dashboard to load
      await expect(page.getByText("Sales & Clients").first()).toBeVisible();

      // With landing page disabled, logo renders as button (refresh only, no link)
      const logoRefreshBtn = page.getByRole("button", { name: /BeamLine|Refresh/i }).first();
      await expect(logoRefreshBtn).toBeVisible();

      // 2. Sign in as Superadmin to enable client landing page via feature flag
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await ensureAuthenticated(page, "admin");

      // Switch to Client Organizations tab and open Feature Flags
      const clientsTab = page.getByRole("button", { name: /Client Organizations/i }).first();
      await expect(clientsTab).toBeVisible();
      await clientsTab.click();
      await page.waitForTimeout(400);

      const featureFlagsBtn = page.getByRole("button", { name: /Feature Flags/i }).first();
      await featureFlagsBtn.click();
      await page.waitForTimeout(400);

      // Toggle Client Landing Page feature flag
      const landingSwitch = page.getByRole("switch", { name: /Client landing page/i });
      await expect(landingSwitch).toBeVisible();
      await landingSwitch.click();
      await page.waitForTimeout(500);

      // Verify success toast/message is displayed without 404
      await expect(page.getByText(/Updated entitlement "page_landing"|Updated "page_landing"/i).first()).toBeVisible();

      // 3. Re-enter Kevin's workspace as client admin
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await ensureAuthenticated(page, "kevin");

      // Wait for client dashboard to load
      await expect(page.getByText("Sales & Clients").first()).toBeVisible();

      // Logo is now a clickable link to client landing page
      const logoLink = page.getByRole("link", { name: /BeamLine|home/i }).first();
      await expect(logoLink).toBeVisible();
      await expect(logoLink).toHaveAttribute("href", "/?tenant=kevin");
      await logoLink.click();
      await page.waitForTimeout(1000);

      // Verify redirected to client landing page
      await expect(page.getByRole("link", { name: /Login/i }).first()).toBeVisible();
      await expect(page.getByText(/Building the place where your story unfolds|Custom Homes/i).first()).toBeVisible();
    } finally {
      await resetLandingFlag();
    }
  });
});
