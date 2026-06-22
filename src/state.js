// ==========================================
// STATE MANAGEMENT & SUPABASE DATABASE CLIENT
// ==========================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialise the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// In-Memory cache for synchronous reactive reading in page components
let cache = {
  settings: {
    tournament_name: "بطولة البطل الحديدي 2026",
    tournament_date: "2026-06-27",
    starters_per_team: 3,
    max_reserves_per_team: 3,
    barrier_knock_penalty_sec: 5,
    obstacle_skip_penalty_sec: 10,
    outside_help_penalty_sec: 10,
    dnf_dns_injury_value: 9999,
    lock_tournament_day: false
  },
  teams: [],
  players: [],
  checkins: [],
  timing: [],
  incidents: [],
  substitutions: []
};

// Seed Data definition (for reset purposes)
const DEFAULT_SETTINGS = {
  id: 1,
  tournament_name: "بطولة البطل الحديدي 2026",
  tournament_date: "2026-06-27",
  starters_per_team: 3,
  max_reserves_per_team: 3,
  barrier_knock_penalty_sec: 5,
  obstacle_skip_penalty_sec: 10,
  outside_help_penalty_sec: 10,
  dnf_dns_injury_value: 9999,
  lock_tournament_day: false
};

// Fetch all database tables from Supabase and cache them in memory
export async function fetchAllFromSupabase() {
  try {
    const [
      { data: settings },
      { data: teams },
      { data: players },
      { data: checkins },
      { data: timing },
      { data: incidents },
      { data: substitutions }
    ] = await Promise.all([
      supabase.from('settings').select('*').single(),
      supabase.from('teams').select('*'),
      supabase.from('players').select('*'),
      supabase.from('checkins').select('*'),
      supabase.from('timing').select('*'),
      supabase.from('incidents').select('*'),
      supabase.from('substitutions').select('*')
    ]);

    if (settings) cache.settings = settings;
    if (teams) cache.teams = teams;
    if (players) cache.players = players;
    if (checkins) cache.checkins = checkins;
    if (timing) cache.timing = timing;
    if (incidents) cache.incidents = incidents;
    if (substitutions) cache.substitutions = substitutions;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('state-updated'));
    }
  } catch (err) {
    console.error("Error refreshing Supabase cache:", err);
  }
}

// Database Initialization
export function initDatabase() {
  // Perform initial query load
  fetchAllFromSupabase();
  // Start polling cache updates from database every 2 seconds
  setInterval(fetchAllFromSupabase, 2000);
}

// Reset Database / Wipe and seed remote database
export async function resetDatabase() {
  try {
    // 1. Wipe everything
    await Promise.all([
      supabase.from('substitutions').delete().neq('id', ''),
      supabase.from('incidents').delete().neq('id', ''),
      supabase.from('timing').delete().neq('team_number', ''),
      supabase.from('checkins').delete().neq('player_key', ''),
      supabase.from('players').delete().neq('id', '')
    ]);
    await supabase.from('teams').delete().neq('team_number', '');

    // 2. Insert Settings
    await supabase.from('settings').upsert(DEFAULT_SETTINGS);
    
    // Refresh local cache
    await fetchAllFromSupabase();
  } catch (err) {
    console.error("Failed to reset Supabase DB:", err);
  }
}

// Export / Import entire state
export function exportDatabaseState() {
  return JSON.stringify(cache, null, 2);
}

export async function importDatabaseState(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.settings) await supabase.from('settings').upsert(data.settings);
    if (data.teams) {
      await supabase.from('teams').delete().neq('team_number', '');
      await supabase.from('teams').insert(data.teams);
    }
    if (data.players) {
      await supabase.from('players').delete().neq('id', '');
      await supabase.from('players').insert(data.players);
    }
    if (data.checkIns || data.checkins) {
      await supabase.from('checkins').delete().neq('player_key', '');
      await supabase.from('checkins').insert(data.checkIns || data.checkins);
    }
    if (data.timing) {
      await supabase.from('timing').delete().neq('team_number', '');
      await supabase.from('timing').insert(data.timing);
    }
    if (data.incidents) {
      await supabase.from('incidents').delete().neq('id', '');
      await supabase.from('incidents').insert(data.incidents);
    }
    if (data.substitutions) {
      await supabase.from('substitutions').delete().neq('id', '');
      await supabase.from('substitutions').insert(data.substitutions);
    }
    await fetchAllFromSupabase();
    return true;
  } catch (e) {
    console.error("Failed to import state to Supabase:", e);
    return false;
  }
}

