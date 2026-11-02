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
  requires_executive_review?: boolean;
  executive_review_notes?: string;
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
  event_timestamp?: string;
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
    weighted_pipeline_value?: string;
    average_deal_size?: string;
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
    probability_percent?: number;
    weighted_value?: string;
  }>;
  projects_by_phase: Array<{
    phase: string;
    count: number;
    total_budget: string;
  }>;
  kevin_review_deals?: Array<{
    id: string;
    name: string;
    client_name: string;
    client_phone?: string;
    estimated_value: string;
    stage: string;
    kevin_review_notes: string;
    next_follow_up_date: string | null;
    sales_owner?: string;
    created_at?: string;
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
  event_timestamp?: string;
  triggered_at?: string;
  cost_record: ProjectCost;
}

export interface SMTPSettings {
  id: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  has_password?: boolean;
  use_ssl: boolean;
  use_tls: boolean;
  default_from_email: string;
  kevin_email: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FeatureFlags {
  // Top-level Pages
  page_landing?: boolean;
  page_overview?: boolean;
  page_crm?: boolean;
  page_projects?: boolean;
  page_automation?: boolean;
  // CRM Sub-Features
  sub_crm_deals?: boolean;
  sub_crm_contacts?: boolean;
  sub_crm_activities?: boolean;
  // Project Management Sub-Features
  sub_projects_board?: boolean;
  sub_projects_tasks?: boolean;
  sub_projects_materials?: boolean;
  // Automation & Finance Sub-Features
  sub_automation_invoices?: boolean;
  sub_automation_emails?: boolean;
  sub_automation_simulator?: boolean;
  // Governance, White-Label & Integrations
  sub_executive_triage?: boolean;
  sub_custom_domain?: boolean;
  sub_custom_google_oauth?: boolean;
  sub_integration_notion?: boolean;
  sub_integration_smtp?: boolean;
  sub_team_invitations?: boolean;
  [key: string]: boolean | undefined;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  subdomain_host: string;
  custom_domain: string | null;
  custom_domain_verified: boolean;
  is_active: boolean;
  currency: string;
  deal_review_threshold: string;
  invoice_review_threshold: string;
  executive_recipient_email: string;
  use_custom_google_oauth: boolean;
  google_oauth_client_id: string;
  google_oauth_client_secret?: string;
  has_google_secret?: boolean;
  feature_flags: FeatureFlags;
  logo_url: string;
  primary_color: string;
  member_count?: number;
  project_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlatformSettings {
  id: string;
  platform_name: string;
  base_domain: string;
  google_oauth_client_id: string;
  google_oauth_client_secret?: string;
  has_google_secret?: boolean;
  google_oauth_enabled: boolean;
  allow_self_registration: boolean;
  updated_at?: string;
}

export interface OrganizationMember {
  id: string;
  organization: string;
  user: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "Owner" | "Admin" | "PM" | "Sales" | "Field" | "Accountant" | "Client";
  is_active: boolean;
  created_at: string;
}

export interface Invitation {
  id: string;
  invitation_type: "CLIENT_ONBOARDING" | "TEAM_MEMBER";
  email: string;
  invited_name: string;
  organization: string | null;
  organization_slug?: string;
  organization_name?: string;
  role: string;
  token: string;
  status: "Pending" | "Accepted" | "Expired" | "Revoked";
  invited_by?: number;
  invited_by_username?: string;
  expires_at: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_superuser: boolean;
}

export interface OAuthPublicConfig {
  platform_name: string;
  base_domain: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    subdomain_host: string;
    custom_domain: string | null;
    custom_domain_verified: boolean;
    is_active: boolean;
    currency: string;
    feature_flags: FeatureFlags;
    logo_url: string;
    primary_color: string;
  } | null;
  google_oauth: {
    enabled: boolean;
    client_id: string;
    source: "platform" | "client";
    brand_name: string;
  };
}

export interface SuperadminDashboardStats {
  kpis: {
    total_organizations: number;
    active_organizations: number;
    suspended_organizations: number;
    total_users: number;
    active_users: number;
    mrr: number;
    annual_run_rate: number;
    open_support_queries: number;
    active_system_broadcasts: number;
  };
  platform: {
    platform_name: string;
    base_domain: string;
    google_oauth_enabled: boolean;
    has_google_secret: boolean;
  };
  recent_activity: Array<{
    id: string;
    title: string;
    description: string;
    timestamp: string;
    type: "tenant" | "billing" | "support" | "security";
  }>;
}

export interface PlatformUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login: string | null;
  organization: string | null;
  organization_name: string | null;
  role: string;
}

export interface ClientSubscription {
  id: string;
  organization: string;
  organization_name: string;
  organization_slug: string;
  plan_tier: "Starter" | "Pro" | "Enterprise";
  monthly_price: number | string;
  billing_cycle: "Monthly" | "Annual";
  status: "Active" | "Trialing" | "Past Due" | "Canceled";
  payment_method: string;
  next_billing_date: string | null;
  last_payment_date: string | null;
  total_paid_ytd: number | string;
  created_at: string;
  updated_at: string;
}

export interface ClientSupportTicket {
  id: string;
  organization: string;
  organization_name: string;
  organization_slug: string;
  submitted_by_name: string;
  submitted_by_email: string;
  subject: string;
  category: "Domain & DNS" | "Google OAuth" | "Billing" | "Feature Request" | "Technical Support";
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "In Progress" | "Waiting on Client" | "Resolved" | "Closed";
  message: string;
  admin_notes: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical" | "success";
  target_organization: string | null;
  target_organization_name: string | null;
  target_organization_slug: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


