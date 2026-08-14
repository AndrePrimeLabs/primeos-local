import { createClient } from '@supabase/supabase-js';

// Initialize the master Supabase client using project environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Base Universal SDK Model to mirror primeos syntax to Supabase
class CustomEntity {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async list() {
    const { data, error } = await supabase.from(this.tableName).select('*');
    if (error) throw error;
    return data;
  }

  async get(id) {
    const { data, error } = await supabase.from(this.tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async create(payload) {
    const { data, error } = await supabase.from(this.tableName).insert([payload]).select().single();
    if (error) throw error;
    return data;
  }

  async update(id, payload) {
    const { data, error } = await supabase.from(this.tableName).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async delete(id) {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

// --- Dynamic Frontend Model Mapping (Exactly One Declaration Per Entity) ---
export const PatientRecord = new CustomEntity('patient_records');
export const Dentist = new CustomEntity('dentists');
export const DentistBlockout = new CustomEntity('dentist_blockouts');
export const Appointment = new CustomEntity('appointments');
export const Resource = new CustomEntity('resources');
export const ClinicalNote = new CustomEntity('clinical_notes');
export const MedicalRecord = new CustomEntity('medical_records');
export const Customer = new CustomEntity('customers');
export const CustomerSegment = new CustomEntity('customer_segments');
export const Lead = new CustomEntity('leads');
export const LeadInteraction = new CustomEntity('lead_interactions');
export const Interaction = new CustomEntity('interactions');
export const ClientJourney = new CustomEntity('client_journeys');
export const CrmAppointment = new CustomEntity('crm_appointments');
export const CrmSyncSetting = new CustomEntity('crm_sync_settings');
export const CrmWorkflow = new CustomEntity('crm_workflows');
export const FinancialTransaction = new CustomEntity('financial_transactions');
export const FinancialGoal = new CustomEntity('financial_goals');
export const Budget = new CustomEntity('budgets');
export const Expense = new CustomEntity('expenses');
export const Asset = new CustomEntity('assets');
export const Product = new CustomEntity('products');
export const Sale = new CustomEntity('sales');
export const SalesScript = new CustomEntity('sales_scripts');
export const Campaign = new CustomEntity('campaigns');
export const MarketStrategy = new CustomEntity('market_strategies');
export const MarketingChannel = new CustomEntity('marketing_channels');
export const MarketingMetric = new CustomEntity('marketing_metrics');
export const Channel = new CustomEntity('channels');
export const AbTest = new CustomEntity('ab_tests');
export const EmailSequence = new CustomEntity('email_sequences');
export const Task = new CustomEntity('tasks');
export const Pop = new CustomEntity('pops');
export const Sop = new CustomEntity('sops');
export const Activity = new CustomEntity('activities');
export const AutomationWorkflow = new CustomEntity('automation_workflows');
export const KnowledgeBase = new CustomEntity('knowledge_bases');
export const Document = new CustomEntity('documents');
export const InventoryItem = new CustomEntity('inventory_items');
export const SupportTicket = new CustomEntity('support_tickets');
export const FollowUp = new CustomEntity('follow_ups');
export const FollowUpLog = new CustomEntity('follow_up_logs');
export const FollowUpRule = new CustomEntity('follow_up_rules');
export const ReminderSchedule = new CustomEntity('reminder_schedules');
export const UserEngagement = new CustomEntity('user_engagements');
export const UserPoint = new CustomEntity('user_points');
export const UserBadge = new CustomEntity('user_badges');
export const ProjectSeo = new CustomEntity('project_seos');
export const TarefaSeo = new CustomEntity('tarefa_seos');
export const PalavraChave = new CustomEntity('palavra_chaves');
export const ConteudoSeo = new CustomEntity('conteudo_seo');
export const BackLink = new CustomEntity('back_links');
export const RelatorioSeo = new CustomEntity('relatorio_seos');
export const PrimeGrowthStage = new CustomEntity('prime_growth_stages');
export const PrimeFunnelLead = new CustomEntity('prime_funnel_leads');
export const PrimeDelegationTask = new CustomEntity('prime_delegation_tasks');
export const ReportSchedule = new CustomEntity('report_schedules');
export const CustomDashboard = new CustomEntity('custom_dashboards');
export const KeyPartner = new CustomEntity('key_partners');
export const ValueProposition = new CustomEntity('value_propositions');
export const BusinessStrategy = new CustomEntity('business_strategies');
export const Content = new CustomEntity('contents');
export const AppAnalytic = new CustomEntity('app_analytics');
export const AppReview = new CustomEntity('app_reviews');
export const AppVersion = new CustomEntity('app_versions');
export const MobileApp = new CustomEntity('mobile_apps');

// Compatibility export for tests expecting a top-level primeos client object
export const primeos = {
  entities: {
    PatientRecord,
    Dentist,
    Appointment,
    Resource,
    MedicalRecord,
    Customer,
    Product,
  },
  auth: { supabase },
  functions: {},
  integrations: {},
};
