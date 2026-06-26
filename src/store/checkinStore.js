import { cache, emitStateChange } from "./cache";
import { supabase, handleSupabaseError } from "../lib/supabaseClient";

export function getCheckIns() {
  return cache.checkins;
}

export function getUncheckedPlayers() {
  const players = cache.players;
  const checkIns = cache.checkins;

  return players.filter((player) => {
    if (player.status === "Substituted") return false;
    const checkin = checkIns.find(
      (entry) => entry.player_key === player.player_key,
    );
    return (
      !checkin || checkin.present === "Absent" || !checkin.cleared_to_compete
    );
  });
}

export async function upsertCheckIn(checkIn) {
  const key = `${checkIn.team_number}-${checkIn.leg_number}`;
  const entry = { ...checkIn, player_key: key };

  const index = cache.checkins.findIndex((item) => item.player_key === key);
  if (index >= 0) {
    cache.checkins[index] = { ...cache.checkins[index], ...entry };
  } else {
    cache.checkins.push(entry);
  }

  handleSupabaseError(
    await supabase.from("checkins").upsert(entry),
    "upsert checkin",
  );
  emitStateChange();
  return entry;
}

export async function deleteCheckIn(playerKey) {
  cache.checkins = cache.checkins.filter(
    (entry) => entry.player_key !== playerKey,
  );
  handleSupabaseError(
    await supabase.from("checkins").delete().eq("player_key", playerKey),
    "delete checkin",
  );
  emitStateChange();
  return true;
}
