import { z } from "zod";

const phoneRegex = /^[0-9+\-() .ext]{7,30}$/i;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Contact name must be at least 2 characters."),
  contact_type: z.enum([
    "Prospective Client",
    "Active Client",
    "Past Client",
    "Referral Partner / Architect",
    "Subcontractor / Vendor",
  ]),
  email: z.string().trim().email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .refine(
      (val) => val === "" || phoneRegex.test(val),
      "Please enter a valid phone number (7-30 digits)."
    ),
  company_or_household: z.string().trim().optional().default(""),
  preferred_channel: z.enum([
    "Phone Call",
    "Email",
    "SMS / Text",
    "Ressio Client Portal",
  ]),
  referral_source: z.string().trim().optional().default(""),
  enquiry_summary: z.string().trim().optional().default(""),
});

export const opportunitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Opportunity name must be at least 3 characters."),
  stage: z.enum([
    "1. New Enquiry",
    "2. Qualification",
    "3. Design Agreement",
    "4. Construction Agreement",
    "5. Won — Handed to Ops",
    "Closed Lost",
  ]),
  sales_owner: z
    .string()
    .trim()
    .min(2, "Sales owner is required."),
  estimated_value: z
    .string()
    .trim()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
      "Estimated contract value must be greater than 0."
    ),
  design_agreement_status: z.enum([
    "Not Started",
    "Sent to Client",
    "Under Review",
    "Signed & Executed",
  ]),
  construction_agreement_status: z.enum([
    "Not Started",
    "Sent to Client",
    "Under Review",
    "Signed & Executed",
  ]),
  requires_kevin_review: z.boolean().default(false),
  kevin_review_notes: z.string().trim().optional().default(""),
  next_follow_up_date: z.string().trim().optional().default(""),
  qualification_notes: z.string().trim().optional().default(""),
});

export const projectSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Project code must be at least 3 characters (e.g., PRJ-105)."),
    name: z
      .string()
      .trim()
      .min(3, "Project name must be at least 3 characters."),
    phase: z.enum(["Pre-Construction", "Construction", "Closeout", "Warranty"]),
    status: z.enum(["On Track", "At Risk", "Delayed", "Completed"]),
    project_manager: z.string().trim().min(2, "Project manager is required."),
    site_address: z.string().trim().optional().default(""),
    contract_budget: z
      .string()
      .trim()
      .refine(
        (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
        "Contract budget must be greater than 0."
      ),
    start_date: z.string().trim().optional().default(""),
    target_completion_date: z.string().trim().optional().default(""),
    progress_percent: z.coerce
      .number()
      .min(0, "Progress must be at least 0%.")
      .max(100, "Progress cannot exceed 100%."),
    latest_update: z.string().trim().optional().default(""),
  })
  .refine(
    (data) => {
      if (data.start_date && data.target_completion_date) {
        return data.target_completion_date >= data.start_date;
      }
      return true;
    },
    {
      message: "Target completion date cannot be earlier than start date.",
      path: ["target_completion_date"],
    }
  );

export const customInvoiceSchema = z.object({
  supplier: z
    .string()
    .trim()
    .min(2, "Supplier name must be at least 2 characters."),
  document_reference: z
    .string()
    .trim()
    .min(2, "Document reference (e.g., INV-2026-801) is required."),
  project_reference: z
    .string()
    .trim()
    .min(2, "Project reference is required (use 'Unknown' to test clarification flagging)."),
  amount: z
    .string()
    .trim()
    .refine(
      (val) => !Number.isNaN(Number(val)) && Number(val) > 0,
      "Invoice amount must be greater than 0."
    ),
  currency: z.enum(["USD", "CAD", "EUR", "GBP"]),
  payment_status: z.enum(["Paid", "Unpaid", "Partially Paid"]),
  email_sender: z.string().trim().email("Please enter a valid sender email."),
  days_until_due: z.coerce
    .number()
    .min(0, "Days until due must be 0 or greater.")
    .max(365, "Days until due cannot exceed 365."),
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters."),
});

export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown
): { valid: true; data: T } | { valid: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { valid: false, errors };
}