// ==========================================
// CRUD OPERATORS (READ CACHE & WRITE CLOUD)
// ==========================================

// Settings
export function getSettings() {
  return cache.settings;
}

export async function updateSettings(settings) {
  const current = getSettings();
  if (current.lock_tournament_day) {
    const payload = { ...current, lock_tournament_day: settings.lock_tournament_day };
    cache.settings = payload;
    await supabase.from('settings').upsert(payload);
    return;
  }
  const payload = { ...current, ...settings };
  cache.settings = payload;
  await supabase.from('settings').upsert(payload);
}

// Teams
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
  if (settings.lock_tournament_day) return;
  
  const index = cache.teams.findIndex(t => t.team_number === team.team_number);
  if (index >= 0) {
    cache.teams[index] = { ...cache.teams[index], ...team };
  } else {
    cache.teams.push(team);
  }
  await supabase.from('teams').upsert(team);
}

export async function deleteTeam(teamNumber) {
  const settings = getSettings();
  if (settings.lock_tournament_day) return;
  
  cache.teams = cache.teams.filter(t => t.team_number !== teamNumber);
  cache.players = cache.players.filter(p => p.team_number !== teamNumber);
  cache.checkins = cache.checkins.filter(c => c.team_number !== teamNumber);
  cache.timing = cache.timing.filter(t => t.team_number !== teamNumber);
  
  await supabase.from('teams').delete().eq('team_number', teamNumber);
}

// Players
export function getPlayers() {
  return cache.players;
}

export function getPlayersByTeam(teamNumber) {
  return getPlayers().filter(p => p.team_number === teamNumber);
}

