// ==========================================
// INPUT VALIDATION UTILITIES
// ==========================================

/**
 * Validate team data before save.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTeam(data, existingTeams = [], isEdit = false) {
  const errors = [];

  if (!data.team_number || !data.team_number.trim()) {
    errors.push('رمز الفريق مطلوب / Team number is required');
  } else if (!/^[A-Za-z0-9-]+$/.test(data.team_number.trim())) {
    errors.push('رمز الفريق يجب أن يحتوي حروف وأرقام فقط / Team number must be alphanumeric');
  }

  if (!isEdit) {
    const duplicate = existingTeams.find(
      (t) => t.team_number === data.team_number?.trim()
    );
    if (duplicate) {
      errors.push('رمز الفريق مستخدم مسبقاً / Team number already exists');
    }
  }

  if (!data.team_name || !data.team_name.trim()) {
    errors.push('اسم الفريق مطلوب / Team name is required');
  }

  if (
    data.amount_paid !== undefined &&
    data.amount_paid !== null &&
    data.amount_paid !== ''
  ) {
    const amount = Number(data.amount_paid);
    if (isNaN(amount) || amount < 0) {
      errors.push('المبلغ المدفوع يجب أن يكون رقماً صحيحاً / Amount must be a positive number');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate player data before save.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePlayer(data, settings = {}, existingPlayers = []) {
  const errors = [];

  if (!data.full_name || !data.full_name.trim()) {
    errors.push('اسم اللاعب مطلوب / Player name is required');
  }

  if (!data.team_number) {
    errors.push('يجب اختيار فريق / Team must be selected');
  }

  if (!['Starter', 'Reserve'].includes(data.player_type)) {
    errors.push('نوع اللاعب غير صحيح / Invalid player type');
  }

  // Check roster limits for new players
  if (!data.id && data.team_number && settings.starters_per_team) {
    const teamPlayers = existingPlayers.filter(
      (p) => p.team_number === data.team_number && p.status !== 'Substituted'
    );

    if (data.player_type === 'Starter') {
      const starterCount = teamPlayers.filter((p) => p.player_type === 'Starter').length;
      if (starterCount >= settings.starters_per_team) {
        errors.push(
          `الحد الأقصى للأساسيين ${settings.starters_per_team} / Max starters reached (${settings.starters_per_team})`
        );
      }
    }

    if (data.player_type === 'Reserve') {
      const reserveCount = teamPlayers.filter((p) => p.player_type === 'Reserve').length;
      if (reserveCount >= settings.max_reserves_per_team) {
        errors.push(
          `الحد الأقصى للاحتياط ${settings.max_reserves_per_team} / Max reserves reached (${settings.max_reserves_per_team})`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate timing entries.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTiming(rawLegTimes) {
  const errors = [];

  Object.entries(rawLegTimes).forEach(([key, val]) => {
    if (val !== '' && val !== null && val !== undefined) {
      const parsed = parseTimingValue(val);
      if (parsed !== null && parsed < 0) {
        errors.push(`${key}: الوقت لا يمكن أن يكون سالباً / Time cannot be negative`);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validate incident data.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateIncident(data) {
  const errors = [];

  if (!data.player_key) {
    errors.push('يجب اختيار لاعب / Player must be selected');
  }

  if (!data.incident_time) {
    errors.push('وقت الحادثة مطلوب / Incident time is required');
  }

  if (!data.incident_type) {
    errors.push('نوع الحادثة مطلوب / Incident type is required');
  }

  return { valid: errors.length === 0, errors };
}

// Internal helper
function parseTimingValue(val) {
  if (!val) return null;
  val = String(val).trim();
  if (/^\d+$/.test(val)) return parseInt(val, 10);
  val = val.replace('٫', '.');
  const parts = val.split(':');
  if (parts.length === 2) {
    return (parseInt(parts[0], 10) || 0) * 60 + (parseFloat(parts[1]) || 0);
  }
  return parseFloat(val) || null;
}
