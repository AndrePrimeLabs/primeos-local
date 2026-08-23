// @ts-nocheck
/**
 * PrimeOS Client — Migrated from legacy base44 direct Supabase connections.
 * Routes all entities through the local/production unified HTTP API layer.
 */

import axios from 'axios';

// Resolve configuration variables from environment values 
const apiBaseUrl = import.meta.env.VITE_PRIMEOS_API_URL || 'http://localhost:5000/api';
const apiKey = import.meta.env.VITE_PRIMEOS_API_KEY || '';

// Centralized Axios Instance replacing the Supabase client
export const apiHttpClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'api_key': apiKey,
    'Content-Type': 'application/json'
  }
});

// Refactored SDK Entity Model to route methods natively to your new backend spec
class CustomEntity {
  constructor(entityName) {
    this.entityName = entityName;
    this.endpoint = `/entities/${entityName}`;
  }

  // GET: Supports optional configuration objects or plain strings for fallback logic
  async list(options = {}) {
    let params = {};
    if (typeof options === 'string') {
      params.sort_by = options;
    } else if (options && typeof options === 'object') {
      params = { ...options };
      if (options.q && typeof options.q === 'object') {
        params.q = JSON.stringify(options.q);
      }
    }
    const response = await apiHttpClient.get(this.endpoint, { params });
    return response.data;
  }

  // GET: Individual record resolution by ID
  async get(id) {
    // Passes the ID as a direct match filter to the standard OpenAPI list route
    const response = await apiHttpClient.get(this.endpoint, {
      params: { q: JSON.stringify({ id }) }
    });
    const records = response.data;
    if (!records || records.length === 0) {
      throw new Error(`Record not found in ${this.entityName}`);
    }
    return Array.isArray(records) ? records[0] : records;
  }

  // POST: Standard resource insertion
  async create(payload) {
    const response = await apiHttpClient.post(this.endpoint, payload);
    return response.data;
  }

  // PATCH: Forwarding structural updates to our batch-update endpoint routing loop
  async update(id, payload) {
    const response = await apiHttpClient.patch(`${this.endpoint}/update-many`, {
      query: { id },
      data: { $set: payload }
    });
    return response.data;
  }

  // DELETE: Forward query filters down safely
  async delete(id) {
    const response = await apiHttpClient.delete(this.endpoint, {
      data: { id }
    });
    return response.data;
  }

  // --- Extended OpenAPI Utility Endpoints ---
  async bulkCreate(recordsArray) {
    const response = await apiHttpClient.post(`${this.endpoint}/bulk`, recordsArray);
    return response.data;
  }

  async bulkUpdate(updatesArray) {
    const response = await apiHttpClient.put(`${this.endpoint}/bulk`, updatesArray);
    return response.data;
  }

  async updateMany(query, updateOperations) {
    const response = await apiHttpClient.patch(`${this.endpoint}/update-many`, {
      query,
      data: updateOperations
    });
    return response.data;
  }
}

// --- Dynamic Frontend Model Mapping (Maintains exact naming structures) ---
export const PatientRecord = new CustomEntity('PatientRecord');
export const Dentist = new CustomEntity('Dentist');
export const DentistBlockout = new CustomEntity('DentistBlockout');
export const Appointment = new CustomEntity('Appointment');
export const Resource = new CustomEntity('Resource');
export const ClinicalNote = new CustomEntity('ClinicalNote');
export const MedicalRecord = new CustomEntity('MedicalRecord');
export const Customer = new CustomEntity('Customer');
export const CustomerSegment = new CustomEntity('CustomerSegment');
export const Lead = new CustomEntity('Lead');
export const LeadInteraction = new CustomEntity('LeadInteraction');
export const Interaction = new CustomEntity('Interaction');
export const ClientJourney = new CustomEntity('ClientJourney');
export const CrmAppointment = new CustomEntity('CrmAppointment');
export const CrmSyncSetting = new CustomEntity('CrmSyncSetting');
export const CrmWorkflow = new CustomEntity('CrmWorkflow');
export const FinancialTransaction = new CustomEntity('FinancialTransaction');
export const FinancialGoal = new CustomEntity('FinancialGoal');
export const Budget = new CustomEntity('Budget');
export const Expense = new CustomEntity('Expense');
export const Asset = new CustomEntity('Asset');
export const Product = new CustomEntity('Product');
export const Sale = new CustomEntity('Sale');
export const SalesScript = new CustomEntity('SalesScript');
export const Campaign = new CustomEntity('Campaign');
export const MarketStrategy = new CustomEntity('MarketStrategy');
export const MarketingChannel = new CustomEntity('MarketingChannel');
export const MarketingMetric = new CustomEntity('MarketingMetric');
export const Channel = new CustomEntity('Channel');
export const AbTest = new CustomEntity('AbTest');
export const EmailSequence = new CustomEntity('EmailSequence');
export const Task = new CustomEntity('Task');
export const Pop = new CustomEntity('Pop');
export const Sop = new CustomEntity('Sop');
export const Activity = new CustomEntity('Activity');
export const AutomationWorkflow = new CustomEntity('AutomationWorkflow');
export const KnowledgeBase = new CustomEntity('KnowledgeBase');
export const Document = new CustomEntity('Document');
export const InventoryItem = new CustomEntity('InventoryItem');
export const SupportTicket = new CustomEntity('SupportTicket');
export const FollowUp = new CustomEntity('FollowUp');
export const FollowUpLog = new CustomEntity('FollowUpLog');
export const FollowUpRule = new CustomEntity('FollowUpRule');
export const ReminderSchedule = new CustomEntity('ReminderSchedule');
export const UserEngagement = new CustomEntity('UserEngagement');
export const UserPoint = new CustomEntity('UserPoint');
export const UserBadge = new CustomEntity('UserBadge');
export const ProjectSeo = new CustomEntity('ProjectSeo');
export const DarkSeo = new CustomEntity('TarefaSeo');
export const PalavraChave = new CustomEntity('PalavraChave');
export const ConteudoSeo = new CustomEntity('ConteudoSeo');
export const BackLink = new CustomEntity('BackLink');
export const RelatorioSeo = new CustomEntity('RelatorioSeo');
export const PrimeGrowthStage = new CustomEntity('PrimeGrowthStage');
export const PrimeFunnelLead = new CustomEntity('PrimeFunnelLead');
export const PrimeDelegationTask = new CustomEntity('PrimeDelegationTask');
export const ReportSchedule = new CustomEntity('ReportSchedule');
export const CustomDashboard = new CustomEntity('CustomDashboard');
export const KeyPartner = new CustomEntity('KeyPartner');
export const ValueProposition = new CustomEntity('ValueProposition');
export const BusinessStrategy = new CustomEntity('BusinessStrategy');
export const Content = new CustomEntity('Content');
export const AppAnalytic = new CustomEntity('AppAnalytic');
export const AppReview = new CustomEntity('AppReview');
export const AppVersion = new CustomEntity('AppVersion');
export const MobileApp = new CustomEntity('MobileApp');

// Compatibility wrapper matching old application tests and structural contexts
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
  auth: {
    // Light abstraction helper for components that historically verified user sessions
    getUser: async () => ({ data: { user: { id: "local_dev", email: "admin@prime.com" } }, error: null }),
    signInWithPassword: async ({ email }) => ({ data: { user: { email }, session: {} }, error: null }),
    signOut: async () => ({ error: null })
  },
  functions: {},
  integrations: {},
};