export async function upsertPlayer(player) {
  const settings = getSettings();
  if (settings.lock_tournament_day) return;
  
  const teamPlayers = cache.players.filter(p => p.team_number === player.team_number && p.id !== player.id);
  const starterCount = teamPlayers.filter(p => p.player_type === 'Starter' && p.status !== 'Substituted').length;
  const reserveCount = teamPlayers.filter(p => p.player_type === 'Reserve' && p.status !== 'Substituted').length;

  if (!player.id) {
    if (player.player_type === 'Starter' && starterCount >= settings.starters_per_team) {
      throw new Error(`Team already has the maximum of ${settings.starters_per_team} starters.`);
    }
    if (player.player_type === 'Reserve' && reserveCount >= settings.max_reserves_per_team) {
      throw new Error(`Team already has the maximum of ${settings.max_reserves_per_team} reserves.`);
    }
    
    const allTeamPlayers = cache.players.filter(p => p.team_number === player.team_number);
    const suffix = allTeamPlayers.length + 1;
    player.player_key = `${player.team_number}-${suffix}`;
    player.id = `${player.team_number}_p_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    cache.players.push(player);
  } else {
    const index = cache.players.findIndex(p => p.id === player.id);
    if (index >= 0) {
      const oldPlayer = cache.players[index];
      if (oldPlayer.player_type !== player.player_type) {
        if (player.player_type === 'Starter' && starterCount >= settings.starters_per_team) {
          throw new Error(`Team already has the maximum of ${settings.starters_per_team} starters.`);
        }
        if (player.player_type === 'Reserve' && reserveCount >= settings.max_reserves_per_team) {
          throw new Error(`Team already has the maximum of ${settings.max_reserves_per_team} reserves.`);
        }
      }
      cache.players[index] = { ...cache.players[index], ...player };
    }
  }
  await supabase.from('players').upsert(player);
  return player;
}

export async function deletePlayer(playerId) {
  const settings = getSettings();
  if (settings.lock_tournament_day) return;
  
  const player = cache.players.find(p => p.id === playerId);
  if (!player) return;

  const key = player.player_key;
  const team = player.team_number;

  // 1. Delete locally from cache
  cache.players = cache.players.filter(p => p.id !== playerId);
  cache.checkins = cache.checkins.filter(c => c.player_key !== key);

  // 2. Cascade delete leg times/penalties on timing entry
  const timingIndex = cache.timing.findIndex(t => t.team_number === team);
  if (timingIndex >= 0) {
    const timing = cache.timing[timingIndex];
    const suffixStr = key.split('-')[1];
    const legIdx = parseInt(suffixStr, 10);
    if (legIdx >= 1 && legIdx <= 6) {
      timing[`leg${legIdx}_time`] = null;
      timing[`player${legIdx}_penalty_sec`] = 0;
      cache.timing[timingIndex] = timing;
      await supabase.from('timing').upsert(timing);
    }
  }

  cache.incidents = cache.incidents.filter(i => i.player_key !== key);
  cache.substitutions = cache.substitutions.filter(s => s.player_key !== key && s.original_player_name !== player.full_name && s.replacement_player_name !== player.full_name);

  // 3. Delete in Supabase
  await Promise.all([
    supabase.from('players').delete().eq('id', playerId),
    supabase.from('checkins').delete().eq('player_key', key),
    supabase.from('incidents').delete().eq('player_key', key),
    supabase.from('substitutions').delete().eq('player_key', key)
  ]);
}

// CheckIns
export function getCheckIns() {
  return cache.checkins;
}

export async function upsertCheckIn(checkIn) {
  const key = `${checkIn.team_number}-${checkIn.leg_number}`;
  const entry = {
    ...checkIn,
    player_key: key
  };

  const index = cache.checkins.findIndex(c => c.player_key === key);
  if (index >= 0) {
    cache.checkins[index] = { ...cache.checkins[index], ...entry };
  } else {
    cache.checkins.push(entry);
  }
  await supabase.from('checkins').upsert(entry);
}

export async function deleteCheckIn(playerKey) {
  cache.checkins = cache.checkins.filter(c => c.player_key !== playerKey);
  await supabase.from('checkins').delete().eq('player_key', playerKey);
}

// Helper: Players not yet checked in
export function getUncheckedPlayers() {
  const players = getPlayers();
  const checkIns = getCheckIns();
  
  return players.filter(p => {
    if (p.status === 'Substituted') return false;
    const checkin = checkIns.find(c => c.player_key === p.player_key);
    return !checkin || checkin.present === 'Absent' || !checkin.cleared_to_compete;
  });
}

// TimingEntries
export function getTimingEntries() {
  return cache.timing;
}

export function getTimingEntryByTeam(teamNumber) {
  const entry = cache.timing.find(e => e.team_number === teamNumber);
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
    result_status: 'Pending',
    judge_name: ''
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
    player6_penalty_sec: Number(entry.player6_penalty_sec || 0)
  };

  const index = cache.timing.findIndex(t => t.team_number === entry.team_number);
  if (index >= 0) {
    cache.timing[index] = cleaned;
  } else {
    cache.timing.push(cleaned);
  }
  await supabase.from('timing').upsert(cleaned);
}

export async function deleteTimingEntry(teamNumber) {
  cache.timing = cache.timing.filter(t => t.team_number !== teamNumber);
  await supabase.from('timing').delete().eq('team_number', teamNumber);
}

// Incidents
export function getIncidents() {
  return cache.incidents;
}

export async function upsertIncident(incident) {
  if (!incident.id) {
    incident.id = `inc_${Date.now()}`;
    cache.incidents.push(incident);
  } else {
    const index = cache.incidents.findIndex(i => i.id === incident.id);
    if (index >= 0) {
      cache.incidents[index] = incident;
    }
  }
  await supabase.from('incidents').upsert(incident);
}

export async function deleteIncident(id) {
  cache.incidents = cache.incidents.filter(i => i.id !== id);
  await supabase.from('incidents').delete().eq('id', id);
}

// Substitutions
export function getSubstitutions() {
  return cache.substitutions;
}

export async function upsertSubstitution(sub) {
  if (!sub.id) {
    sub.id = `sub_${Date.now()}`;
    cache.substitutions.push(sub);
  } else {
    const index = cache.substitutions.findIndex(s => s.id === sub.id);
    if (index >= 0) {
      cache.substitutions[index] = sub;
    }
  }
  await supabase.from('substitutions').upsert(sub);
}

// Substitution Process flow logic
export async function executeSubstitution(teamNumber, slotKey, reservePlayerId, reason, approvingJudge, time) {
  // 1. Find the player currently occupying slotKey (e.g. A-2)
  const originalPlayer = cache.players.find(p => p.team_number === teamNumber && p.player_key === slotKey && p.status !== 'Substituted');
  if (!originalPlayer) throw new Error(`Could not find an active player for key ${slotKey}`);
  
  // 2. Find the replacement reserve player
  const replacementPlayer = cache.players.find(p => p.id === reservePlayerId);
  if (!replacementPlayer) throw new Error("Reserve player not found.");
  if (replacementPlayer.team_number !== teamNumber) throw new Error("Replacement player must be from the same team.");
  if (replacementPlayer.player_type !== 'Reserve') throw new Error("Replacement player must be a reserve.");
  if (replacementPlayer.status === 'Substituted') throw new Error("Selected reserve player is already substituted.");

  const oldReserveKey = replacementPlayer.player_key;

  // 3. Mark original player as Substituted
  originalPlayer.status = 'Substituted';
  originalPlayer.player_key = `${originalPlayer.player_key}-SUB`;

  // 4. Update replacement player key to slotKey and type to Starter
  replacementPlayer.player_key = slotKey;
  replacementPlayer.player_type = 'Starter';
  replacementPlayer.status = 'Ready';

  // 5. Log the substitution
  const newSub = {
    id: `sub_${Date.now()}`,
    player_key: slotKey,
    original_player_name: originalPlayer.full_name,
    original_player_id: originalPlayer.id,
    replacement_player_name: replacementPlayer.full_name,
    replacement_player_id: replacementPlayer.id,
    replacement_player_old_key: oldReserveKey,
    reason: reason,
    approving_judge: approvingJudge,
    substitution_time: time || new Date().toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })
  };
  
  cache.substitutions.push(newSub);

  // 6. Save updates in Supabase
  await Promise.all([
    supabase.from('players').upsert(originalPlayer),
    supabase.from('players').upsert(replacementPlayer),
    supabase.from('substitutions').upsert(newSub)
  ]);

  return true;
}

export async function revertSubstitution(subId) {
  const settings = getSettings();
  if (settings.lock_tournament_day) throw new Error("Settings are locked.");

  const sub = cache.substitutions.find(s => s.id === subId);
  if (!sub) return false;

  const originalPlayer = cache.players.find(p => p.id === sub.original_player_id);
  const replacementPlayer = cache.players.find(p => p.id === sub.replacement_player_id);

  if (originalPlayer) {
    originalPlayer.status = 'Ready';
    originalPlayer.player_key = sub.player_key; 
  }

  if (replacementPlayer) {
    replacementPlayer.player_key = sub.replacement_player_old_key || `${replacementPlayer.team_number}-4`;
    replacementPlayer.player_type = 'Reserve';
    replacementPlayer.status = 'Ready';
  }

  cache.substitutions = cache.substitutions.filter(s => s.id !== subId);

  // Delete swap logs and restore original state
  const promises = [
    supabase.from('substitutions').delete().eq('id', subId)
  ];
  if (originalPlayer) promises.push(supabase.from('players').upsert(originalPlayer));
  if (replacementPlayer) promises.push(supabase.from('players').upsert(replacementPlayer));

  await Promise.all(promises);
  return true;
}

// ==========================================
// DYNAMIC VIEW CALCULATIONS (FORMULAS)
// ==========================================

export function getPlayerBySlotKey(teamNumber, suffix) {
  const key = `${teamNumber}-${suffix}`;
  return cache.players.find(p => p.player_key === key && p.status !== 'Substituted');
}

export function getTeamResultsCalculated() {
  const settings = getSettings();
  const teams = getTeams();
  const timings = cache.timing;
  const players = cache.players;

  return teams.map(team => {
    const timing = timings.find(t => t.team_number === team.team_number) || {
      leg1_time: null, leg2_time: null, leg3_time: null, leg4_time: null, leg5_time: null, leg6_time: null,
      barriers_knocked: 0, obstacles_skipped: 0, outside_help_count: 0,
      player1_penalty_sec: 0, player2_penalty_sec: 0, player3_penalty_sec: 0, player4_penalty_sec: 0, player5_penalty_sec: 0, player6_penalty_sec: 0,
      result_status: 'Pending', judge_name: ''
    };

    const legPlayers = {};
    for (let i = 1; i <= 6; i++) {
      const p = players.find(x => x.team_number === team.team_number && x.player_key === `${team.team_number}-${i}`);
      legPlayers[`leg${i}_player_name`] = p ? p.full_name : '';
    }

    const barrierPen = timing.barriers_knocked * settings.barrier_knock_penalty_sec;
    const skipPen = timing.obstacles_skipped * settings.obstacle_skip_penalty_sec;
    const helpPen = timing.outside_help_count * settings.outside_help_penalty_sec;
    const playerPenSum = (
      (timing.player1_penalty_sec || 0) +
      (timing.player2_penalty_sec || 0) +
      (timing.player3_penalty_sec || 0) +
      (timing.player4_penalty_sec || 0) +
      (timing.player5_penalty_sec || 0) +
      (timing.player6_penalty_sec || 0)
    );
    const penalty_seconds = barrierPen + skipPen + helpPen + playerPenSum;

    let raw_sum = 0;
    let hasTimes = false;
    for (let i = 1; i <= 6; i++) {
      const time = timing[`leg${i}_time`];
      if (time !== null && time !== undefined && time !== '') {
        raw_sum += Number(time);
        hasTimes = true;
      }
    }

    let total_result_seconds = 0;
    if (hasTimes) {
      total_result_seconds = raw_sum + penalty_seconds;
    }

    let status = '⏳ لم يُسجَّل';
    let is_incomplete = false;

    if (timing.result_status === 'Pending') {
      status = '⏳ لم يُسجَّل';
    } else if (['DNS', 'DNF', 'Injured', 'Disqualified', 'Withdrawn'].includes(timing.result_status)) {
      status = '❌ Incomplete';
      is_incomplete = true;
    } else if (timing.result_status === 'Finished') {
      status = '✅ Finished';
    }

    let ranking_time_seconds = total_result_seconds;
    if (is_incomplete) {
      ranking_time_seconds = settings.dnf_dns_injury_value;
    } else if (!hasTimes && timing.result_status === 'Pending') {
      ranking_time_seconds = null;
    }

    return {
      team_number: team.team_number,
      team_name: team.team_name,
      payment_status: team.payment_status,
      team_status: team.team_status,
      leg_players: legPlayers,
      timing: timing,
      penalty_seconds: penalty_seconds,
      total_result_seconds: total_result_seconds,
      ranking_time_seconds: ranking_time_seconds,
      status: status,
      is_incomplete: is_incomplete,
      has_times: hasTimes,
      result_status: timing.result_status
    };
  });
}

export function getLiveLeaderboard() {
  const results = getTeamResultsCalculated();
  const rankable = results.filter(r => r.has_times || r.is_incomplete || r.result_status !== 'Pending');

  rankable.sort((a, b) => {
    if (a.ranking_time_seconds === null) return 1;
    if (b.ranking_time_seconds === null) return -1;
    if (a.ranking_time_seconds !== b.ranking_time_seconds) {
      return a.ranking_time_seconds - b.ranking_time_seconds;
    }
    return a.team_number.localeCompare(b.team_number);
  });

  let rank = 1;
  const leaderboard = rankable.map(team => {
    return {
      ...team,
      rank: rank++
    };
  });

  const firstPlaceTime = leaderboard.length > 0 && !leaderboard[0].is_incomplete ? leaderboard[0].total_result_seconds : null;

  return leaderboard.map(team => {
    let gap = null;
    if (firstPlaceTime !== null && !team.is_incomplete && team.total_result_seconds !== null) {
      gap = team.total_result_seconds - firstPlaceTime;
    }
    return {
      ...team,
      gap_to_first: gap
    };
  }).slice(0, 20);
}

export function getOverallPlayerRanking() {
  const players = cache.players;
  const timings = cache.timing;
  const teams = getTeams();

  const playerRanks = [];

  players.forEach(player => {
    if (player.status === 'Substituted') return;

    const team = teams.find(t => t.team_number === player.team_number);
    const timing = timings.find(t => t.team_number === player.team_number);
    
    const suffixStr = player.player_key.split('-')[1];
    const legIdx = parseInt(suffixStr, 10);
    
    let raw_time = null;
    let penalty = 0;
    
    if (timing && legIdx >= 1 && legIdx <= 6) {
      raw_time = timing[`leg${legIdx}_time`];
      penalty = timing[`player${legIdx}_penalty_sec`] || 0;
    }

    const hasTime = raw_time !== null && raw_time !== undefined && raw_time !== '';
    const final_time = hasTime ? Number(raw_time) + Number(penalty) : null;

    playerRanks.push({
      player_id: player.id,
      player_name: player.full_name,
      player_key: player.player_key,
      team_number: player.team_number,
      team_name: team ? team.team_name : 'غير مسجّل',
      raw_time_seconds: hasTime ? Number(raw_time) : null,
      penalty_seconds: penalty,
      final_time_seconds: final_time,
      status: player.status
    });
  });

  const rankablePlayers = playerRanks.filter(p => p.final_time_seconds !== null);

  rankablePlayers.sort((a, b) => {
    if (a.final_time_seconds !== b.final_time_seconds) {
      return a.final_time_seconds - b.final_time_seconds;
    }
    return a.player_name.localeCompare(b.player_name);
  });

  return rankablePlayers.map((p, idx) => ({
    ...p,
    rank: idx + 1
  }));
}

export function getNotificationLog() {
  const incidents = cache.incidents;
  const results = getTeamResultsCalculated();
  const players = cache.players;
  const teams = getTeams();

  const notifications = [];

  incidents.forEach(inc => {
    const teamNum = inc.player_key.split('-')[0];
    const team = teams.find(t => t.team_number === teamNum);
    const player = players.find(p => p.player_key === inc.player_key && p.status !== 'Substituted');
    
    const playerName = player ? player.full_name : 'غير مسجّل';
    const teamName = team ? team.team_name : 'غير مسجّل';
    const details = `${inc.incident_type} - ${inc.body_part} (${inc.severity})`;
    const action = inc.continued ? '✅ Continue' : '🔄 Review substitution';
    const isInjury = inc.incident_type === 'Injury';

    notifications.push({
      id: inc.id,
      type: 'incident',
      icon: isInjury ? '🚨' : '⚠️',
      team_number: teamNum,
      team_name: teamName,
      player_name: playerName,
      details: details,
      action: action,
      time: inc.incident_time || '00:00',
      timestamp: Date.now()
    });
  });

  results.forEach(res => {
    if (res.is_incomplete) {
      const action = res.result_status === 'DNF' || res.result_status === 'Injured'
        ? '⚠️ Did not finish — review substitution' 
        : res.result_status === 'DNS' 
          ? '❌ Did not start' 
          : '🚨 Injury — activate reserve';

      notifications.push({
        id: `timing_${res.team_number}_${res.result_status}`,
        type: 'status_alert',
        icon: '🛑',
        team_number: res.team_number,
        team_name: res.team_name,
        player_name: 'كل الفريق / Team Roster',
        details: `${res.result_status === 'DNF' ? 'لم ينهِ السباق DNF' : res.result_status === 'DNS' ? 'لم يبدأ السباق DNS' : res.result_status}`,
        action: action,
        time: '--:--',
        timestamp: Date.now() - 1000
      });
    }
  });

  notifications.sort((a, b) => b.time.localeCompare(a.time));
  return notifications;
}
