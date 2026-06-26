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
 * Convert total seconds to a display string (mm:ss).
 * Optionally shows DNF/DNS label for large sentinel values.
 */
export function secondsToTimeString(sec, { showDnf = false } = {}) {
  if (sec === null || sec === undefined || sec === "") return "";
  const s = Number(sec);
  if (showDnf && s >= 9999) return "9999s (DNF/DNS)";
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const pad = (n) => String(n).padStart(2, "0");
  return `${mins}:${pad(secs)}`;
}

/**
 * Format a duration in a human-readable way using the largest useful units.
 */
export function formatDurationLabel(sec, { locale = "ar" } = {}) {
  if (sec === null || sec === undefined || sec === "") return "";

  const totalSeconds = Math.max(0, Number(sec));
  if (!Number.isFinite(totalSeconds)) return "";
  if (totalSeconds === 0) {
    return locale === "ar" ? "0 ثانية" : "0 seconds";
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isArabic = locale === "ar";
  const units = {
    hour: isArabic ? "ساعة" : "hour",
    hours: isArabic ? "ساعات" : "hours",
    minute: isArabic ? "دقيقة" : "minute",
    minutes: isArabic ? "دقائق" : "minutes",
    second: isArabic ? "ثانية" : "second",
    seconds: isArabic ? "ثوانٍ" : "seconds",
  };

  const parts = [];
  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? units.hour : units.hours}`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? units.minute : units.minutes}`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} ${seconds === 1 ? units.second : units.seconds}`);
  }

  return parts.join(isArabic ? " و" : " ");
}

/**
 * Format a gap/difference from first place in a readable way.
 */
export function formatGapLabel(sec, { locale = "ar" } = {}) {
  if (sec === null || sec === undefined || sec === "") return "";

  const totalSeconds = Number(sec);
  if (!Number.isFinite(totalSeconds)) return "";
  if (totalSeconds === 0) return "—";

  const isArabic = locale === "ar";
  const absSeconds = Math.abs(totalSeconds);
  const sign = totalSeconds < 0 ? "-" : "+";

  if (absSeconds < 60) {
    return `${sign}${absSeconds} ${isArabic ? (absSeconds === 1 ? "ثانية" : "ثوانٍ") : absSeconds === 1 ? "second" : "seconds"}`;
  }

  return `${sign}${formatDurationLabel(absSeconds, { locale })}`;
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
