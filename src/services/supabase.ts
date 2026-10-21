import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
