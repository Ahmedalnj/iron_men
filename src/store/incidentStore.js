import { cache, emitStateChange } from "./cache";
import { supabase, handleSupabaseError } from "../lib/supabaseClient";

export function getIncidents() {
  return cache.incidents;
}

export async function upsertIncident(incident) {
  if (!incident.id) {
    incident.id = `inc_${Date.now()}`;
    cache.incidents.push(incident);
  } else {
    const index = cache.incidents.findIndex((item) => item.id === incident.id);
    if (index >= 0) {
      cache.incidents[index] = incident;
    }
  }

  handleSupabaseError(
    await supabase.from("incidents").upsert(incident),
    "upsert incident",
  );
  emitStateChange();
  return incident;
}

export async function deleteIncident(id) {
  cache.incidents = cache.incidents.filter((incident) => incident.id !== id);
  handleSupabaseError(
    await supabase.from("incidents").delete().eq("id", id),
    "delete incident",
  );
  emitStateChange();
  return true;
}
