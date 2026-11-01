"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { ValidatedModalForm } from "@/components/common/ValidatedModalForm";
import { Field, DropdownSelect } from "@/components/ui/primitives";
import { ApiError, apiClient } from "@/lib/api-client";
import type { Opportunity, SimulatorTriggerResponse } from "@/lib/types";
import {
  contactSchema,
  customInvoiceSchema,
  opportunitySchema,
  projectSchema,
  validateWithSchema,
} from "@/lib/validations";

export type FormKind = "contact" | "deal" | "project" | "invoice";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/* ------------------------------------------------------------------ */
/* Shared submit helper                                                */
/* ------------------------------------------------------------------ */
function useFormSubmit() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setErrors({});
    setGeneralError(null);
  };

  async function run<T>(
    schema: Parameters<typeof validateWithSchema>[0],
    values: unknown,
    send: (data: Record<string, unknown>) => Promise<T>,
    fallbackError: string
  ): Promise<T | null> {
    reset();
    const validation = validateWithSchema(schema, values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return null;
    }
    setSubmitting(true);
    try {
      return await send(validation.data as Record<string, unknown>);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        const mapped: Record<string, string> = {};
        Object.entries(err.fieldErrors).forEach(([k, msgs]) => {
          mapped[k] = msgs.join(" ");
        });
        setErrors(mapped);
      } else {
        setGeneralError(err instanceof Error ? err.message : fallbackError);
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  return { errors, generalError, submitting, run, reset };
}

/* ------------------------------------------------------------------ */
/* New client / enquiry                                                */
/* ------------------------------------------------------------------ */
const emptyContact = {
  name: "",
  contact_type: "Prospective Client",
  email: "",
  phone: "",
  company_or_household: "",
  preferred_channel: "Email",
  referral_source: "",
  enquiry_summary: "",
};

export function ContactFormModal({ isOpen, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState(emptyContact);
  const { errors, generalError, submitting, run, reset } = useFormSubmit();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(contactSchema, form, (data) => apiClient.post("/contacts/", data), "Could not save this contact.");
    if (res) {
      setForm(emptyContact);
      onSaved(res.message || "Contact added.");
      close();
    }
  };

  return (
    <ValidatedModalForm
      isOpen={isOpen}
      title="Add a new contact"
      subtitle="Someone who asked about building with you, a client, or a partner."
      onClose={close}
      onSubmit={submit}
      submitLabel="Create Contact"
      submitting={submitting}
      generalError={generalError}
    >
      <Field label="Full name" required error={errors.name}>
        <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. Alexandra & David Mercer" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Email" required error={errors.email}>
          <input type="email" className="input" value={form.email} onChange={set("email")} placeholder="name@example.com" />
        </Field>
        <Field label="Phone" error={errors.phone}>
          <input className="input" value={form.phone} onChange={set("phone")} placeholder="+1 (415) 555-0142" />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Who are they?">
          <DropdownSelect
            value={form.contact_type}
            onChange={(val) => setForm((prev) => ({ ...prev, contact_type: val }))}
            options={[
              { value: "Prospective Client", label: "Possible new client", description: "Inquiry or referred prospect" },
              { value: "Active Client", label: "Current client", description: "Under design or build agreement" },
              { value: "Referral Partner / Architect", label: "Partner / Architect", description: "Design firm or industry contact" },
              { value: "Subcontractor / Vendor", label: "Supplier / Subcontractor", description: "Trade partner or vendor" },
            ]}
          />
        </Field>
        <Field label="Best way to reach them">
          <DropdownSelect
            value={form.preferred_channel}
            onChange={(val) => setForm((prev) => ({ ...prev, preferred_channel: val }))}
            options={[
              { value: "Email", label: "Email", description: "Written specs and updates" },
              { value: "Phone Call", label: "Phone call", description: "Direct voice call" },
              { value: "SMS / Text", label: "Text message", description: "Quick mobile updates" },
              { value: "Ressio Client Portal", label: "Client portal", description: "Secure customer dashboard" },
            ]}
          />
        </Field>
      </div>
      <Field label="How did they find you?" hint="Optional — e.g. referred by an architect or past client">
        <input className="input" value={form.referral_source} onChange={set("referral_source")} />
      </Field>
      <Field label="What are they looking for?" hint="Optional — location, budget, timeline">
        <textarea rows={3} className="input" value={form.enquiry_summary} onChange={set("enquiry_summary")} />
      </Field>
    </ValidatedModalForm>
  );
}

/* ------------------------------------------------------------------ */
/* New deal                                                            */
/* ------------------------------------------------------------------ */
const emptyDeal = {
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
};

export interface DealFormModalProps extends ModalProps {
  deal?: Opportunity | null;
}

export function DealFormModal({ isOpen, onClose, onSaved, deal }: DealFormModalProps) {
  const [form, setForm] = useState(emptyDeal);
  const { errors, generalError, submitting, run, reset } = useFormSubmit();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const isEditing = Boolean(deal?.id);

  useEffect(() => {
    if (deal) {
      setForm({
        name: deal.name || "",
        stage: deal.stage || "1. New Enquiry",
        sales_owner: deal.sales_owner || "Jordan Blake (Sales Lead)",
        estimated_value: String(deal.estimated_value || "0"),
        design_agreement_status: deal.design_agreement_status || "Not Started",
        construction_agreement_status: deal.construction_agreement_status || "Not Started",
        requires_kevin_review: Boolean(deal.requires_kevin_review),
        kevin_review_notes: deal.kevin_review_notes || "",
        next_follow_up_date: deal.next_follow_up_date
          ? String(deal.next_follow_up_date).split("T")[0]
          : "",
        qualification_notes: deal.qualification_notes || "",
      });
    } else {
      setForm(emptyDeal);
    }
  }, [deal, isOpen]);

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      next_follow_up_date: form.next_follow_up_date ? form.next_follow_up_date : null,
    };
    const endpoint = isEditing ? `/opportunities/${deal!.id}/` : "/opportunities/";
    const res = await run(
      opportunitySchema,
      payload,
      (data) => (isEditing ? apiClient.patch(endpoint, data) : apiClient.post(endpoint, data)),
      isEditing ? "Could not update this deal." : "Could not save this deal."
    );
    if (res) {
      setForm(emptyDeal);
      onSaved(res.message || (isEditing ? "Deal updated successfully." : "Deal added."));
      close();
    }
  };

  const modalTitle = isEditing
    ? form.requires_kevin_review
      ? "Review & Approve Deal"
      : "Edit Deal"
    : "Add a new deal";

  const modalSubtitle = isEditing
    ? "Update deal pipeline stage, agreement status, or founder review decision."
    : "A home you might build for a client.";

  const submitLabel = isEditing
    ? deal?.requires_kevin_review && !form.requires_kevin_review
      ? "Approve & Save Deal"
      : "Save Changes"
    : "Create Deal";

  return (
    <ValidatedModalForm
      isOpen={isOpen}
      title={modalTitle}
      subtitle={modalSubtitle}
      onClose={close}
      onSubmit={submit}
      submitLabel={submitLabel}
      submitting={submitting}
      generalError={generalError}
    >
      {/* If this deal is flagged for Kevin's review, show executive callout */}
      {isEditing && deal?.requires_kevin_review && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div className="text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200">
                Flagged for Kevin&apos;s Review
              </span>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                {form.requires_kevin_review
                  ? "Requires founder approval before client signing or stage advancement."
                  : "Review flag will be cleared upon saving."}
              </p>
            </div>
          </div>
          {form.requires_kevin_review ? (
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, requires_kevin_review: false }))}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Approved</span>
            </button>
          ) : (
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved</span>
            </span>
          )}
        </div>
      )}

      <Field label="Deal name" required error={errors.name}>
        <input
          className="input"
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. Mercer Hillside Residence"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Where is it at? (Pipeline Stage)">
          <DropdownSelect
            value={form.stage}
            onChange={(val) => setForm((prev) => ({ ...prev, stage: val }))}
            options={[
              { value: "1. New Enquiry", label: "1. New Enquiry", description: "Initial contact received" },
              { value: "2. Qualification", label: "2. Qualification", description: "Budget & scope review" },
              { value: "3. Design Agreement", label: "3. Design Agreement", description: "Architectural retainers" },
              { value: "4. Construction Agreement", label: "4. Construction Agreement", description: "Pre-construction signing" },
              { value: "5. Won — Handed to Ops", label: "5. Won — Handed to Ops", description: "Breaking ground / PM handoff" },
              { value: "Closed Lost", label: "Closed Lost", description: "Deal did not materialize" },
            ]}
          />
        </Field>
        <Field label="Estimated value (USD)" required error={errors.estimated_value}>
          <input
            type="number"
            className="input"
            value={form.estimated_value}
            onChange={set("estimated_value")}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Who owns this deal?" error={errors.sales_owner}>
          <input
            className="input"
            value={form.sales_owner}
            onChange={set("sales_owner")}
          />
        </Field>
        <Field label="Next follow-up">
          <input
            type="date"
            className="input"
            value={form.next_follow_up_date}
            onChange={set("next_follow_up_date")}
          />
        </Field>
      </div>

      {/* Agreements Status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Design Agreement Status">
          <DropdownSelect
            value={form.design_agreement_status}
            onChange={(val) => setForm((prev) => ({ ...prev, design_agreement_status: val }))}
            options={[
              { value: "Not Started", label: "Not Started" },
              { value: "Sent to Client", label: "Sent to Client" },
              { value: "Under Review", label: "Under Review" },
              { value: "Signed & Executed", label: "Signed & Executed" },
            ]}
          />
        </Field>
        <Field label="Construction Agreement Status">
          <DropdownSelect
            value={form.construction_agreement_status}
            onChange={(val) => setForm((prev) => ({ ...prev, construction_agreement_status: val }))}
            options={[
              { value: "Not Started", label: "Not Started" },
              { value: "Sent to Client", label: "Sent to Client" },
              { value: "Under Review", label: "Under Review" },
              { value: "Signed & Executed", label: "Signed & Executed" },
            ]}
          />
        </Field>
      </div>

      <Field label="Qualification & Client Scope Notes" error={errors.qualification_notes}>
        <textarea
          rows={2}
          className="input"
          value={form.qualification_notes}
          onChange={set("qualification_notes")}
          placeholder="Lot details, architectural preferences, client timeline..."
        />
      </Field>

      <div className="rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 p-4 ring-1 ring-amber-200/70 dark:ring-amber-800/50">
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-amber-900 dark:text-amber-200">
          <input
            type="checkbox"
            checked={form.requires_kevin_review}
            onChange={(e) => setForm({ ...form, requires_kevin_review: e.target.checked })}
            className="h-4 w-4 rounded accent-amber-600"
          />
          Requires Kevin&apos;s Review (Founder Approval Needed)
        </label>
        {(form.requires_kevin_review || form.kevin_review_notes) && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Founder Review Notes / Approval Decision:
            </label>
            <textarea
              rows={2}
              className="input bg-white dark:bg-slate-900"
              value={form.kevin_review_notes}
              onChange={set("kevin_review_notes")}
              placeholder="e.g. Approved with 10% mobilization deposit requirement, or note items needing clarification."
            />
          </div>
        )}
      </div>
    </ValidatedModalForm>
  );
}

/* ------------------------------------------------------------------ */
/* New project                                                         */
/* ------------------------------------------------------------------ */
const emptyProject = {
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
};

export function ProjectFormModal({ isOpen, onClose, onSaved }: ModalProps) {
  const [form, setForm] = useState(emptyProject);
  const { errors, generalError, submitting, run, reset } = useFormSubmit();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(projectSchema, form, (data) => apiClient.post("/projects/", data), "Could not save this project.");
    if (res) {
      onSaved(res.message || "Project added.");
      close();
    }
  };

  return (
    <ValidatedModalForm
      isOpen={isOpen}
      title="Start a new project"
      subtitle="A checklist for every stage — planning, building, handover and warranty — is set up for you."
      onClose={close}
      onSubmit={submit}
      submitLabel="Create Project"
      submitting={submitting}
      generalError={generalError}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Project code" required error={errors.code}>
          <input className="input" value={form.code} onChange={set("code")} />
        </Field>
        <Field label="Project name" required error={errors.name} className="sm:col-span-2">
          <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. Oakridge Estate" />
        </Field>
      </div>
      <Field label="Site address" error={errors.site_address}>
        <input className="input" value={form.site_address} onChange={set("site_address")} placeholder="Street, city" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Current stage">
          <DropdownSelect
            value={form.phase}
            onChange={(val) => setForm((prev) => ({ ...prev, phase: val }))}
            options={[
              { value: "Pre-Construction", label: "Pre-Construction", description: "Permitting, soil tests & schedule" },
              { value: "Construction", label: "Construction", description: "Grading, framing & rough MEP" },
              { value: "Closeout", label: "Closeout", description: "Finishes, punchlists & inspections" },
              { value: "Warranty", label: "Warranty", description: "Post-handover defect care" },
            ]}
          />
        </Field>
        <Field label="Project manager" error={errors.project_manager}>
          <input className="input" value={form.project_manager} onChange={set("project_manager")} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Budget (USD)" required error={errors.contract_budget}>
          <input type="number" className="input" value={form.contract_budget} onChange={set("contract_budget")} />
        </Field>
        <Field label="Start date">
          <input type="date" className="input" value={form.start_date} onChange={set("start_date")} />
        </Field>
        <Field label="Finish date" error={errors.target_completion_date}>
          <input type="date" className="input" value={form.target_completion_date} onChange={set("target_completion_date")} />
        </Field>
      </div>
    </ValidatedModalForm>
  );
}

