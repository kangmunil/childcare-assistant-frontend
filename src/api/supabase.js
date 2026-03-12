import { createClient } from '@supabase/supabase-js';

const supabaseUrl = typeof import.meta.env.VITE_SUPABASE_URL === 'string'
  ? import.meta.env.VITE_SUPABASE_URL.trim()
  : '';
const supabaseKey = typeof import.meta.env.VITE_SUPABASE_ANON_KEY === 'string'
  ? import.meta.env.VITE_SUPABASE_ANON_KEY.trim()
  : '';

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
const canUseDisabledClient = !isSupabaseConfigured && import.meta.env.PROD !== true;
const disabledClientMessage = 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable auth flows.';

function createDisabledAuthResult(message, data = null) {
  return {
    data,
    error: new Error(message),
  };
}

function createDisabledSupabaseClient() {
  const auth = {
    async getSession() {
      return {
        data: { session: null },
        error: null,
      };
    },

    onAuthStateChange(callback) {
      queueMicrotask(() => {
        callback('INITIAL_SESSION', null);
      });

      return {
        data: {
          subscription: {
            unsubscribe() {},
          },
        },
      };
    },

    async signInWithOAuth() {
      return createDisabledAuthResult(disabledClientMessage);
    },

    async signInWithPassword() {
      return createDisabledAuthResult(disabledClientMessage, {
        user: null,
        session: null,
      });
    },

    async signUp() {
      return createDisabledAuthResult(disabledClientMessage, {
        user: null,
        session: null,
      });
    },

    async signOut() {
      return { error: null };
    },

    async resetPasswordForEmail() {
      return { error: new Error(disabledClientMessage) };
    },

    async updateUser() {
      return { error: new Error(disabledClientMessage) };
    },
  };

  return { auth };
}

if (!isSupabaseConfigured && canUseDisabledClient) {
  console.warn('[supabase] Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. Falling back to a disabled client in non-production mode.');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : canUseDisabledClient
    ? createDisabledSupabaseClient()
    : (() => {
        throw new Error(disabledClientMessage);
      })();
