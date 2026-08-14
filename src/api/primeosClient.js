// @ts-nocheck
/**
 * PrimeOS App — own backend database client (Supabase Postgres + Auth + Storage + Edge Functions).
 *
 * @example
 *   import { primeos, createPrimeOSApp } from '@/api/primeosClient';
 *
 *   const app = createPrimeOSApp();
 *   const customers = await app.entities.Customer.list('-created_date');
 *   await app.database.from('leads').select('*');
 */

import { createClient } from '@supabase/supabase-js';
import {
  supabase as defaultSupabase,
  supabaseUrl,
  supabaseAnonKey,
  supabaseProjectId,
  supabaseRestUrl,
  storageBucket as defaultStorageBucket,
} from '../../supabase/supabaseClient.js';
import { createEntity } from './entities/base.js';
import { appParams } from '@/lib/app-params';

/** Entity name → Postgres table (PrimeOS schema). */
export const DATABASE_REGISTRY = {
  ABTest: 'ab_tests',
  Activity: 'activities',
  AppAnalytics: 'app_analytics',
  AppReview: 'app_reviews',
  AppVersion: 'app_versions',
  Appointment: 'appointments',
  Asset: 'assets',
  AutomationWorkflow: 'automation_workflows',
  BackLink: 'back_links',
  Backlink: 'back_links',
  Budget: 'budgets',
  BusinessStrategy: 'business_strategies',
  Campaign: 'campaigns',
  Channel: 'channels',
  ClientJourney: 'client_journeys',
  ClinicalNote: 'clinical_notes',
  Content: 'contents',
  ConteudoSEO: 'conteudo_seo',
  CrmAppointment: 'crm_appointments',
  CrmSyncSettings: 'crm_sync_settings',
  CrmWorkflow: 'crm_workflows',
  CustomDashboard: 'custom_dashboards',
  Customer: 'customers',
  CustomerSegment: 'customer_segments',
  Dentist: 'dentists',
  DentistBlockout: 'dentist_blockouts',
  Document: 'documents',
  EmailSequence: 'email_sequences',
  Expense: 'expenses',
  FinancialGoal: 'financial_goals',
  FinancialTransaction: 'financial_transactions',
  FollowUp: 'follow_ups',
  FollowUpLog: 'follow_up_logs',
  FollowUpRule: 'follow_up_rules',
  Interaction: 'interactions',
  InventoryItem: 'inventory_items',
  KeyPartner: 'key_partners',
  KnowledgeBase: 'knowledge_bases',
  Lead: 'leads',
  LeadInteraction: 'lead_interactions',
  MarketStrategy: 'market_strategies',
  MarketingStrategy: 'market_strategies',
  MarketingChannel: 'marketing_channels',
  MarketingMetric: 'marketing_metrics',
  MedicalRecord: 'medical_records',
  MobileApp: 'mobile_apps',
  POP: 'pops',
  PalavraChave: 'palavra_chaves',
  PatientRecord: 'patient_records',
  PrimeDelegationTask: 'prime_delegation_tasks',
  PrimeFunnelLead: 'prime_funnel_leads',
  PrimeGrowthStage: 'prime_growth_stages',
  Product: 'products',
  ProjectSEO: 'project_seos',
  ProjetoSEO: 'project_seos',
  RelatorioSEO: 'relatorio_seos',
  ReminderSchedule: 'reminder_schedules',
  ReportSchedule: 'report_schedules',
  Resource: 'resources',
  SOP: 'sops',
  Sale: 'sales',
  SalesScript: 'sales_scripts',
  SupportTicket: 'support_tickets',
  TarefaSEO: 'tarefa_seos',
  Task: 'tasks',
  UserBadge: 'user_badges',
  UserEngagement: 'user_engagements',
  UserPoints: 'user_points',
  ValuePropisition: 'value_propositions',
};

export const ENTITY_ALIASES = {
  MarketingStrategy: 'MarketStrategy',
  ProjetoSEO: 'ProjectSEO',
  Backlink: 'BackLink',
};

const entityCache = new WeakMap();

function resolveTableName(entityName) {
  if (entityName === 'User') return 'profiles';
  const aliased = ENTITY_ALIASES[entityName] || entityName;
  return DATABASE_REGISTRY[aliased] ?? DATABASE_REGISTRY[entityName];
}

function createUserRepository(client) {
  return {
    list: (...args) => createEntity('profiles', client).list(...args),
    filter: (...args) => createEntity('profiles', client).filter(...args),
    get: (...args) => createEntity('profiles', client).get(...args),
    update: (...args) => createEntity('profiles', client).update(...args),
  };
}

function getEntityRepository(client, entityName) {
  const cache = entityCache.get(client) ?? new Map();
  if (!entityCache.has(client)) entityCache.set(client, cache);

  if (cache.has(entityName)) return cache.get(entityName);

  let repo;
  if (entityName === 'User') {
    repo = createUserRepository(client);
  } else {
    const table = resolveTableName(entityName);
    if (!table) throw new Error(`Unknown PrimeOS entity: ${entityName}`);
    repo = createEntity(table, client);
  }

  cache.set(entityName, repo);
  return repo;
}

