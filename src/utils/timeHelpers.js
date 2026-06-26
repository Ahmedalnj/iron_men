// ==========================================
// SHARED TIME UTILITIES
// ==========================================

/**
 * Convert a time string (mm:ss, hh:mm:ss, or raw seconds) to total seconds.
 * Handles Arabic decimal separator.
 */
export function timeStringToSeconds(val) {
  if (val === null || val === undefined || val === "") return null;
  val = String(val).trim();
  if (/^\d+$/.test(val)) return parseInt(val, 10);

  // Replace Arabic decimal
  val = val.replace("٫", ".");

  const parts = val.split(":");
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  } else if (parts.length === 3) {
    const hrs = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    const secs = parseFloat(parts[2]) || 0;
    return hrs * 3600 + mins * 60 + secs;
  }
  return parseFloat(val) || null;
}

/**
 * Convert total seconds to a display string in MM:SS.CC format.
 */
export function secondsToTimeString(sec, { showDnf = false } = {}) {
  if (sec === null || sec === undefined || sec === "") return "";
  const s = Number(sec);
  if (!Number.isFinite(s)) return "";
  if (showDnf && s >= 9999) return `${formatTime(s)} (DNF/DNS)`;
  return formatTime(s);
}

/**
 * Format a duration in MM:SS.CC format.
 */
export function formatTime(sec, { forceSign = false } = {}) {
  if (sec === null || sec === undefined || sec === "") return "";

  const totalSeconds = Number(sec);
  if (!Number.isFinite(totalSeconds)) return "";
  if (totalSeconds === 0) return "00:00.00";

  const isNegative = totalSeconds < 0;
  const absSeconds = Math.abs(totalSeconds);
  const minutes = Math.floor(absSeconds / 60);
  const seconds = Math.floor(absSeconds % 60);
  const centiseconds = Math.floor((absSeconds % 1) * 100);
  const sign = isNegative ? "-" : forceSign ? "+" : "";

  return `${sign}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

/**
 * Format a Date object to a localized clock string.
 */
export function formatClock(date, locale = "ar-LY") {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get current time as HH:MM string.
 */
export function getCurrentTimeString() {
  return new Date().toTimeString().slice(0, 5);
}
