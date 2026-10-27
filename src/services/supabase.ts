import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GrantApplication } from '../types/grant';

const KNOWN_PROJECT_REF = 'lquzcxkjfsysssqgxvbm';
const KNOWN_PROJECT_URL = `https://${KNOWN_PROJECT_REF}.supabase.co`;

const STORAGE_KEYS = {
  ANON_KEY: 'crg_supabase_anon_key_override',
  URL: 'crg_supabase_url_override',
};

const isPlaceholder = (val: string | undefined): boolean => {
  if (!val) return true;
  const clean = val.trim();
  return (
    clean === '' ||
    clean.includes('your-project-id') ||
    clean.includes('your-anon-public-key') ||
    clean.includes('MY_')
  );
};

export function getActiveSupabaseUrl(): string {
  const custom = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.URL) : null;
  if (custom && !isPlaceholder(custom)) return custom.trim();

  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  if (envUrl && !isPlaceholder(envUrl)) return envUrl.trim();

  return KNOWN_PROJECT_URL;
}

export function getActiveSupabaseAnonKey(): string {
  const custom = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS.ANON_KEY) : null;
  if (custom && !isPlaceholder(custom)) return custom.trim();

  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envKey && !isPlaceholder(envKey)) return envKey.trim();

  return '';
}

export function isSupabaseConfigured(): boolean {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseAnonKey();
  return !isPlaceholder(url) && !isPlaceholder(key) && key.length > 20;
}

export function getSupabaseConfig() {
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseAnonKey();
  const isCustom = typeof window !== 'undefined' && Boolean(localStorage.getItem(STORAGE_KEYS.ANON_KEY));

  return {
    url,
    projectRef: KNOWN_PROJECT_REF,
    hasKey: Boolean(key && !isPlaceholder(key) && key.length > 20),
    isConfigured: isSupabaseConfigured(),
    isCustom,
  };
}

let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    clientInstance = null;
    return null;
  }
  const url = getActiveSupabaseUrl();
  const key = getActiveSupabaseAnonKey();
  if (!clientInstance) {
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  }
  return clientInstance;
}

export function setCustomSupabaseCredentials(anonKey: string, customUrl?: string): boolean {
  try {
    if (anonKey && anonKey.trim()) {
      localStorage.setItem(STORAGE_KEYS.ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
    }

    if (customUrl && customUrl.trim()) {
      localStorage.setItem(STORAGE_KEYS.URL, customUrl.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.URL);
    }

    // Reset cached instance
    clientInstance = null;
    getSupabaseClient();
    return true;
  } catch (err) {
    console.error('Failed to save Supabase credentials:', err);
    return false;
  }
}

export function clearCustomSupabaseCredentials(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANON_KEY);
    localStorage.removeItem(STORAGE_KEYS.URL);
    clientInstance = null;
  } catch (err) {
    console.error('Failed to clear Supabase credentials:', err);
  }
}

// Backwards-compatible export
export const supabase = getSupabaseClient();

/**
 * Diagnostic test to verify live connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableCount?: number;
  tablesFound?: string[];
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase anon public key is missing. Please paste your anon key from Supabase Project Settings > API.',
    };
  }

  try {
    // Attempt querying the applications table
    const { data, error } = await client
      .from('applications')
      .select('id, product_name, status')
      .limit(5);

    if (error) {
      // If table doesn't exist yet
      if (
        error.code === '42P01' ||
        error.message.includes('relation "applications" does not exist') ||
        error.message.includes('not found')
      ) {
        return {
          success: false,
          message: `Connected to Supabase (${KNOWN_PROJECT_REF}), but the "applications" table was not found. Please run db/schema.sql in your Supabase SQL Editor. Error: ${error.message}`,
        };
      }
      return {
        success: false,
        message: `Supabase error: ${error.message} (Code: ${error.code || 'unknown'})`,
      };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase (${KNOWN_PROJECT_REF})! Found ${data ? data.length : 0} live record(s) in "applications" table.`,
      tableCount: data ? data.length : 0,
      tablesFound: ['applications'],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Failed to connect to Supabase: ${msg}`,
    };
  }
}

/**
 * Direct API sync: Upserts applications and companies into live Supabase PostgreSQL
 */
export async function syncApplicationsToSupabase(apps: GrantApplication[]): Promise<{
  success: boolean;
  message: string;
  syncedCount: number;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase is not configured or anon key is missing. Data saved to local platform store.',
      syncedCount: 0,
    };
  }

  try {
    let synced = 0;
    for (const app of apps) {
      const c = app.company;
      const a = app.applicant;
      const t = app.technology;
      const m = app.market;

      // 1. Upsert company
      const companyPayload = {
        name: c.name,
        ssm_number: c.ssmNumber,
        incorporation_year: c.incorporationYear,
        state: c.state,
        city: c.city,
        annual_turnover: c.annualTurnover,
        turnover_tier: c.turnoverTier,
        paid_up_capital: c.paidUpCapital,
        employee_count: c.employeeCount,
        sector: c.sector,
        website: c.website || null,
        address: c.address,
      };

      const { data: compData } = await client
        .from('companies')
        .upsert(companyPayload, { onConflict: 'ssm_number' })
        .select('id')
        .single();

      const companyId = compData?.id || null;

      // 2. Upsert application
      const appPayload = {
        id: app.id,
        company_id: companyId,
        submission_source: app.submissionSource,
        jotform_submission_id: app.jotformSubmissionId || null,
        status: app.status,
        applicant_name: a.fullName,
        applicant_designation: a.designation,
        applicant_email: a.email,
        applicant_phone: a.phone,
        identification_no: a.identificationNo,
        product_name: t.productName,
        tagline: t.tagline || null,
        trl_level: t.trlLevel,
        product_description: t.productDescription,
        ip_status: t.ipStatus,
        production_readiness: t.productionReadiness || null,
        current_capacity: t.currentCapacity || null,
        target_market: m.targetMarket || null,
        tam_sam_som: m.tamSamSom || null,
        funding_requested: m.fundingRequested,
        revenue_model: m.revenueModel || null,
        export_potential: m.exportPotential,
        assigned_reviewer_1_id: app.assignedReviewers[0] || null,
        assigned_reviewer_2_id: app.assignedReviewers[1] || null,
        composite_score: app.compositeScore ?? null,
        baseline_passed: app.baselinePassed ?? false,
        assigned_analyst_id: app.assignedAnalystId || null,
        assigned_analyst_name: app.assignedAnalystName || null,
        analyst_notes: app.analystNotes || null,
      };

      const { error: appErr } = await client
        .from('applications')
        .upsert(appPayload, { onConflict: 'id' });

      if (appErr) {
        console.warn('Failed to sync application to Supabase:', appErr.message);
      } else {
        synced++;
      }
    }

    return {
      success: true,
      message: `Successfully synced ${synced} application(s) directly to Supabase PostgreSQL!`,
      syncedCount: synced,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Supabase sync error: ${msg}`,
      syncedCount: 0,
    };
  }
}
