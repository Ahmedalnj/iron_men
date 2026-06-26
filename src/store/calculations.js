import { cache, getSettings } from "./cache";
import { getTeams } from "./teamStore";

export function getTeamResultsCalculated() {
  const settings = getSettings();
  const teams = getTeams();
  const timings = cache.timing;
  const players = cache.players;

  return teams.map((team) => {
    const timing = timings.find(
      (entry) => entry.team_number === team.team_number,
    ) || {
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

    const legPlayers = {};
    for (let i = 1; i <= 6; i++) {
      const player = players.find(
        (entry) =>
          entry.team_number === team.team_number &&
          entry.player_key === `${team.team_number}-${i}`,
      );
      legPlayers[`leg${i}_player_name`] = player ? player.full_name : "";
    }

    const barrierPen =
      timing.barriers_knocked * settings.barrier_knock_penalty_sec;
    const skipPen =
      timing.obstacles_skipped * settings.obstacle_skip_penalty_sec;
    const helpPen =
      timing.outside_help_count * settings.outside_help_penalty_sec;
    const playerPenSum =
      (timing.player1_penalty_sec || 0) +
      (timing.player2_penalty_sec || 0) +
      (timing.player3_penalty_sec || 0) +
      (timing.player4_penalty_sec || 0) +
      (timing.player5_penalty_sec || 0) +
      (timing.player6_penalty_sec || 0);
    const penaltySeconds = barrierPen + skipPen + helpPen + playerPenSum;

    let rawSum = 0;
    let hasTimes = false;
    for (let i = 1; i <= 6; i++) {
      const time = timing[`leg${i}_time`];
      if (time !== null && time !== undefined && time !== "") {
        rawSum += Number(time);
        hasTimes = true;
      }
    }

    let totalResultSeconds = 0;
    if (hasTimes) {
      totalResultSeconds = rawSum + penaltySeconds;
    }

    let status = "⏳ لم يُسجَّل";
    let isIncomplete = false;

    if (timing.result_status === "Pending") {
      status = "⏳ لم يُسجَّل";
    } else if (
      ["DNS", "DNF", "Injured", "Disqualified", "Withdrawn"].includes(
        timing.result_status,
      )
    ) {
      status = "❌ Incomplete";
      isIncomplete = true;
    } else if (timing.result_status === "Finished") {
      status = "✅ Finished";
    }

    let rankingTimeSeconds = totalResultSeconds;
    if (isIncomplete) {
      rankingTimeSeconds = settings.dnf_dns_injury_value;
    } else if (!hasTimes && timing.result_status === "Pending") {
      rankingTimeSeconds = null;
    }

    return {
      team_number: team.team_number,
      team_name: team.team_name,
      payment_status: team.payment_status,
      team_status: team.team_status,
      leg_players: legPlayers,
      timing,
      penalty_seconds: penaltySeconds,
      total_result_seconds: totalResultSeconds,
      ranking_time_seconds: rankingTimeSeconds,
      status,
      is_incomplete: isIncomplete,
      has_times: hasTimes,
      result_status: timing.result_status,
    };
  });
}

export function getLiveLeaderboard() {
  const results = getTeamResultsCalculated();
  const rankable = results.filter(
    (result) =>
      result.has_times ||
      result.is_incomplete ||
      result.result_status !== "Pending",
  );

  rankable.sort((a, b) => {
    if (a.ranking_time_seconds === null) return 1;
    if (b.ranking_time_seconds === null) return -1;
    if (a.ranking_time_seconds !== b.ranking_time_seconds) {
      return a.ranking_time_seconds - b.ranking_time_seconds;
    }
    return a.team_number.localeCompare(b.team_number);
  });

  let rank = 1;
  const leaderboard = rankable.map((team) => ({ ...team, rank: rank++ }));
  const firstPlaceTime =
    leaderboard.length > 0 && !leaderboard[0].is_incomplete
      ? leaderboard[0].total_result_seconds
      : null;

  return leaderboard
    .map((team) => {
      let gap = null;
      if (
        firstPlaceTime !== null &&
        !team.is_incomplete &&
        team.total_result_seconds !== null
      ) {
        gap = team.total_result_seconds - firstPlaceTime;
      }
      return { ...team, gap_to_first: gap };
    })
    .slice(0, 20);
}

export function getOverallPlayerRanking() {
  const players = cache.players;
  const timings = cache.timing;
  const teams = getTeams();
  const playerRanks = [];

  players.forEach((player) => {
    if (player.status === "Substituted") return;

    const team = teams.find(
      (entry) => entry.team_number === player.team_number,
    );
    const timing = timings.find(
      (entry) => entry.team_number === player.team_number,
    );
    const suffixStr = player.player_key.split("-")[1];
    const legIdx = parseInt(suffixStr, 10);

    let rawTime = null;
    let penalty = 0;

    if (timing && legIdx >= 1 && legIdx <= 6) {
      rawTime = timing[`leg${legIdx}_time`];
      penalty = timing[`player${legIdx}_penalty_sec`] || 0;
    }

    const hasTime = rawTime !== null && rawTime !== undefined && rawTime !== "";
    const finalTime = hasTime ? Number(rawTime) + Number(penalty) : null;

    playerRanks.push({
      player_id: player.id,
      player_name: player.full_name,
      player_key: player.player_key,
      team_number: player.team_number,
      team_name: team ? team.team_name : "غير مسجّل",
      raw_time_seconds: hasTime ? Number(rawTime) : null,
      penalty_seconds: penalty,
      final_time_seconds: finalTime,
      status: player.status,
    });
  });

  const rankablePlayers = playerRanks.filter(
    (player) => player.final_time_seconds !== null,
  );
  rankablePlayers.sort((a, b) => {
    if (a.final_time_seconds !== b.final_time_seconds) {
      return a.final_time_seconds - b.final_time_seconds;
    }
    return a.player_name.localeCompare(b.player_name);
  });

  return rankablePlayers.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}

export function getNotificationLog() {
  const incidents = cache.incidents;
  const results = getTeamResultsCalculated();
  const players = cache.players;
  const teams = getTeams();
  const notifications = [];

  incidents.forEach((incident) => {
    const teamNum = incident.player_key.split("-")[0];
    const team = teams.find((entry) => entry.team_number === teamNum);
    const player = players.find(
      (entry) =>
        entry.player_key === incident.player_key &&
        entry.status !== "Substituted",
    );
    const playerName = player ? player.full_name : "غير مسجّل";
    const teamName = team ? team.team_name : "غير مسجّل";
    const details = `${incident.incident_type} - ${incident.body_part} (${incident.severity})`;
    const action = incident.continued
      ? "✅ Continue"
      : "🔄 Review substitution";
    const isInjury = incident.incident_type === "Injury";

    notifications.push({
      id: incident.id,
      type: "incident",
      icon: isInjury ? "🚨" : "⚠️",
      team_number: teamNum,
      team_name: teamName,
      player_name: playerName,
      details,
      action,
      time: incident.incident_time || "00:00",
      timestamp: Date.now(),
    });
  });

  results.forEach((result) => {
    if (result.is_incomplete) {
      const action =
        result.result_status === "DNF" || result.result_status === "Injured"
          ? "⚠️ Did not finish — review substitution"
          : result.result_status === "DNS"
            ? "❌ Did not start"
            : "🚨 Injury — activate reserve";

      notifications.push({
        id: `timing_${result.team_number}_${result.result_status}`,
        type: "status_alert",
        icon: "🛑",
        team_number: result.team_number,
        team_name: result.team_name,
        player_name: "كل الفريق / Team Roster",
        details: `${result.result_status === "DNF" ? "لم ينهِ السباق DNF" : result.result_status === "DNS" ? "لم يبدأ السباق DNS" : result.result_status}`,
        action,
        time: "--:--",
        timestamp: Date.now() - 1000,
      });
    }
  });

  notifications.sort((a, b) => b.time.localeCompare(a.time));
  return notifications;
}
