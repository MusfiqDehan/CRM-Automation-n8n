"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Layers,
  Mail,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";
import { CursorDataTable } from "@/components/common/CursorDataTable";
import { ValidatedModalForm } from "@/components/common/ValidatedModalForm";
import { ActionItemsCenter } from "@/components/dashboard/ActionItemsCenter";
import { LandingOverview } from "@/components/dashboard/LandingOverview";
import { ResourceHub } from "@/components/hub/ResourceHub";
import { type NavTab, Sidebar } from "@/components/layout/Sidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { ApiError, apiClient } from "@/lib/api-client";
import type {
  ConstructionProject,
  Contact,
  DashboardSummary,
  EmailCommunicationLog,
  MaterialOrder,
  Opportunity,
  ProjectCost,
  ProjectTask,
  SalesActivity,
  SimulatorTriggerResponse,
} from "@/lib/types";
import {
  contactSchema,
  customInvoiceSchema,
  opportunitySchema,
  projectSchema,
  validateWithSchema,
} from "@/lib/validations";

function formatCurrency(val: string | number | undefined): string {
  const num = Number(val || 0);
  if (Number.isNaN(num)) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(num);
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(true);
  const [syncingNotion, setSyncingNotion] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // Simulator state
  const [runningScenario, setRunningScenario] = useState<string | null>(null);
  const [lastSimulation, setLastSimulation] =
    useState<SimulatorTriggerResponse | null>(null);
  const [demoPacing, setDemoPacing] = useState<"instant" | "guided">("guided");
  const [guidedStepIndex, setGuidedStepIndex] = useState<number>(-1);

  // Modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isOpportunityModalOpen, setIsOpportunityModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCustomInvoiceModalOpen, setIsCustomInvoiceModalOpen] =
    useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [generalModalError, setGeneralModalError] = useState<string | null>(
    null
  );
  const [submittingForm, setSubmittingForm] = useState(false);

  // Form states
  const [contactForm, setContactForm] = useState({
    name: "",
    contact_type: "Prospective Client",
    email: "",
    phone: "",
    company_or_household: "",
    preferred_channel: "Email",
    referral_source: "",
    enquiry_summary: "",
  });

  const [opportunityForm, setOpportunityForm] = useState({
    name: "",
    stage: "2. Qualification",
    sales_owner: "Jordan Blake (Sales Lead)",
    estimated_value: "3250000",
    design_agreement_status: "Not Started",
    construction_agreement_status: "Not Started",
    requires_kevin_review: false,
    kevin_review_notes: "",
    next_follow_up_date: "",
    qualification_notes: "",
  });

  const [projectForm, setProjectForm] = useState({
    code: "PRJ-105",
    name: "",
    phase: "Pre-Construction",
    status: "On Track",
    project_manager: "Marcus Vance (Lead PM)",
    site_address: "",
    contract_budget: "3500000",
    start_date: "",
    target_completion_date: "",
    progress_percent: "10",
    latest_update: "",
  });

  const [customInvoiceForm, setCustomInvoiceForm] = useState({
    supplier: "Golden Gate Structural Steel",
    document_reference: "INV-2026-850",
    project_reference: "PRJ-101 Oakridge Estate",
    amount: "29400.00",
    currency: "USD",
    payment_status: "Unpaid",
    email_sender: "billing@ggsteel.com",
    days_until_due: "14",
    description: "Custom roof ridge beam & crane rigging package",
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 5000);
  };

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const data = await apiClient.get<DashboardSummary>("/dashboard/summary/");
      setSummary(data);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to load dashboard metrics.",
        "error"
      );
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary, refreshCounter]);

  const handleProvisionNotion = async () => {
    setSyncingNotion(true);
    try {
      const res = await apiClient.post("/notion/provision/");
      showToast(res.message, "success");
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to sync Notion workspace.",
        "error"
      );
    } finally {
      setSyncingNotion(false);
    }
  };

  const handleRunScenario = async (scenarioKey: string) => {
    setRunningScenario(scenarioKey);
    setGuidedStepIndex(demoPacing === "guided" ? 0 : -1);
    try {
      const wait = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      if (demoPacing === "guided") {
        setGuidedStepIndex(0); // Inbound Webhook & PDF Ingestion
        await wait(1100);
        setGuidedStepIndex(1); // AI Extraction
        await wait(1100);
        setGuidedStepIndex(2); // Project Match & Validation
      }

      const res = await apiClient.post<SimulatorTriggerResponse>(
        "/simulator/trigger/",
        { scenario: scenarioKey }
      );

      if (demoPacing === "guided") {
        setGuidedStepIndex(3); // Notion Sync & DB Commit
        await wait(1100);
        setGuidedStepIndex(4); // Email Alert & Verification
        await wait(900);
      }

      setLastSimulation(res.data);
      showToast(
        `Scenario executed: ${res.data.scenario_label} (${res.data.action_taken})`,
        "success"
      );
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to run simulation.",
        "error"
      );
    } finally {
      setRunningScenario(null);
      setGuidedStepIndex(-1);
    }
  };

  // Form Submit Handlers
  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralModalError(null);
    const validation = validateWithSchema(contactSchema, contactForm);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setSubmittingForm(true);
    try {
      const res = await apiClient.post<Contact>("/contacts/", validation.data);
      showToast(res.message, "success");
      setIsContactModalOpen(false);
      setContactForm({
        name: "",
        contact_type: "Prospective Client",
        email: "",
        phone: "",
        company_or_household: "",
        preferred_channel: "Email",
        referral_source: "",
        enquiry_summary: "",
      });
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        const mappedErrors: Record<string, string> = {};
        Object.entries(err.fieldErrors).forEach(([k, msgs]) => {
          mappedErrors[k] = msgs.join(" ");
        });
        setFormErrors(mappedErrors);
      } else {
        setGeneralModalError(
          err instanceof Error ? err.message : "Could not create contact."
        );
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSubmitOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralModalError(null);
    const validation = validateWithSchema(opportunitySchema, opportunityForm);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setSubmittingForm(true);
    try {
      const res = await apiClient.post<Opportunity>(
        "/opportunities/",
        validation.data
      );
      showToast(res.message, "success");
      setIsOpportunityModalOpen(false);
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        const mappedErrors: Record<string, string> = {};
        Object.entries(err.fieldErrors).forEach(([k, msgs]) => {
          mappedErrors[k] = msgs.join(" ");
        });
        setFormErrors(mappedErrors);
      } else {
        setGeneralModalError(
          err instanceof Error ? err.message : "Could not create opportunity."
        );
      }
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralModalError(null);
    const validation = validateWithSchema(projectSchema, projectForm);
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setSubmittingForm(true);
    try {
      const payload = {
        ...validation.data,
        contract_budget: validation.data.contract_budget,
        progress_percent: validation.data.progress_percent,
      };
      const res = await apiClient.post<ConstructionProject>(
        "/projects/",
        payload
      );
      showToast(res.message, "success");
      setIsProjectModalOpen(false);
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      setGeneralModalError(
        err instanceof Error ? err.message : "Could not create project."
      );
    } finally {
      setSubmittingForm(false);
    }
  };

  const handleSubmitCustomInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralModalError(null);
    const validation = validateWithSchema(
      customInvoiceSchema,
      customInvoiceForm
    );
    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }
    setSubmittingForm(true);
    try {
      const res = await apiClient.post<SimulatorTriggerResponse>(
        "/simulator/trigger/",
        {
          scenario: "custom",
          custom: validation.data,
        }
      );
      setLastSimulation(res.data);
      setIsCustomInvoiceModalOpen(false);
      showToast(
        `Custom invoice ${res.data.cost_record.document_reference} processed (${res.data.action_taken})!`,
        "success"
      );
      setRefreshCounter((c) => c + 1);
    } catch (err) {
      setGeneralModalError(
        err instanceof Error ? err.message : "Failed to process custom invoice."
      );
    } finally {
      setSubmittingForm(false);
    }
  };

  const notionCfg = summary?.notion_workspace;
  const apiBase = apiClient.getBaseUrl();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-md px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium transition-all ${
            toastMessage.type === "error"
              ? "bg-red-950/95 border-red-700 text-red-200"
              : "bg-emerald-950/95 border-emerald-700 text-emerald-200"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Admin Panel Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        summary={summary}
        syncingNotion={syncingNotion}
        onSyncNotion={handleProvisionNotion}
      />

      {/* Main Content Workspace (Offset by Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Header Bar */}
        <TopHeader
          activeTab={activeTab}
          onOpenMobile={() => setIsMobileMenuOpen(true)}
          summary={summary}
          onOpenContactModal={() => {
            setFormErrors({});
            setGeneralModalError(null);
            setIsContactModalOpen(true);
          }}
          onOpenOpportunityModal={() => {
            setFormErrors({});
            setGeneralModalError(null);
            setIsOpportunityModalOpen(true);
          }}
          onOpenProjectModal={() => {
            setFormErrors({});
            setGeneralModalError(null);
            setIsProjectModalOpen(true);
          }}
          onOpenCustomInvoiceModal={() => {
            setFormErrors({});
            setGeneralModalError(null);
            setIsCustomInvoiceModalOpen(true);
          }}
          syncingNotion={syncingNotion}
          onSyncNotion={handleProvisionNotion}
        />

        {/* Content Body */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {/* TAB 1: OVERVIEW & PLATFORM BENEFITS (LANDING PAGE) */}
          {activeTab === "overview" && (
            <LandingOverview
              summary={summary}
              loading={loadingSummary}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenContactModal={() => {
                setFormErrors({});
                setGeneralModalError(null);
                setIsContactModalOpen(true);
              }}
              onOpenOpportunityModal={() => {
                setFormErrors({});
                setGeneralModalError(null);
                setIsOpportunityModalOpen(true);
              }}
              onOpenProjectModal={() => {
                setFormErrors({});
                setGeneralModalError(null);
                setIsProjectModalOpen(true);
              }}
              onOpenCustomInvoiceModal={() => {
                setFormErrors({});
                setGeneralModalError(null);
                setIsCustomInvoiceModalOpen(true);
              }}
              onSyncNotion={handleProvisionNotion}
              syncingNotion={syncingNotion}
              apiBase={apiBase}
            />
          )}

          {/* TAB 2: SALES PIPELINE & CLIENT CRM */}
          {activeTab === "crm" && (
            <div className="space-y-6 pb-12">
              {/* Pipeline Stage Breakdown Cards */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white">
                      Sales Pipeline Stage Breakdown
                    </h2>
                    <p className="text-xs text-slate-400">
                      Tracking high-touch client inquiries from initial qualification through design &amp; construction agreements
                    </p>
                  </div>
                  {notionCfg?.sales_dashboard_url && (
                    <a
                      href={notionCfg.sales_dashboard_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
                    >
                      <span>Open Live Notion Sales Board</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(summary?.stages_breakdown || []).map((st) => (
                    <div
                      key={st.stage}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/90 flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-blue-300">
                        {st.stage}
                      </span>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(st.total_value)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {st.count} deal(s)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table 1: Sales Pipeline (Opportunities) */}
              <CursorDataTable<Opportunity>
                title="Sales Pipeline — Opportunities (CRM)"
                subtitle="Manages custom home deals across Qualification -> Design Agreement -> Construction Agreement with 'Requires Kevin's Review' escalation"
                endpoint="/opportunities/"
                notionDbUrl={notionCfg?.opportunities_db_url}
                refreshTrigger={refreshCounter}
                onAddClick={() => {
                  setFormErrors({});
                  setGeneralModalError(null);
                  setIsOpportunityModalOpen(true);
                }}
                addButtonLabel="New Opportunity"
                searchPlaceholder="Search deals, owners, review notes..."
                filters={[
                  {
                    key: "stage",
                    label: "Stages",
                    options: [
                      { label: "1. New Enquiry", value: "1. New Enquiry" },
                      { label: "2. Qualification", value: "2. Qualification" },
                      {
                        label: "3. Design Agreement",
                        value: "3. Design Agreement",
                      },
                      {
                        label: "4. Construction Agreement",
                        value: "4. Construction Agreement",
                      },
                      {
                        label: "5. Won — Handed to Ops",
                        value: "5. Won — Handed to Ops",
                      },
                    ],
                  },
                  {
                    key: "requires_kevin_review",
                    label: "Kevin Review Status",
                    options: [
                      { label: "Requires Kevin's Review", value: "true" },
                      { label: "Standard (No Escalation)", value: "false" },
                    ],
                  },
                ]}
                sortOptions={[
                  { label: "Newest First", value: "-created_at" },
                  { label: "Value: High to Low", value: "-estimated_value" },
                  { label: "Next Follow-Up", value: "next_follow_up_date" },
                ]}
                columns={[
                  {
                    key: "name",
                    header: "Opportunity & Client",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">{row.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Client: {row.contact_name || "Unassigned"} • Owner:{" "}
                          {row.sales_owner}
                        </div>
                        {row.project_code && (
                          <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Linked Project: {row.project_code}
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "stage",
                    header: "Pipeline Stage & Agreements",
                    render: (row) => (
                      <div className="space-y-1">
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {row.stage}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Design: {row.design_agreement_status} | Build:{" "}
                          {row.construction_agreement_status}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "value",
                    header: "Est. Value & Follow-Up",
                    render: (row) => (
                      <div>
                        <div className="font-bold text-emerald-300">
                          {formatCurrency(row.estimated_value)}
                        </div>
                        <div className="text-xs text-slate-400">
                          Follow-up: {row.next_follow_up_date || "TBD"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "review",
                    header: "Kevin's Review Queue",
                    render: (row) => (
                      <div>
                        {row.requires_kevin_review ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <AlertTriangle className="w-3 h-3" />
                            Needs Kevin&apos;s Review
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Owned by Sales Lead
                          </span>
                        )}
                        {row.kevin_review_notes && (
                          <p className="text-xs text-slate-300 mt-1 max-w-xs">
                            {row.kevin_review_notes}
                          </p>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "notion",
                    header: "Notion Link",
                    render: (row) =>
                      row.notion_url ? (
                        <a
                          href={row.notion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <span>View in Notion</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Local</span>
                      ),
                  },
                ]}
              />

              {/* Table 2: Contacts & Enquiries */}
              <CursorDataTable<Contact>
                title="Contacts & Enquiries (CRM)"
                subtitle="Centralizes referral enquiries arriving via phone, text, email, and architect partners"
                endpoint="/contacts/"
                notionDbUrl={notionCfg?.contacts_db_url}
                refreshTrigger={refreshCounter}
                onAddClick={() => {
                  setFormErrors({});
                  setGeneralModalError(null);
                  setIsContactModalOpen(true);
                }}
                addButtonLabel="New Contact / Enquiry"
                searchPlaceholder="Search contacts by name, email, referral source..."
                filters={[
                  {
                    key: "contact_type",
                    label: "Contact Types",
                    options: [
                      {
                        label: "Prospective Client",
                        value: "Prospective Client",
                      },
                      { label: "Active Client", value: "Active Client" },
                      {
                        label: "Referral Partner / Architect",
                        value: "Referral Partner / Architect",
                      },
                    ],
                  },
                  {
                    key: "preferred_channel",
                    label: "Channels",
                    options: [
                      { label: "Phone Call", value: "Phone Call" },
                      { label: "Email", value: "Email" },
                      { label: "SMS / Text", value: "SMS / Text" },
                      {
                        label: "Ressio Client Portal",
                        value: "Ressio Client Portal",
                      },
                    ],
                  },
                ]}
                sortOptions={[
                  { label: "Newest First", value: "-created_at" },
                  { label: "Name (A-Z)", value: "name" },
                ]}
                columns={[
                  {
                    key: "name",
                    header: "Contact & Household",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">{row.name}</div>
                        <div className="text-xs text-slate-400">
                          {row.company_or_household || row.contact_type}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "comms",
                    header: "Email, Phone & Channel",
                    render: (row) => (
                      <div className="text-xs space-y-0.5">
                        <div className="text-slate-200">{row.email}</div>
                        <div className="text-slate-400">
                          {row.phone} • Prefers: {row.preferred_channel}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "referral",
                    header: "Referral Source & Enquiry Summary",
                    render: (row) => (
                      <div className="max-w-md">
                        <div className="text-xs font-medium text-blue-300">
                          Source: {row.referral_source || "Direct"}
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {row.enquiry_summary}
                        </p>
                      </div>
                    ),
                  },
                  {
                    key: "notion",
                    header: "Notion",
                    render: (row) =>
                      row.notion_url ? (
                        <a
                          href={row.notion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <span>Notion Page</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Local</span>
                      ),
                  },
                ]}
              />

              {/* Table 3: Sales Activities & Touchpoints */}
              <CursorDataTable<SalesActivity>
                title="Sales Activities & Client Touchpoints"
                subtitle="Logs calls, meetings, site visits, and design consultations linked to deals"
                endpoint="/activities/"
                notionDbUrl={notionCfg?.activities_db_url}
                refreshTrigger={refreshCounter}
                searchPlaceholder="Search meetings, calls, notes..."
                filters={[
                  {
                    key: "activity_type",
                    label: "Activity Types",
                    options: [
                      { label: "Meeting", value: "Meeting" },
                      { label: "Phone Call", value: "Phone Call" },
                      { label: "Email", value: "Email" },
                      { label: "Site Visit", value: "Site Visit" },
                      {
                        label: "Design Review Consultation",
                        value: "Design Review Consultation",
                      },
                    ],
                  },
                  {
                    key: "completed",
                    label: "Completion",
                    options: [
                      { label: "Completed", value: "true" },
                      { label: "Pending", value: "false" },
                    ],
                  },
                ]}
                columns={[
                  {
                    key: "title",
                    header: "Activity & Owner",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">{row.title}</div>
                        <div className="text-xs text-slate-400">
                          Owner: {row.owner} • Type: {row.activity_type}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "opp",
                    header: "Opportunity & Client",
                    render: (row) => (
                      <div className="text-xs">
                        <div className="font-medium text-blue-300">
                          {row.opportunity_name}
                        </div>
                        <div className="text-slate-400">{row.contact_name}</div>
                      </div>
                    ),
                  },
                  {
                    key: "timing",
                    header: "Timing & Status",
                    render: (row) => (
                      <div className="text-xs">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            row.completed
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {row.completed ? "Completed" : "Scheduled"}
                        </span>
                        <div className="text-slate-400 mt-0.5">
                          {row.activity_date}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "notes",
                    header: "Outcome Notes",
                    render: (row) => (
                      <div className="text-xs text-slate-300 max-w-sm">
                        {row.outcome_notes || "No notes logged."}
                      </div>
                    ),
                  },
                  {
                    key: "notion",
                    header: "Notion",
                    render: (row) =>
                      row.notion_url ? (
                        <a
                          href={row.notion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <span>Notion</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Local</span>
                      ),
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 3: ACTIVE CONSTRUCTION PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-6 pb-12">
              {/* 4-Phase Lifecycle Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  {
                    phase: "Pre-Construction",
                    desc: "Permits, geotechnical soils, architectural selections & Ressio baseline schedule",
                  },
                  {
                    phase: "Construction",
                    desc: "Site grading, foundation, structural framing, rough MEP & city inspections",
                  },
                  {
                    phase: "Closeout",
                    desc: "Final punchlist walkthrough, Certificate of Occupancy & client orientation",
                  },
                  {
                    phase: "Warranty",
                    desc: "Post-handover 30-day & 11-month walkthroughs and service log",
                  },
                ].map((item, i) => (
                  <div
                    key={item.phase}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800"
                  >
                    <div className="text-xs font-semibold text-emerald-400">
                      Phase {i + 1}: {item.phase}
                    </div>
                    <p className="text-xs text-slate-300 mt-1.5">{item.desc}</p>
                  </div>
                ))}
              </div>

              {/* Table 4: Construction Projects */}
              <CursorDataTable<ConstructionProject>
                title="Construction Projects (Reusable 4-Phase Template)"
                subtitle="Each project page in Notion is provisioned with reusable Pre-Construction, Construction, Closeout, and Warranty checklists"
                endpoint="/projects/"
                notionDbUrl={notionCfg?.projects_db_url}
                refreshTrigger={refreshCounter}
                onAddClick={() => {
                  setFormErrors({});
                  setGeneralModalError(null);
                  setIsProjectModalOpen(true);
                }}
                addButtonLabel="New Construction Project"
                searchPlaceholder="Search by code (PRJ-101), name, PM, address..."
                filters={[
                  {
                    key: "phase",
                    label: "Phases",
                    options: [
                      { label: "Pre-Construction", value: "Pre-Construction" },
                      { label: "Construction", value: "Construction" },
                      { label: "Closeout", value: "Closeout" },
                      { label: "Warranty", value: "Warranty" },
                    ],
                  },
                  {
                    key: "status",
                    label: "Project Status",
                    options: [
                      { label: "On Track", value: "On Track" },
                      { label: "At Risk", value: "At Risk" },
                      { label: "Delayed", value: "Delayed" },
                      { label: "Completed", value: "Completed" },
                    ],
                  },
                ]}
                sortOptions={[
                  { label: "Project Code", value: "code" },
                  { label: "Budget: High to Low", value: "-contract_budget" },
                ]}
                columns={[
                  {
                    key: "name",
                    header: "Project Code & Name",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">
                          <span className="text-emerald-400 mr-1.5">
                            {row.code}
                          </span>
                          {row.name}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          PM: {row.project_manager} • {row.site_address}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "phase",
                    header: "Lifecycle Phase & Status",
                    render: (row) => (
                      <div className="space-y-1">
                        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {row.phase}
                        </span>
                        <div className="text-xs text-slate-300">
                          Status: {row.status} ({row.progress_percent}%)
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "budget",
                    header: "Contract Budget & Progress",
                    render: (row) => (
                      <div>
                        <div className="font-bold text-white">
                          {formatCurrency(row.contract_budget)}
                        </div>
                        <div className="w-28 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, row.progress_percent)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "dates",
                    header: "Schedule & Tasks",
                    render: (row) => (
                      <div className="text-xs text-slate-400 space-y-0.5">
                        <div>Target: {row.target_completion_date || "TBD"}</div>
                        <div className="text-slate-300 font-medium">
                          {row.tasks_count} tasks • {row.costs_count} costs
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "notion",
                    header: "Notion Page",
                    render: (row) =>
                      row.notion_url ? (
                        <a
                          href={row.notion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <span>Open Project</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Local</span>
                      ),
                  },
                ]}
              />

              {/* Table 5: Project Tasks */}
              <CursorDataTable<ProjectTask>
                title="Project Tasks & Milestones"
                subtitle="Reusable milestone checklists provisioned under each construction phase in Notion"
                endpoint="/tasks/"
                notionDbUrl={notionCfg?.tasks_db_url}
                refreshTrigger={refreshCounter}
                searchPlaceholder="Search tasks, project codes, assigned PM..."
                filters={[
                  {
                    key: "phase",
                    label: "Phases",
                    options: [
                      { label: "Pre-Construction", value: "Pre-Construction" },
                      { label: "Construction", value: "Construction" },
                      { label: "Closeout", value: "Closeout" },
                      { label: "Warranty", value: "Warranty" },
                    ],
                  },
                  {
                    key: "priority",
                    label: "Priority",
                    options: [
                      { label: "High", value: "High" },
                      { label: "Medium", value: "Medium" },
                      { label: "Low", value: "Low" },
                    ],
                  },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { label: "In Progress", value: "In Progress" },
                      { label: "Not Started", value: "Not Started" },
                      { label: "Blocked", value: "Blocked" },
                      { label: "Done", value: "Done" },
                    ],
                  },
                ]}
                columns={[
                  {
                    key: "title",
                    header: "Task & Project",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">{row.title}</div>
                        <div className="text-xs text-slate-400">
                          {row.project_code} • {row.project_name}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "phase",
                    header: "Phase & Assigned To",
                    render: (row) => (
                      <div className="text-xs space-y-0.5">
                        <span className="text-emerald-300 font-medium">
                          {row.phase}
                        </span>
                        <div className="text-slate-400">{row.assigned_to}</div>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Priority & Status",
                    render: (row) => (
                      <div className="text-xs space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.priority === "High"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {row.priority} Priority
                        </span>
                        <div className="text-slate-400">{row.status}</div>
                      </div>
                    ),
                  },
                  {
                    key: "deadline",
                    header: "Deadline & Updates",
                    render: (row) => (
                      <div className="text-xs text-slate-400 max-w-xs">
                        <div>Deadline: {row.deadline || "TBD"}</div>
                        <div className="text-slate-300 truncate">
                          {row.progress_updates || "No recent updates"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "notion",
                    header: "Notion",
                    render: (row) =>
                      row.notion_url ? (
                        <a
                          href={row.notion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <span>Notion</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Local</span>
                      ),
                  },
                ]}
              />

              {/* Table 6: Material Orders */}
              <CursorDataTable<MaterialOrder>
                title="Material Orders & Site Procurement"
                subtitle="Tracks high-lead-time luxury residential orders like structural steel, custom millwork, and glazing packages"
                endpoint="/material-orders/"
                notionDbUrl={notionCfg?.materials_db_url}
                refreshTrigger={refreshCounter}
                searchPlaceholder="Search materials, suppliers, order ref..."
                filters={[
                  {
                    key: "status",
                    label: "Order Status",
                    options: [
                      { label: "Delivered", value: "Delivered" },
                      { label: "Ordered", value: "Ordered" },
                      { label: "Delayed", value: "Delayed" },
                      { label: "Received", value: "Received" },
                    ],
                  },
                ]}
                columns={[
                  {
                    key: "item",
                    header: "Item & Supplier",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">
                          {row.item_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Supplier: {row.supplier} • Ref: {row.order_reference}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "project",
                    header: "Project",
                    render: (row) => (
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-400">
                          {row.project_code}
                        </span>
                        <div className="text-slate-400">{row.project_name}</div>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Status & Delivery",
                    render: (row) => (
                      <div className="text-xs space-y-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            row.status === "Delayed"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {row.status}
                        </span>
                        <div className="text-slate-400">
                          Expected: {row.expected_delivery_date || "TBD"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "cost",
                    header: "Unit Cost & Quantities",
                    render: (row) => (
                      <div className="text-xs">
                        <div className="font-bold text-white">
                          {formatCurrency(row.unit_cost_total)}
                        </div>
                        <div className="text-slate-400">
                          {row.quantity_description}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "notion",
                    header: "Notion",
                    render: (row) =>
                      row.notion_url ? (
                        <a
                          href={row.notion_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                        >
                          <span>Notion</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">Local</span>
                      ),
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 4: AUTOMATED INVOICES & COST MANAGEMENT */}
          {activeTab === "automation" && (
            <div className="space-y-6 pb-12">
              {/* Live Test Bench Card */}
              <div className="bg-gradient-to-br from-purple-950/50 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <h2 className="text-base sm:text-lg font-bold text-white">
                        Live AI Invoice Processing Test Bench &amp; Automation Engine
                      </h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      Click any scenario below to generate a real PDF invoice/receipt, trigger the{" "}
                      <strong>n8n workflow</strong> + extraction engine, link the
                      cost to Notion, test duplicate prevention &amp; in-place
                      status updates, and dispatch stakeholder email alerts.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setDemoPacing("instant")}
                        className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          demoPacing === "instant"
                            ? "bg-slate-800 text-cyan-400 font-semibold"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        ⚡ Instant
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoPacing("guided")}
                        className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          demoPacing === "guided"
                            ? "bg-purple-600/30 text-purple-300 font-semibold border border-purple-500/40"
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        🎬 Guided Mode (Visual Flow)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setFormErrors({});
                        setGeneralModalError(null);
                        setIsCustomInvoiceModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow transition cursor-pointer shrink-0"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Send Custom Vendor Invoice</span>
                    </button>
                  </div>
                </div>

                {/* Guided Slow-Motion Live Stepper */}
                {runningScenario && guidedStepIndex >= 0 && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-purple-500/50 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                        Executing Workflow in Guided Mode...
                      </span>
                      <span className="font-mono text-slate-400">
                        Step {guidedStepIndex + 1} of 5
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      {[
                        {
                          num: 1,
                          title: "1. Webhook & PDF",
                          desc: "Ingesting email & attachment",
                        },
                        {
                          num: 2,
                          title: "2. AI Extraction",
                          desc: "Parsing invoice & cost code",
                        },
                        {
                          num: 3,
                          title: "3. Project Matching",
                          desc: "Postgres & duplicate check",
                        },
                        {
                          num: 4,
                          title: "4. Notion Live Sync",
                          desc: "Writing to Construction OS",
                        },
                        {
                          num: 5,
                          title: "5. Notification Alert",
                          desc: "Audited email dispatched",
                        },
                      ].map((step, idx) => {
                        const isDone = guidedStepIndex > idx;
                        const isCurrent = guidedStepIndex === idx;
                        return (
                          <div
                            key={step.num}
                            className={`p-2.5 rounded-lg border text-xs transition-all ${
                              isDone
                                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                                : isCurrent
                                ? "bg-purple-950/60 border-purple-400 text-white shadow-lg shadow-purple-500/20 scale-[1.02]"
                                : "bg-slate-900/40 border-slate-800 text-slate-500"
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold mb-1">
                              <span>{step.title}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : isCurrent ? (
                                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                              ) : (
                                <span className="text-[10px] text-slate-600">
                                  Pending
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] opacity-80">{step.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5 One-Click Scenario Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                  {[
                    {
                      key: "1_unpaid_invoice",
                      step: "Scenario 1",
                      title: "New Unpaid Invoice",
                      desc: "Sierra HVAC • INV-2026-501 • $18,500 Unpaid • Links to PRJ-101",
                      badge: "Creates Record",
                    },
                    {
                      key: "2_paid_receipt",
                      step: "Scenario 2",
                      title: "New Paid Receipt",
                      desc: "Cascade Millwork • REC-2026-602 • $14,200 Paid • Links to PRJ-102",
                      badge: "Creates Paid",
                    },
                    {
                      key: "3_duplicate_submission",
                      step: "Scenario 3",
                      title: "Duplicate Resend",
                      desc: "Re-sends INV-2026-501 ($18,500 Unpaid) • Blocks double-counting",
                      badge: "Skips Duplicate",
                    },
                    {
                      key: "4_status_update_paid",
                      step: "Scenario 4",
                      title: "Update Unpaid -> Paid",
                      desc: "Sends Paid confirmation for INV-2026-501 • Updates in-place",
                      badge: "Updates In-Place",
                    },
                    {
                      key: "5_flagged_clarification",
                      step: "Scenario 5",
                      title: "Ambiguous Receipt",
                      desc: "WestCoast Pumping • INV-2026-999 • Missing PRJ code -> Flagged",
                      badge: "Flags for Review",
                    },
                  ].map((sc) => (
                    <button
                      key={sc.key}
                      type="button"
                      disabled={runningScenario !== null}
                      onClick={() => handleRunScenario(sc.key)}
                      className="p-3.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/60 text-left flex flex-col justify-between transition group cursor-pointer disabled:opacity-50"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-purple-300">
                          <span>{sc.step}</span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30">
                            {sc.badge}
                          </span>
                        </div>
                        <div className="font-semibold text-white text-sm mt-1.5 group-hover:text-purple-200">
                          {sc.title}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{sc.desc}</p>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-medium text-purple-400">
                        <span>
                          {runningScenario === sc.key
                            ? "Running..."
                            : "Run Scenario"}
                        </span>
                        <Play className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Live Execution Trace Output */}
                {lastSimulation && (
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white text-sm">
                          Live Execution Output: {lastSimulation.scenario_label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Action: {lastSimulation.action_taken}
                        </span>
                        {lastSimulation.cost_record.notion_url && (
                          <a
                            href={lastSimulation.cost_record.notion_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
                          >
                            <span>View Synced Cost in Notion</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        <a
                          href={`${apiBase}/docs/sample-invoice/${lastSimulation.cost_record.document_reference}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                        >
                          <span>View PDF Attachment</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-slate-300">
                      <div>
                        <span className="text-slate-500">Supplier:</span>{" "}
                        {lastSimulation.cost_record.supplier}
                      </div>
                      <div>
                        <span className="text-slate-500">Doc Ref:</span>{" "}
                        {lastSimulation.cost_record.document_reference}{" "}
                        (Submissions:{" "}
                        {lastSimulation.cost_record.submission_count})
                      </div>
                      <div>
                        <span className="text-slate-500">Amount &amp; Status:</span>{" "}
                        ${lastSimulation.cost_record.amount}{" "}
                        {lastSimulation.cost_record.currency} (
                        {lastSimulation.cost_record.payment_status})
                      </div>
                      <div>
                        <span className="text-slate-500">Clarification Flag:</span>{" "}
                        {lastSimulation.needs_clarification
                          ? "YES (Flagged for Review)"
                          : "No (Verified Cleanly)"}
                      </div>
                    </div>
                    {lastSimulation.cost_record.clarification_notes && (
                      <p className="text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-500/30">
                        {lastSimulation.cost_record.clarification_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Table 7: Project Costs & Invoices */}
              <CursorDataTable<ProjectCost>
                title="Project Costs & Invoices (Notion + n8n Synced)"
                subtitle="Live cost records ingested via n8n email automation, matched against projects, with duplicate protection"
                endpoint="/costs/"
                notionDbUrl={notionCfg?.costs_db_url}
                refreshTrigger={refreshCounter}
                onAddClick={() => {
                  setFormErrors({});
                  setGeneralModalError(null);
                  setIsCustomInvoiceModalOpen(true);
                }}
                addButtonLabel="Ingest Custom Vendor Invoice"
                searchPlaceholder="Search supplier, doc reference, project..."
                filters={[
                  {
                    key: "payment_status",
                    label: "Payment Status",
                    options: [
                      { label: "Unpaid", value: "Unpaid" },
                      { label: "Paid", value: "Paid" },
                      { label: "Partially Paid", value: "Partially Paid" },
                    ],
                  },
                  {
                    key: "needs_clarification",
                    label: "Clarification Needed",
                    options: [
                      { label: "Needs Clarification", value: "true" },
                      { label: "Clean / Verified", value: "false" },
                    ],
                  },
                ]}
                sortOptions={[
                  { label: "Newest First", value: "-created_at" },
                  { label: "Amount: High to Low", value: "-amount" },
                ]}
                columns={[
                  {
                    key: "supplier",
                    header: "Supplier & Doc Reference",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">
                          {row.supplier}
                        </div>
                        <div className="text-xs text-slate-400">
                          Ref:{" "}
                          <span className="font-mono text-purple-300">
                            {row.document_reference}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Sender: {row.source_email}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "project",
                    header: "Linked Project",
                    render: (row) => (
                      <div className="text-xs">
                        <span className="font-semibold text-emerald-400">
                          {row.project_code || "UNLINKED"}
                        </span>
                        <div className="text-slate-400">{row.project_name}</div>
                      </div>
                    ),
                  },
                  {
                    key: "amount",
                    header: "Amount & Currency",
                    render: (row) => (
                      <div>
                        <div className="font-bold text-white">
                          ${row.amount} {row.currency}
                        </div>
                        <div className="text-xs text-slate-400">
                          Due: {row.payment_due_date || "N/A"}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "status",
                    header: "Payment Status & Submissions",
                    render: (row) => (
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            row.payment_status === "Paid"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {row.payment_status}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Submissions: {row.submission_count}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "clarification",
                    header: "Clarification & Review Flag",
                    render: (row) => (
                      <div>
                        {row.needs_clarification ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <AlertTriangle className="w-3 h-3" />
                            Needs Clarification
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Clean / Matched
                          </span>
                        )}
                        {row.clarification_notes && (
                          <p className="text-xs text-slate-300 mt-1 max-w-xs">
                            {row.clarification_notes}
                          </p>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "notion",
                    header: "Notion & PDF Link",
                    render: (row) => (
                      <div className="text-xs space-y-1">
                        {row.notion_url ? (
                          <a
                            href={row.notion_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            <span>View Notion</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500">Not synced</span>
                        )}
                        {row.supporting_document_url && (
                          <div>
                            <a
                              href={row.supporting_document_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
                            >
                              <span>Attachment</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
              />

              {/* Table 8: Email Logs */}
              <CursorDataTable<EmailCommunicationLog>
                title="Inbound & Outbound Email Automation Logs"
                subtitle="Audited log of PDF invoice attachments received and verification notifications sent by n8n"
                endpoint="/email-logs/"
                refreshTrigger={refreshCounter}
                searchPlaceholder="Search sender, recipient, subject..."
                filters={[
                  {
                    key: "direction",
                    label: "Direction",
                    options: [
                      { label: "Inbound", value: "Inbound" },
                      { label: "Outbound", value: "Outbound" },
                    ],
                  },
                  {
                    key: "status",
                    label: "Status",
                    options: [
                      { label: "Processed", value: "Processed" },
                      { label: "Dispatched", value: "Dispatched" },
                      { label: "Flagged", value: "Flagged" },
                      { label: "Received", value: "Received" },
                    ],
                  },
                ]}
                columns={[
                  {
                    key: "subject",
                    header: "Subject & Preview",
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-white">
                          {row.subject}
                        </div>
                        <div className="text-xs text-slate-400 max-w-md truncate mt-0.5">
                          {row.body_preview}
                        </div>
                        {row.attachment_name && (
                          <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-300">
                            Attachment: {row.attachment_name}
                          </span>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: "parties",
                    header: "Sender & Recipient",
                    render: (row) => (
                      <div className="text-xs space-y-0.5">
                        <div className="text-slate-300">
                          From: {row.sender}
                        </div>
                        <div className="text-slate-400">
                          To: {row.recipient}
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "direction",
                    header: "Direction & Status",
                    render: (row) => (
                      <div className="text-xs space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                            row.direction === "Inbound"
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {row.direction}
                        </span>
                        <div className="text-slate-400">{row.status}</div>
                      </div>
                    ),
                  },
                  {
                    key: "time",
                    header: "Related Cost Ref & Timestamp",
                    render: (row) => (
                      <div className="text-xs text-slate-400">
                        {row.related_cost_ref && (
                          <div className="font-mono text-purple-300">
                            {row.related_cost_ref}
                          </div>
                        )}
                        <div>{new Date(row.created_at).toLocaleString()}</div>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          )}

          {/* TAB 5: RESOURCE HUB & SYSTEM INTEGRATIONS */}
          {activeTab === "resources" && (
            <ResourceHub
              summary={summary}
              apiBase={apiBase}
              onSyncNotion={handleProvisionNotion}
              syncingNotion={syncingNotion}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: NEW CONTACT / ENQUIRY */}
      <ValidatedModalForm
        isOpen={isContactModalOpen}
        title="Add New Contact / Client Enquiry"
        subtitle="Captures referral source, contact details, and initial scope requirements for the CRM pipeline"
        onClose={() => setIsContactModalOpen(false)}
        onSubmit={handleSubmitContact}
        submitLabel="Create Contact"
        submitting={submittingForm}
        generalError={generalModalError}
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={contactForm.name}
              onChange={(e) =>
                setContactForm({ ...contactForm, name: e.target.value })
              }
              placeholder="e.g., Alexandra & David Mercer"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
            />
            {formErrors.name && (
              <p className="text-red-400 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) =>
                  setContactForm({ ...contactForm, email: e.target.value })
                }
                placeholder="client@familyoffice.com"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
              />
              {formErrors.email && (
                <p className="text-red-400 mt-1">{formErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={contactForm.phone}
                onChange={(e) =>
                  setContactForm({ ...contactForm, phone: e.target.value })
                }
                placeholder="+1 (415) 555-0142"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
              />
              {formErrors.phone && (
                <p className="text-red-400 mt-1">{formErrors.phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Contact Type
              </label>
              <select
                value={contactForm.contact_type}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    contact_type: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="Prospective Client">Prospective Client</option>
                <option value="Active Client">Active Client</option>
                <option value="Referral Partner / Architect">
                  Referral Partner / Architect
                </option>
                <option value="Subcontractor / Vendor">
                  Subcontractor / Vendor
                </option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Preferred Channel
              </label>
              <select
                value={contactForm.preferred_channel}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    preferred_channel: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
              >
                <option value="Email">Email</option>
                <option value="Phone Call">Phone Call</option>
                <option value="SMS / Text">SMS / Text</option>
                <option value="Ressio Client Portal">
                  Ressio Client Portal
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Referral Source
            </label>
            <input
              type="text"
              value={contactForm.referral_source}
              onChange={(e) =>
                setContactForm({
                  ...contactForm,
                  referral_source: e.target.value,
                })
              }
              placeholder="e.g., Architect Referral / Past Client"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Initial Enquiry Summary
            </label>
            <textarea
              rows={2}
              value={contactForm.enquiry_summary}
              onChange={(e) =>
                setContactForm({
                  ...contactForm,
                  enquiry_summary: e.target.value,
                })
              }
              placeholder="Lot location, target build budget ($3M+), timeline..."
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-hidden focus:border-blue-500"
            />
          </div>
        </div>
      </ValidatedModalForm>

      {/* MODAL 2: NEW OPPORTUNITY */}
      <ValidatedModalForm
        isOpen={isOpportunityModalOpen}
        title="Add High-Value Opportunity (Deal)"
        subtitle="Creates a pipeline record for qualified custom residential builds ($3M+)"
        onClose={() => setIsOpportunityModalOpen(false)}
        onSubmit={handleSubmitOpportunity}
        submitLabel="Create Opportunity"
        submitting={submittingForm}
        generalError={generalModalError}
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Opportunity Name *
            </label>
            <input
              type="text"
              value={opportunityForm.name}
              onChange={(e) =>
                setOpportunityForm({ ...opportunityForm, name: e.target.value })
              }
              placeholder="e.g., Mercer Modern Hillside Residence ($3.8M)"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            />
            {formErrors.name && (
              <p className="text-red-400 mt-1">{formErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Pipeline Stage
              </label>
              <select
                value={opportunityForm.stage}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    stage: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="1. New Enquiry">1. New Enquiry</option>
                <option value="2. Qualification">2. Qualification</option>
                <option value="3. Design Agreement">3. Design Agreement</option>
                <option value="4. Construction Agreement">
                  4. Construction Agreement
                </option>
                <option value="5. Won — Handed to Ops">
                  5. Won — Handed to Ops
                </option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Sales Owner
              </label>
              <input
                type="text"
                value={opportunityForm.sales_owner}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    sales_owner: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Estimated Contract Value ($ USD) *
              </label>
              <input
                type="number"
                value={opportunityForm.estimated_value}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    estimated_value: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.estimated_value && (
                <p className="text-red-400 mt-1">
                  {formErrors.estimated_value}
                </p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Next Follow-Up Date
              </label>
              <input
                type="date"
                value={opportunityForm.next_follow_up_date}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    next_follow_up_date: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_kevin_review"
                checked={opportunityForm.requires_kevin_review}
                onChange={(e) =>
                  setOpportunityForm({
                    ...opportunityForm,
                    requires_kevin_review: e.target.checked,
                  })
                }
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <label
                htmlFor="requires_kevin_review"
                className="font-medium text-amber-300 text-xs cursor-pointer"
              >
                Requires Kevin&apos;s Review (Escalated to Founder Queue)
              </label>
            </div>
            {opportunityForm.requires_kevin_review && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Review Notes for Kevin
                </label>
                <textarea
                  rows={2}
                  value={opportunityForm.kevin_review_notes}
                  onChange={(e) =>
                    setOpportunityForm({
                      ...opportunityForm,
                      kevin_review_notes: e.target.value,
                    })
                  }
                  placeholder="e.g., Client requested structural cantilever redesign beyond standard variance..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            )}
          </div>
        </div>
      </ValidatedModalForm>

      {/* MODAL 3: NEW CONSTRUCTION PROJECT */}
      <ValidatedModalForm
        isOpen={isProjectModalOpen}
        title="Add New Construction Project"
        subtitle="Initializes a 4-phase project with reusable Notion checklists (Pre-Construction, Construction, Closeout, Warranty)"
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleSubmitProject}
        submitLabel="Create Project"
        submitting={submittingForm}
        generalError={generalModalError}
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Project Code *
              </label>
              <input
                type="text"
                value={projectForm.code}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, code: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.code && (
                <p className="text-red-400 mt-1">{formErrors.code}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={projectForm.name}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, name: e.target.value })
                }
                placeholder="e.g., Oakridge Estate Custom Residence"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.name && (
                <p className="text-red-400 mt-1">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Lifecycle Phase
              </label>
              <select
                value={projectForm.phase}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, phase: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="Pre-Construction">Pre-Construction</option>
                <option value="Construction">Construction</option>
                <option value="Closeout">Closeout</option>
                <option value="Warranty">Warranty</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Project Manager
              </label>
              <input
                type="text"
                value={projectForm.project_manager}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    project_manager: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Site Address *
            </label>
            <input
              type="text"
              value={projectForm.site_address}
              onChange={(e) =>
                setProjectForm({ ...projectForm, site_address: e.target.value })
              }
              placeholder="1288 Oakridge Ridge Rd, Woodside, CA 94062"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            />
            {formErrors.site_address && (
              <p className="text-red-400 mt-1">{formErrors.site_address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Contract Budget ($) *
              </label>
              <input
                type="number"
                value={projectForm.contract_budget}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    contract_budget: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.contract_budget && (
                <p className="text-red-400 mt-1">
                  {formErrors.contract_budget}
                </p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={projectForm.start_date}
                onChange={(e) =>
                  setProjectForm({ ...projectForm, start_date: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Target Completion
              </label>
              <input
                type="date"
                value={projectForm.target_completion_date}
                onChange={(e) =>
                  setProjectForm({
                    ...projectForm,
                    target_completion_date: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>
        </div>
      </ValidatedModalForm>

      {/* MODAL 4: CUSTOM VENDOR INVOICE */}
      <ValidatedModalForm
        isOpen={isCustomInvoiceModalOpen}
        title="Ingest Custom Supplier / Vendor Invoice"
        subtitle="Simulates inbound email PDF parsing, project matching, and Notion cost synchronization"
        onClose={() => setIsCustomInvoiceModalOpen(false)}
        onSubmit={handleSubmitCustomInvoice}
        submitLabel="Send & Process Invoice"
        submitting={submittingForm}
        generalError={generalModalError}
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Supplier / Subcontractor *
              </label>
              <input
                type="text"
                value={customInvoiceForm.supplier}
                onChange={(e) =>
                  setCustomInvoiceForm({
                    ...customInvoiceForm,
                    supplier: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.supplier && (
                <p className="text-red-400 mt-1">{formErrors.supplier}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Document Reference (Invoice #) *
              </label>
              <input
                type="text"
                value={customInvoiceForm.document_reference}
                onChange={(e) =>
                  setCustomInvoiceForm({
                    ...customInvoiceForm,
                    document_reference: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.document_reference && (
                <p className="text-red-400 mt-1">
                  {formErrors.document_reference}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Construction Project Reference *
              </label>
              <input
                type="text"
                value={customInvoiceForm.project_reference}
                onChange={(e) =>
                  setCustomInvoiceForm({
                    ...customInvoiceForm,
                    project_reference: e.target.value,
                  })
                }
                placeholder="PRJ-101 or Unknown"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.project_reference && (
                <p className="text-red-400 mt-1">
                  {formErrors.project_reference}
                </p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Vendor Sender Email *
              </label>
              <input
                type="email"
                value={customInvoiceForm.email_sender}
                onChange={(e) =>
                  setCustomInvoiceForm({
                    ...customInvoiceForm,
                    email_sender: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.email_sender && (
                <p className="text-red-400 mt-1">{formErrors.email_sender}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={customInvoiceForm.amount}
                onChange={(e) =>
                  setCustomInvoiceForm({
                    ...customInvoiceForm,
                    amount: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              />
              {formErrors.amount && (
                <p className="text-red-400 mt-1">{formErrors.amount}</p>
              )}
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Currency
              </label>
              <select
                value={customInvoiceForm.currency}
                onChange={(e) =>
                  setCustomInvoiceForm({
                    ...customInvoiceForm,
                    currency: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="USD">USD</option>
                <option value="CAD">CAD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Payment Status
              </label>
              <select
                value={customInvoiceForm.payment_status}
                onChange={(e) =>
                  setCustomInvoiceForm({
                    ...customInvoiceForm,
                    payment_status: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
              >
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Line Item Description *
            </label>
            <input
              type="text"
              value={customInvoiceForm.description}
              onChange={(e) =>
                setCustomInvoiceForm({
                  ...customInvoiceForm,
                  description: e.target.value,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
            />
            {formErrors.description && (
              <p className="text-red-400 mt-1">{formErrors.description}</p>
            )}
          </div>
        </div>
      </ValidatedModalForm>
    </div>
  );
}
