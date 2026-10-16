import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Storage keys for custom user credentials
const SUPABASE_URL_KEY = 'iponta_supabase_url';
const SUPABASE_ANON_KEY = 'iponta_supabase_anon_key';
const LEGACY_SUPABASE_URL_KEY = 'balanse_ph_supabase_url';
const LEGACY_SUPABASE_ANON_KEY = 'balanse_ph_supabase_anon_key';

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  const win = typeof window !== 'undefined' ? (window as any) : {};
  const serverConfig = win.__SUPABASE_CONFIG__ || {};

  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const storedUrl = localStorage.getItem(SUPABASE_URL_KEY) || localStorage.getItem(LEGACY_SUPABASE_URL_KEY) || serverConfig.url || envUrl;
  const storedKey = localStorage.getItem(SUPABASE_ANON_KEY) || localStorage.getItem(LEGACY_SUPABASE_ANON_KEY) || serverConfig.anonKey || envKey;

  return {
    url: (storedUrl || '').trim(),
    anonKey: (storedKey || '').trim(),
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function setSupabaseCredentials(url: string, anonKey: string) {
  localStorage.setItem(SUPABASE_URL_KEY, url.trim());
  localStorage.setItem(SUPABASE_ANON_KEY, anonKey.trim());
  supabaseInstance = null; // Force fresh instance creation
}

export function clearSupabaseCredentials() {
  localStorage.removeItem(SUPABASE_URL_KEY);
  localStorage.removeItem(SUPABASE_ANON_KEY);
  localStorage.removeItem(LEGACY_SUPABASE_URL_KEY);
  localStorage.removeItem(LEGACY_SUPABASE_ANON_KEY);
  supabaseInstance = null;
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || url.includes('YOUR_SUPABASE') || anonKey.includes('YOUR_SUPABASE')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Supabase initialization warning:', e);
      return null;
    }
  }

  return supabaseInstance;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url, anonKey);
    const { error } = await tempClient.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 means no row found which is OK
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected to Supabase project successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Could not connect to Supabase' };
  }
}
