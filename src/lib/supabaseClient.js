// ==========================================
// SUPABASE CLIENT INITIALIZATION
// ==========================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Handle Supabase operation result — logs and throws on error.
 * @param {{ data: any, error: any }} result
 * @param {string} operation - description of the operation for logging
 * @returns {any} data on success
 */
export function handleSupabaseError(result, operation = 'Supabase operation') {
  if (result.error) {
    console.error(`[Supabase Error] ${operation}:`, result.error.message);
    throw new Error(`${operation}: ${result.error.message}`);
  }
  return result.data;
}

/**
 * Safe wrapper for Supabase operations that returns { data, error } without throwing.
 */
export async function safeSupabaseCall(promise, operation = 'Supabase operation') {
  try {
    const result = await promise;
    if (result.error) {
      console.error(`[Supabase Error] ${operation}:`, result.error.message);
      return { data: null, error: result.error.message };
    }
    return { data: result.data, error: null };
  } catch (err) {
    console.error(`[Supabase Exception] ${operation}:`, err.message);
    return { data: null, error: err.message };
  }
}
