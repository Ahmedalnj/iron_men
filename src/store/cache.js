import { supabase, safeSupabaseCall } from "../lib/supabaseClient.js";

export const cache = {
  settings: {
    tournament_name: "بطولة البطل الحديدي 2026",
    tournament_date: "2026-06-27",
    starters_per_team: 3,
    max_reserves_per_team: 3,
    barrier_knock_penalty_sec: 5,
    obstacle_skip_penalty_sec: 10,
    outside_help_penalty_sec: 10,
    dnf_dns_injury_value: 9999,
    lock_tournament_day: false,
  },
  teams: [],
  players: [],
  checkins: [],
  timing: [],
  incidents: [],
  substitutions: [],
};

export const DEFAULT_SETTINGS = {
  id: 1,
  tournament_name: "بطولة البطل الحديدي 2026",
  tournament_date: "2026-06-27",
  starters_per_team: 3,
  max_reserves_per_team: 3,
  barrier_knock_penalty_sec: 5,
  obstacle_skip_penalty_sec: 10,
  outside_help_penalty_sec: 10,
  dnf_dns_injury_value: 9999,
  lock_tournament_day: false,
};

export function getCache() {
  return cache;
}

export function emitStateChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("state-updated"));
  }
}

export function setupRealtimeSubscriptions() {
  return initDatabase();
}

export function getSettings() {
  return cache.settings;
}

export async function updateSettings(settings) {
  const current = getSettings();
  const payload = current.lock_tournament_day
    ? { ...current, lock_tournament_day: settings.lock_tournament_day }
    : { ...current, ...settings };

  cache.settings = payload;

  const { error } = await safeSupabaseCall(
    supabase.from("settings").upsert(payload),
    "Update settings",
  );
  if (error) throw new Error(error);

  emitStateChange();
}

export async function fetchAllFromSupabase() {
  try {
    const [
      { data: settings, error: errSettings },
      { data: teams, error: errTeams },
      { data: players, error: errPlayers },
      { data: checkins, error: errCheckins },
      { data: timing, error: errTiming },
      { data: incidents, error: errIncidents },
      { data: substitutions, error: errSubstitutions },
    ] = await Promise.all([
      supabase.from("settings").select("*").single(),
      supabase.from("teams").select("*"),
      supabase.from("players").select("*"),
      supabase.from("checkins").select("*"),
      supabase.from("timing").select("*"),
      supabase.from("incidents").select("*"),
      supabase.from("substitutions").select("*"),
    ]);

    if (errSettings && errSettings.code !== "PGRST116") {
      console.error("Error fetching settings:", errSettings);
    }
    if (errTeams) console.error("Error fetching teams:", errTeams);
    if (errPlayers) console.error("Error fetching players:", errPlayers);
    if (errCheckins) console.error("Error fetching checkins:", errCheckins);
    if (errTiming) console.error("Error fetching timing:", errTiming);
    if (errIncidents) console.error("Error fetching incidents:", errIncidents);
    if (errSubstitutions)
      console.error("Error fetching substitutions:", errSubstitutions);

    if (settings) cache.settings = settings;
    if (teams) cache.teams = teams;
    if (players) cache.players = players;
    if (checkins) cache.checkins = checkins;
    if (timing) cache.timing = timing;
    if (incidents) cache.incidents = incidents;
    if (substitutions) cache.substitutions = substitutions;

    const errors = [];
    if (errTeams) errors.push(`Teams: ${errTeams.message || errTeams}`);
    if (errPlayers) errors.push(`Players: ${errPlayers.message || errPlayers}`);
    if (errCheckins)
      errors.push(`Checkins: ${errCheckins.message || errCheckins}`);
    if (errTiming) errors.push(`Timing: ${errTiming.message || errTiming}`);
    if (errIncidents)
      errors.push(`Incidents: ${errIncidents.message || errIncidents}`);
    if (errSubstitutions)
      errors.push(
        `Substitutions: ${errSubstitutions.message || errSubstitutions}`,
      );
    if (errSettings && errSettings.code !== "PGRST116") {
      errors.unshift(`Settings: ${errSettings.message || errSettings}`);
    }

    emitStateChange();

    if (errors.length > 0) {
      throw new Error(errors.join("; "));
    }
  } catch (err) {
    console.error("Error refreshing Supabase cache:", err);
    throw err;
  }
}

let realtimeChannel = null;
let pollingInterval = null;

function startPolling() {
  if (!pollingInterval) {
    pollingInterval = setInterval(fetchAllFromSupabase, 2000);
  }
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

export function initDatabase() {
  fetchAllFromSupabase();

  try {
    realtimeChannel = supabase
      .channel("public-db-changes")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        fetchAllFromSupabase();
      })
      .subscribe((status) => {
        console.log(`Supabase Realtime subscription status: ${status}`);
        if (status === "SUBSCRIBED") {
          console.log("Realtime is connected. Polling disabled.");
          stopPolling();
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          console.warn(
            "Realtime is closed or has channel error. Falling back to polling.",
          );
          startPolling();
        }
      });
  } catch (err) {
    console.error(
      "Realtime subscription setup failed, falling back to polling:",
      err,
    );
    startPolling();
  }

  // Fallback timer just in case state transition takes time
  startPolling();
}

export async function resetDatabase() {
  try {
    await Promise.all([
      supabase.from("substitutions").delete().neq("id", ""),
      supabase.from("incidents").delete().neq("id", ""),
      supabase.from("timing").delete().neq("team_number", ""),
      supabase.from("checkins").delete().neq("player_key", ""),
      supabase.from("players").delete().neq("id", ""),
    ]);
    await supabase.from("teams").delete().neq("team_number", "");

    await supabase.from("settings").upsert(DEFAULT_SETTINGS);

    await fetchAllFromSupabase();
  } catch (err) {
    console.error("Failed to reset Supabase DB:", err);
    throw err;
  }
}

export function exportDatabaseState() {
  return JSON.stringify(cache, null, 2);
}

export async function importDatabaseState(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) await supabase.from("settings").upsert(data.settings);
    if (data.teams) {
      await supabase.from("teams").delete().neq("team_number", "");
      await supabase.from("teams").insert(data.teams);
    }
    if (data.players) {
      await supabase.from("players").delete().neq("id", "");
      await supabase.from("players").insert(data.players);
    }
    if (data.checkIns || data.checkins) {
      await supabase.from("checkins").delete().neq("player_key", "");
      await supabase.from("checkins").insert(data.checkIns || data.checkins);
    }
    if (data.timing) {
      await supabase.from("timing").delete().neq("team_number", "");
      await supabase.from("timing").insert(data.timing);
    }
    if (data.incidents) {
      await supabase.from("incidents").delete().neq("id", "");
      await supabase.from("incidents").insert(data.incidents);
    }
    if (data.substitutions) {
      await supabase.from("substitutions").delete().neq("id", "");
      await supabase.from("substitutions").insert(data.substitutions);
    }
    await fetchAllFromSupabase();
    return true;
  } catch (e) {
    console.error("Failed to import state to Supabase:", e);
    throw e;
  }
}
