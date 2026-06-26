import { cache, emitStateChange, getSettings } from "./cache";
import { supabase, handleSupabaseError } from "../lib/supabaseClient";

export function getTimingEntries() {
  return cache.timing;
}

export function getTimingEntryByTeam(teamNumber) {
  const entry = cache.timing.find((item) => item.team_number === teamNumber);
  if (entry) return entry;

  return {
    team_number: teamNumber,
    leg1_time: null,
    leg2_time: null,
    leg3_time: null,
    leg4_time: null,
    leg5_time: null,
    leg6_time: null,
    barriers_knocked: 0,
    obstacles_skipped: 0,
    outside_help_count: 0,
    player1_penalty_sec: 0,
    player2_penalty_sec: 0,
    player3_penalty_sec: 0,
    player4_penalty_sec: 0,
    player5_penalty_sec: 0,
    player6_penalty_sec: 0,
    result_status: "Pending",
    judge_name: "",
  };
}

export async function upsertTimingEntry(entry) {
  const cleaned = {
    ...entry,
    barriers_knocked: Number(entry.barriers_knocked || 0),
    obstacles_skipped: Number(entry.obstacles_skipped || 0),
    outside_help_count: Number(entry.outside_help_count || 0),
    player1_penalty_sec: Number(entry.player1_penalty_sec || 0),
    player2_penalty_sec: Number(entry.player2_penalty_sec || 0),
    player3_penalty_sec: Number(entry.player3_penalty_sec || 0),
    player4_penalty_sec: Number(entry.player4_penalty_sec || 0),
    player5_penalty_sec: Number(entry.player5_penalty_sec || 0),
    player6_penalty_sec: Number(entry.player6_penalty_sec || 0),
  };

  const index = cache.timing.findIndex(
    (item) => item.team_number === entry.team_number,
  );
  if (index >= 0) {
    cache.timing[index] = cleaned;
  } else {
    cache.timing.push(cleaned);
  }

  handleSupabaseError(
    await supabase.from("timing").upsert(cleaned),
    "upsert timing",
  );
  emitStateChange();
  return cleaned;
}

export async function deleteTimingEntry(teamNumber) {
  cache.timing = cache.timing.filter(
    (entry) => entry.team_number !== teamNumber,
  );
  handleSupabaseError(
    await supabase.from("timing").delete().eq("team_number", teamNumber),
    "delete timing",
  );
  emitStateChange();
  return true;
}