/* ------------------------------------------------------------------ */
/* Add a supplier invoice                                              */
/* ------------------------------------------------------------------ */
const defaultInvoice = {
  supplier: "Golden Gate Structural Steel",
  document_reference: "INV-2026-850",
  project_reference: "PRJ-101 Oakridge Estate",
  amount: "29400.00",
  currency: "USD",
  payment_status: "Unpaid",
  email_sender: "billing@ggsteel.com",
  days_until_due: "14",
  description: "Custom roof ridge beam & crane rigging package",
};

export function InvoiceFormModal({
  isOpen,
  onClose,
  onSaved,
  onProcessed,
}: ModalProps & { onProcessed: (res: SimulatorTriggerResponse) => void }) {
  const [form, setForm] = useState(defaultInvoice);
  const { errors, generalError, submitting, run, reset } = useFormSubmit();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const close = () => {
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await run(
      customInvoiceSchema,
      form,
      (data) => apiClient.post<SimulatorTriggerResponse>("/simulator/trigger/", { scenario: "custom", custom: data }),
      "Could not process this invoice."
    );
    if (res) {
      onProcessed(res.data);
      onSaved(`Invoice ${res.data.cost_record.document_reference} was added.`);
      close();
    }
  };

  return (
    <ValidatedModalForm
      isOpen={isOpen}
      title="Add a supplier invoice"
      subtitle="We read it, match it to the right project and let the team know — just like when one arrives by email."
      onClose={close}
      onSubmit={submit}
      submitLabel="Add Invoice"
      submitting={submitting}
      generalError={generalError}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Supplier" required error={errors.supplier}>
          <input className="input" value={form.supplier} onChange={set("supplier")} />
        </Field>
        <Field label="Invoice number" required error={errors.document_reference}>
          <input className="input" value={form.document_reference} onChange={set("document_reference")} />
        </Field>
      </div>
      <Field label="What is it for?" required error={errors.description}>
        <input className="input" value={form.description} onChange={set("description")} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Project" required error={errors.project_reference} hint="Project code, e.g. PRJ-101">
          <input className="input" value={form.project_reference} onChange={set("project_reference")} />
        </Field>
        <Field label="Supplier email" required error={errors.email_sender}>
          <input type="email" className="input" value={form.email_sender} onChange={set("email_sender")} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Amount" required error={errors.amount} className="col-span-2">
          <input type="number" step="0.01" className="input" value={form.amount} onChange={set("amount")} />
        </Field>
        <Field label="Currency">
          <DropdownSelect
            value={form.currency}
            onChange={(val) => setForm((prev) => ({ ...prev, currency: val }))}
            direction="auto"
            options={[
              { value: "USD", label: "USD ($)" },
              { value: "CAD", label: "CAD ($)" },
              { value: "EUR", label: "EUR (€)" },
              { value: "GBP", label: "GBP (£)" },
            ]}
          />
        </Field>
        <Field label="Status">
          <DropdownSelect
            value={form.payment_status}
            onChange={(val) => setForm((prev) => ({ ...prev, payment_status: val }))}
            direction="auto"
            options={[
              { value: "Unpaid", label: "Unpaid", description: "Awaiting approval / payment" },
              { value: "Paid", label: "Paid", description: "Receipt attached / settled" },
              { value: "Partially Paid", label: "Part paid", description: "Progress payment drawn" },
            ]}
          />
        </Field>
      </div>
    </ValidatedModalForm>
  );
}

