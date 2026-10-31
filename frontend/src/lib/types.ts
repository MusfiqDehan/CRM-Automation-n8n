export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CursorPaginatedData<T> {
  next: string | null;
  previous: string | null;
  next_cursor: string | null;
  previous_cursor: string | null;
  has_next: boolean;
  has_previous: boolean;
  page_size: number;
  results: T[];
}

export interface NotionWorkspaceConfig {
  id: string;
  hub_page_id: string;
  hub_page_url: string;
  contacts_db_id: string;
  contacts_db_url: string;
  opportunities_db_id: string;
  opportunities_db_url: string;
  activities_db_id: string;
  activities_db_url: string;
  projects_db_id: string;
  projects_db_url: string;
  tasks_db_id: string;
  tasks_db_url: string;
  materials_db_id: string;
  materials_db_url: string;
  costs_db_id: string;
  costs_db_url: string;
  sales_dashboard_page_id: string;
  sales_dashboard_url: string;
  last_synced_at: string | null;
}

export interface Contact {
  id: string;
  name: string;
  contact_type: string;
  email: string;
  phone: string;
  company_or_household: string;
  preferred_channel: string;
  referral_source: string;
  enquiry_summary: string;
  opportunities_count: number;
  notion_page_id: string | null;
  notion_url: string;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  stage: string;
  sales_owner: string;
  contact: string | null;
  contact_name: string;
  linked_project: string | null;
  project_name: string;
  project_code: string;
  estimated_value: string;
  design_agreement_status: string;
  construction_agreement_status: string;
  requires_kevin_review: boolean;
  kevin_review_notes: string;
  next_follow_up_date: string | null;
  qualification_notes: string;
  notion_page_id: string | null;
  notion_url: string;
  created_at: string;
  updated_at: string;
}

export interface SalesActivity {
  id: string;
  title: string;
  activity_type: string;
  opportunity: string;
  opportunity_name: string;
  contact: string | null;
  contact_name: string;
  owner: string;
  activity_date: string;
  completed: boolean;
  outcome_notes: string;
  notion_page_id: string | null;
  notion_url: string;
  created_at: string;
  updated_at: string;
}

export interface ConstructionProject {
  id: string;
  code: string;
  name: string;
  phase: string;
  status: string;
  project_manager: string;
  site_address: string;
  contract_budget: string;
  start_date: string | null;
  target_completion_date: string | null;
  progress_percent: number;
  latest_update: string;
  tasks_count: number;
  materials_count: number;
  costs_count: number;
  notion_page_id: string | null;
  notion_url: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  project: string;
  project_name: string;
  project_code: string;
  phase: string;
  assigned_to: string;
  priority: string;
  status: string;
  deadline: string | null;
  progress_updates: string;
  notion_page_id: string | null;
  notion_url: string;
  created_at: string;
  updated_at: string;
}

export interface MaterialOrder {
  id: string;
  item_name: string;
  project: string;
  project_name: string;
  project_code: string;
  supplier: string;
  order_reference: string;
  status: string;
  quantity_description: string;
  unit_cost_total: string;
  order_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  received_by: string;
  delivery_notes: string;
  notion_page_id: string | null;
  notion_url: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectCost {
  id: string;
  title: string;
  supplier: string;
  document_reference: string;
  project: string | null;
  project_name: string;
  project_code: string;
  invoice_date: string | null;
  amount: string;
  currency: string;
  payment_status: string;
  payment_due_date: string | null;
  supporting_document_url: string;
  source_email: string;
  submission_count: number;
  needs_clarification: boolean;
  clarification_notes: string;
  notified_person: string;
  notion_page_id: string | null;
  notion_url: string;
  created_at: string;
  updated_at: string;
}

export interface EmailCommunicationLog {
  id: string;
  subject: string;
  sender: string;
  recipient: string;
  direction: string;
  status: string;
  body_preview: string;
  attachment_name: string;
  related_cost: string | null;
  related_cost_ref: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  kpis: {
    total_pipeline_value: string;
    active_opportunities_count: number;
    kevin_review_opportunities_count: number;
    active_projects_count: number;
    open_tasks_count: number;
    delayed_materials_count: number;
    paid_costs_total: string;
    unpaid_costs_total: string;
    flagged_costs_count: number;
    total_costs_records: number;
    email_notifications_count: number;
  };
  stages_breakdown: Array<{
    stage: string;
    count: number;
    total_value: string;
  }>;
  projects_by_phase: Array<{
    phase: string;
    count: number;
    total_budget: string;
  }>;
  notion_workspace: NotionWorkspaceConfig;
}

export interface SimulatorTriggerResponse {
  scenario: string;
  scenario_label: string;
  n8n_webhook_triggered: boolean;
  extracted_fields: Record<string, unknown>;
  action_taken: "created_new" | "duplicate_skipped" | "updated_existing";
  duplicate_prevented: boolean;
  needs_clarification: boolean;
  cost_record: ProjectCost;
}