function createEntitiesProxy(client) {
  return new Proxy(
    {},
    {
      get(_target, name) {
        if (typeof name !== 'string') return undefined;
        return getEntityRepository(client, name);
      },
    }
  );
}

async function uploadFile(client, bucket, { file }) {
  if (!file) throw new Error('No file provided');

  const safeName = String(file.name || 'upload').replace(/[^\w.\-]+/g, '_');
  const path = `public/uploads/${Date.now()}_${safeName}`;

  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return { file_url: data.publicUrl };
}

/**
 * Create a PrimeOS App instance wired to your Supabase backend.
 *
 * @param {object} [config]
 * @param {import('@supabase/supabase-js').SupabaseClient} [config.supabase] Pre-built client
 * @param {string} [config.supabaseUrl]
 * @param {string} [config.supabaseKey] Anon/publishable key
 * @param {string} [config.storageBucket]
 * @param {string} [config.appId]
 * @param {string} [config.appBaseUrl]
 * @param {string} [config.projectId]
 */
export function createPrimeOSApp(config = {}) {
  const isBrowser = typeof window !== 'undefined';

  const client =
    config.supabase ??
    createClient(
      config.supabaseUrl ?? supabaseUrl,
      config.supabaseKey ?? supabaseAnonKey,
      {
        auth: {
          persistSession: isBrowser,
          autoRefreshToken: isBrowser,
          detectSessionInUrl: isBrowser,
        },
      }
    );

  const bucket = config.storageBucket ?? defaultStorageBucket;
  const appId = config.appId ?? appParams?.appId ?? 'com.primeodontologia.os';
  const appBaseUrl =
    config.appBaseUrl ?? appParams?.appBaseUrl ?? (isBrowser ? window.location.origin : '');

  const database = {
    schema: 'public',
    tables: DATABASE_REGISTRY,

    from: (table) => client.from(table),

    rpc: (fn, params) => client.rpc(fn, params),

    entity: (name) => getEntityRepository(client, name),

    async ping() {
      const { error } = await client.from('customers').select('id').limit(1);
      if (error && error.code !== 'PGRST116') throw error;
      return { ok: true, url: config.supabaseUrl ?? supabaseUrl };
    },
  };

  const app = {
    id: appId,
    baseUrl: appBaseUrl,
    version: appParams?.functionsVersion ?? '1.0',
    projectId: config.projectId ?? supabaseProjectId,
    apiUrl: config.supabaseUrl ?? supabaseUrl,
    restUrl: supabaseRestUrl,

    supabase: client,
    database,
    entities: createEntitiesProxy(client),

    auth: {
      me: async () => {
        const { data: { user }, error } = await client.auth.getUser();
        if (error) throw error;
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email,
          name: user.user_metadata?.full_name || user.email,
          role: user.user_metadata?.role || 'user',
          ...user.user_metadata,
        };
      },

      updateMe: async (updates) => {
        const { data, error } = await client.auth.updateUser({ data: updates });
        if (error) throw error;
        return data.user;
      },

      logout: async (redirectTo = '/login.html') => {
        await client.auth.signOut();
        if (isBrowser && redirectTo) window.location.href = redirectTo;
      },

      logUserInApp: async () => {
        const { data: { user } } = await client.auth.getUser();
        return user;
      },

      signInWithPassword: async ({ email, password }) => {
        const { data, error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      },

      signUp: async ({ email, password, options }) => {
        const { data, error } = await client.auth.signUp({ email, password, options });
        if (error) throw error;
        return data;
      },

      getSession: () => client.auth.getSession(),
      onAuthStateChange: (callback) => client.auth.onAuthStateChange(callback),
    },

    db: {
      from: (table) => client.from(table),
    },

    storage: {
      bucket,
      upload: (file, path) =>
        client.storage.from(bucket).upload(path, file, { upsert: false }),
      getPublicUrl: (path) => client.storage.from(bucket).getPublicUrl(path),
    },

    functions: {
      invoke: async (name, body = {}) => client.functions.invoke(name, { body }),
    },

    integrations: {
      Core: {
        UploadFile: (payload) => uploadFile(client, bucket, payload),

        InvokeLLM: async (payload) => {
          const { data, error } = await client.functions.invoke('invokeLLM', { body: payload });
          if (error) throw error;
          return data;
        },

        SendEmail: async (payload) => {
          const { data, error } = await client.functions.invoke('sendEmail', { body: payload });
          if (error) throw error;
          return data;
        },

        ExtractDataFromUploadedFile: async (payload) => {
          const { data, error } = await client.functions.invoke('extractDataFromUploadedFile', {
            body: payload,
          });
          if (error) throw error;
          return data;
        },
      },
    },
  };

  return app;
}

/** Default singleton used across the React app. */
export const primeos = createPrimeOSApp();

/** @deprecated Use createPrimeOSApp */
export const createCustomSdk = createPrimeOSApp;

export { createEntity };
export default primeos;
