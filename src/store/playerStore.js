import { supabase, safeSupabaseCall } from "../lib/supabaseClient.js";
import { cache, fetchAllFromSupabase } from "./cache.js";
import { getSettings } from "./teamStore.js";

export function getPlayers() {
  return cache.players;
}

export function getPlayersByTeam(teamNumber) {
  return getPlayers().filter((p) => p.team_number === teamNumber);
}

export function getPlayerBySlotKey(slotKey) {
  return getPlayers().find((player) => player.player_key === slotKey) || null;
}

export async function upsertPlayer(player) {
  const settings = getSettings();
  if (settings.lock_tournament_day) {
    throw new Error("Tournament is locked. No changes allowed.");
  }

  const teamPlayers = cache.players.filter(
    (p) => p.team_number === player.team_number && p.id !== player.id,
  );
  const starterCount = teamPlayers.filter(
    (p) => p.player_type === "Starter" && p.status !== "Substituted",
  ).length;
  const reserveCount = teamPlayers.filter(
    (p) => p.player_type === "Reserve" && p.status !== "Substituted",
  ).length;

  const playerCopy = { ...player };

  if (!playerCopy.id) {
    if (
      playerCopy.player_type === "Starter" &&
      starterCount >= settings.starters_per_team
    ) {
      throw new Error(
        `Team already has the maximum of ${settings.starters_per_team} starters.`,
      );
    }
    if (
      playerCopy.player_type === "Reserve" &&
      reserveCount >= settings.max_reserves_per_team
    ) {
      throw new Error(
        `Team already has the maximum of ${settings.max_reserves_per_team} reserves.`,
      );
    }

    const allTeamPlayers = cache.players.filter(
      (p) => p.team_number === playerCopy.team_number,
    );
    const suffix = allTeamPlayers.length + 1;
    playerCopy.player_key = `${playerCopy.team_number}-${suffix}`;
    playerCopy.id = `${playerCopy.team_number}_p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    cache.players.push(playerCopy);
  } else {
    const index = cache.players.findIndex((p) => p.id === playerCopy.id);
    if (index >= 0) {
      const oldPlayer = cache.players[index];
      if (oldPlayer.player_type !== playerCopy.player_type) {
        if (
          playerCopy.player_type === "Starter" &&
          starterCount >= settings.starters_per_team
        ) {
          throw new Error(
            `Team already has the maximum of ${settings.starters_per_team} starters.`,
          );
        }
        if (
          playerCopy.player_type === "Reserve" &&
          reserveCount >= settings.max_reserves_per_team
        ) {
          throw new Error(
            `Team already has the maximum of ${settings.max_reserves_per_team} reserves.`,
          );
        }
      }
      cache.players[index] = playerCopy;
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("state-updated"));
  }

  const { error } = await safeSupabaseCall(
    supabase.from("players").upsert(playerCopy),
    "Upsert player",
  );

  if (error) {
    await fetchAllFromSupabase();
    throw new Error(error);
  }

  return playerCopy;
}

export async function deletePlayer(playerId) {
  const settings = getSettings();
  if (settings.lock_tournament_day) {
    throw new Error("Tournament is locked. No changes allowed.");
  }

  const player = cache.players.find((p) => p.id === playerId);
  if (!player) return;

  const key = player.player_key;
  const team = player.team_number;

  // Make a backup for reversion
  const backupPlayers = JSON.parse(JSON.stringify(cache.players));
  const backupCheckins = JSON.parse(JSON.stringify(cache.checkins));
  const backupTiming = JSON.parse(JSON.stringify(cache.timing));
  const backupIncidents = JSON.parse(JSON.stringify(cache.incidents));
  const backupSubstitutions = JSON.parse(JSON.stringify(cache.substitutions));

  // 1. Delete locally from cache
  cache.players = cache.players.filter((p) => p.id !== playerId);
  cache.checkins = cache.checkins.filter((c) => c.player_key !== key);

  // 2. Cascade delete leg times/penalties on timing entry
  const timingIndex = cache.timing.findIndex((t) => t.team_number === team);
  let updatedTiming = null;
  if (timingIndex >= 0) {
    const timing = { ...cache.timing[timingIndex] };
    const suffixStr = key.split("-")[1];
    const legIdx = parseInt(suffixStr, 10);
    if (legIdx >= 1 && legIdx <= 6) {
      timing[`leg${legIdx}_time`] = null;
      timing[`player${legIdx}_penalty_sec`] = 0;
      cache.timing[timingIndex] = timing;
      updatedTiming = timing;
    }
  }

  cache.incidents = cache.incidents.filter((i) => i.player_key !== key);
  cache.substitutions = cache.substitutions.filter(
    (s) =>
      s.player_key !== key &&
      s.original_player_name !== player.full_name &&
      s.replacement_player_name !== player.full_name,
  );

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("state-updated"));
  }

  // 3. Delete in Supabase
  const promises = [
    safeSupabaseCall(
      supabase.from("players").delete().eq("id", playerId),
      "Delete player",
    ),
    safeSupabaseCall(
      supabase.from("checkins").delete().eq("player_key", key),
      "Delete checkins associated with player",
    ),
    safeSupabaseCall(
      supabase.from("incidents").delete().eq("player_key", key),
      "Delete incidents associated with player",
    ),
    safeSupabaseCall(
      supabase.from("substitutions").delete().eq("player_key", key),
      "Delete substitutions associated with player",
    ),
  ];

  if (updatedTiming) {
    promises.push(
      safeSupabaseCall(
        supabase.from("timing").upsert(updatedTiming),
        "Reset timing leg after player delete",
      ),
    );
  }

  const results = await Promise.all(promises);
  const errorResult = results.find((r) => r.error);

  if (errorResult) {
    // Revert cache on any error
    cache.players = backupPlayers;
    cache.checkins = backupCheckins;
    cache.timing = backupTiming;
    cache.incidents = backupIncidents;
    cache.substitutions = backupSubstitutions;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("state-updated"));
    }
    throw new Error(errorResult.error);
  }
}
