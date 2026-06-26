import { cache, emitStateChange, getSettings } from "./cache";
import { supabase, handleSupabaseError } from "../lib/supabaseClient";

export function getSubstitutions() {
  return cache.substitutions;
}

export async function upsertSubstitution(sub) {
  if (!sub.id) {
    sub.id = `sub_${Date.now()}`;
    cache.substitutions.push(sub);
  } else {
    const index = cache.substitutions.findIndex((item) => item.id === sub.id);
    if (index >= 0) {
      cache.substitutions[index] = sub;
    }
  }

  handleSupabaseError(
    await supabase.from("substitutions").upsert(sub),
    "upsert substitution",
  );
  emitStateChange();
  return sub;
}

export async function executeSubstitution(
  teamNumber,
  slotKey,
  reservePlayerId,
  reason,
  approvingJudge,
  time,
) {
  const originalPlayer = cache.players.find(
    (player) =>
      player.team_number === teamNumber &&
      player.player_key === slotKey &&
      player.status !== "Substituted",
  );
  if (!originalPlayer)
    throw new Error(`Could not find an active player for key ${slotKey}`);

  const replacementPlayer = cache.players.find(
    (player) => player.id === reservePlayerId,
  );
  if (!replacementPlayer) throw new Error("Reserve player not found.");
  if (replacementPlayer.team_number !== teamNumber)
    throw new Error("Replacement player must be from the same team.");
  if (replacementPlayer.player_type !== "Reserve")
    throw new Error("Replacement player must be a reserve.");
  if (replacementPlayer.status === "Substituted")
    throw new Error("Selected reserve player is already substituted.");

  const oldReserveKey = replacementPlayer.player_key;
  originalPlayer.status = "Substituted";
  originalPlayer.player_key = `${originalPlayer.player_key}-SUB`;
  replacementPlayer.player_key = slotKey;
  replacementPlayer.player_type = "Starter";
  replacementPlayer.status = "Ready";

  const newSub = {
    id: `sub_${Date.now()}`,
    player_key: slotKey,
    original_player_name: originalPlayer.full_name,
    original_player_id: originalPlayer.id,
    replacement_player_name: replacementPlayer.full_name,
    replacement_player_id: replacementPlayer.id,
    replacement_player_old_key: oldReserveKey,
    reason,
    approving_judge: approvingJudge,
    substitution_time:
      time ||
      new Date().toLocaleTimeString("ar-LY", {
        hour: "2-digit",
        minute: "2-digit",
      }),
  };

  cache.substitutions.push(newSub);
  await Promise.all([
    supabase.from("players").upsert(originalPlayer),
    supabase.from("players").upsert(replacementPlayer),
    supabase.from("substitutions").upsert(newSub),
  ]);
  emitStateChange();
  return newSub;
}

export async function revertSubstitution(subId) {
  const settings = getSettings();
  if (settings.lock_tournament_day) throw new Error("Settings are locked.");

  const sub = cache.substitutions.find((item) => item.id === subId);
  if (!sub) return false;

  const originalPlayer = cache.players.find(
    (player) => player.id === sub.original_player_id,
  );
  const replacementPlayer = cache.players.find(
    (player) => player.id === sub.replacement_player_id,
  );

  if (originalPlayer) {
    originalPlayer.status = "Ready";
    originalPlayer.player_key = sub.player_key;
  }

  if (replacementPlayer) {
    replacementPlayer.player_key =
      sub.replacement_player_old_key || `${replacementPlayer.team_number}-4`;
    replacementPlayer.player_type = "Reserve";
    replacementPlayer.status = "Ready";
  }

  cache.substitutions = cache.substitutions.filter((item) => item.id !== subId);
  const promises = [supabase.from("substitutions").delete().eq("id", subId)];
  if (originalPlayer)
    promises.push(supabase.from("players").upsert(originalPlayer));
  if (replacementPlayer)
    promises.push(supabase.from("players").upsert(replacementPlayer));

  await Promise.all(promises);
  emitStateChange();
  return true;
}
