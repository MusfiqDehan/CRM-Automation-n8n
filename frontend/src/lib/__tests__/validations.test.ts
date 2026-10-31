import { describe, expect, test } from "bun:test";
import {
  contactSchema,
  customInvoiceSchema,
  opportunitySchema,
  projectSchema,
  validateWithSchema,
} from "../validations";

describe("Frontend Zod 4 Validation Schemas", () => {
  test("validates a well-formed Contact and rejects invalid email/phone", () => {
    const valid = validateWithSchema(contactSchema, {
      name: "Arthur Henderson",
      contact_type: "Prospective Client",
      email: "arthur@oakridge.com",
      phone: "+1 (415) 890-4412",
      preferred_channel: "Email",
    });
    expect(valid.valid).toBe(true);

    const invalid = validateWithSchema(contactSchema, {
      name: "A",
      contact_type: "Prospective Client",
      email: "not-an-email",
      phone: "abc",
      preferred_channel: "Email",
    });
    expect(invalid.valid).toBe(false);
    if (!invalid.valid) {
      expect(invalid.errors.name).toBeDefined();
      expect(invalid.errors.email).toBeDefined();
      expect(invalid.errors.phone).toBeDefined();
    }
  });

  test("rejects negative or zero Opportunity estimated value", () => {
    const res = validateWithSchema(opportunitySchema, {
      name: "Henderson Lakefront Build",
      stage: "2. Qualification",
      sales_owner: "Jordan Blake",
      estimated_value: "-100",
      design_agreement_status: "Not Started",
      construction_agreement_status: "Not Started",
    });
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.errors.estimated_value).toContain("greater than 0");
    }
  });

  test("rejects ConstructionProject where target_completion_date precedes start_date", () => {
    const res = validateWithSchema(projectSchema, {
      code: "PRJ-999",
      name: "Test Custom Residence",
      phase: "Pre-Construction",
      status: "On Track",
      project_manager: "Marcus Vance",
      contract_budget: "3200000",
      start_date: "2026-12-01",
      target_completion_date: "2026-10-01",
      progress_percent: 25,
    });
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.errors.target_completion_date).toContain("earlier than start date");
    }
  });

  test("validates customInvoiceSchema for Part 3 simulator", () => {
    const valid = validateWithSchema(customInvoiceSchema, {
      supplier: "Pacific Lumber Co",
      document_reference: "INV-2026-888",
      project_reference: "PRJ-101",
      amount: "14500.00",
      currency: "USD",
      payment_status: "Unpaid",
      email_sender: "billing@pacificlumber.com",
      days_until_due: 14,
      description: "Rough framing timber package",
    });
    expect(valid.valid).toBe(true);
  });
});

