import { supabase, safeSupabaseCall } from '../lib/supabaseClient.js';
import { cache, fetchAllFromSupabase } from './cache.js';

export function getSettings() {
  return cache.settings;
}

export async function updateSettings(settings) {
  const current = getSettings();
  let payload;
  if (current.lock_tournament_day) {
    payload = { ...current, lock_tournament_day: settings.lock_tournament_day };
  } else {
    payload = { ...current, ...settings };
  }
  
  cache.settings = payload;
  
  const { error } = await safeSupabaseCall(
    supabase.from('settings').upsert(payload),
    'Update settings'
  );
  if (error) throw new Error(error);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('state-updated'));
  }
}

export function getTeams() {
  return cache.teams.map(t => {
    let status = 'Pending';
    if (t.payment_status === 'Paid' || t.payment_status === 'Waived') {
      status = 'Approved';
    }
    return {
      ...t,
      team_status: status
    };
  });
}

export async function upsertTeam(team) {
  const settings = getSettings();
  if (settings.lock_tournament_day) {
    throw new Error("Tournament is locked. No changes allowed.");
  }
  
  const index = cache.teams.findIndex(t => t.team_number === team.team_number);
  if (index >= 0) {
    cache.teams[index] = { ...cache.teams[index], ...team };
  } else {
    cache.teams.push(team);
  }

  const { error } = await safeSupabaseCall(
    supabase.from('teams').upsert(team),
    'Upsert team'
  );
  if (error) {
    // Revert local cache on failure
    await fetchAllFromSupabase();
    throw new Error(error);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('state-updated'));
  }
}

export async function deleteTeam(teamNumber) {
  const settings = getSettings();
  if (settings.lock_tournament_day) {
    throw new Error("Tournament is locked. No changes allowed.");
  }
  
  // Optimistic updates
  const originalTeams = [...cache.teams];
  const originalPlayers = [...cache.players];
  const originalCheckins = [...cache.checkins];
  const originalTiming = [...cache.timing];

  cache.teams = cache.teams.filter(t => t.team_number !== teamNumber);
  cache.players = cache.players.filter(p => p.team_number !== teamNumber);
  cache.checkins = cache.checkins.filter(c => c.team_number !== teamNumber);
  cache.timing = cache.timing.filter(t => t.team_number !== teamNumber);
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('state-updated'));
  }

  const { error } = await safeSupabaseCall(
    supabase.from('teams').delete().eq('team_number', teamNumber),
    'Delete team'
  );

  if (error) {
    // Revert on error
    cache.teams = originalTeams;
    cache.players = originalPlayers;
    cache.checkins = originalCheckins;
    cache.timing = originalTiming;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('state-updated'));
    }
    throw new Error(error);
  }
}
