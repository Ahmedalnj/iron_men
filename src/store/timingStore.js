import { cache, emitStateChange, getSettings } from "./cache";
import { supabase, handleSupabaseError } from "../lib/supabaseClient";

function normalizeTimingScalar(val) {
  if (val === null || val === undefined || val === "") return null;

  const numericValue = Number(val);
  if (!Number.isFinite(numericValue)) return null;

  return numericValue;
}

function normalizeTimingScalarForStorage(val) {
  const numericValue = normalizeTimingScalar(val);
  if (numericValue === null) return null;

  return numericValue;
}

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
    leg1_time: normalizeTimingScalar(entry.leg1_time),
    leg2_time: normalizeTimingScalar(entry.leg2_time),
    leg3_time: normalizeTimingScalar(entry.leg3_time),
    leg4_time: normalizeTimingScalar(entry.leg4_time),
    leg5_time: normalizeTimingScalar(entry.leg5_time),
    leg6_time: normalizeTimingScalar(entry.leg6_time),
    barriers_knocked: normalizeTimingScalar(entry.barriers_knocked) ?? 0,
    obstacles_skipped: normalizeTimingScalar(entry.obstacles_skipped) ?? 0,
    outside_help_count: normalizeTimingScalar(entry.outside_help_count) ?? 0,
    player1_penalty_sec: normalizeTimingScalar(entry.player1_penalty_sec) ?? 0,
    player2_penalty_sec: normalizeTimingScalar(entry.player2_penalty_sec) ?? 0,
    player3_penalty_sec: normalizeTimingScalar(entry.player3_penalty_sec) ?? 0,
    player4_penalty_sec: normalizeTimingScalar(entry.player4_penalty_sec) ?? 0,
    player5_penalty_sec: normalizeTimingScalar(entry.player5_penalty_sec) ?? 0,
    player6_penalty_sec: normalizeTimingScalar(entry.player6_penalty_sec) ?? 0,
  };

  const persisted = {
    ...cleaned,
    leg1_time: normalizeTimingScalarForStorage(cleaned.leg1_time),
    leg2_time: normalizeTimingScalarForStorage(cleaned.leg2_time),
    leg3_time: normalizeTimingScalarForStorage(cleaned.leg3_time),
    leg4_time: normalizeTimingScalarForStorage(cleaned.leg4_time),
    leg5_time: normalizeTimingScalarForStorage(cleaned.leg5_time),
    leg6_time: normalizeTimingScalarForStorage(cleaned.leg6_time),
    barriers_knocked:
      normalizeTimingScalarForStorage(cleaned.barriers_knocked) ?? 0,
    obstacles_skipped:
      normalizeTimingScalarForStorage(cleaned.obstacles_skipped) ?? 0,
    outside_help_count:
      normalizeTimingScalarForStorage(cleaned.outside_help_count) ?? 0,
    player1_penalty_sec:
      normalizeTimingScalarForStorage(cleaned.player1_penalty_sec) ?? 0,
    player2_penalty_sec:
      normalizeTimingScalarForStorage(cleaned.player2_penalty_sec) ?? 0,
    player3_penalty_sec:
      normalizeTimingScalarForStorage(cleaned.player3_penalty_sec) ?? 0,
    player4_penalty_sec:
      normalizeTimingScalarForStorage(cleaned.player4_penalty_sec) ?? 0,
    player5_penalty_sec:
      normalizeTimingScalarForStorage(cleaned.player5_penalty_sec) ?? 0,
    player6_penalty_sec:
      normalizeTimingScalarForStorage(cleaned.player6_penalty_sec) ?? 0,
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
    await supabase.from("timing").upsert(persisted),
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
