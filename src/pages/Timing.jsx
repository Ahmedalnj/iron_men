import React, { useState, useEffect } from "react";
import {
  getTeams,
  getPlayers,
  getSettings,
  getTimingEntryByTeam,
  upsertTimingEntry,
  deleteTimingEntry,
} from "../state";
import { useAppContext } from "../context/AppContext";
import { validateTiming } from "../utils/validation";
import { secondsToTimeString, timeStringToSeconds } from "../utils/timeHelpers";
import { Save, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";

const formatDuration = (totalSeconds, locale = "en", options = {}) => {
  const seconds = Number(totalSeconds);
  if (!Number.isFinite(seconds)) return "";

  const absSeconds = Math.abs(seconds);
  const minutes = Math.floor(absSeconds / 60);
  const remainderSeconds = absSeconds % 60;
  const isArabic = locale === "ar";
  const parts = [];

  if (minutes > 0) {
    parts.push(isArabic ? `${minutes} دقيقة${minutes === 1 ? "" : ""}` : `${minutes} min`);
  }

  if (remainderSeconds > 0 || parts.length === 0) {
    parts.push(
      isArabic
        ? `${remainderSeconds} ثانية${remainderSeconds === 1 ? "" : "ٍ"}`
        : `${remainderSeconds} sec`,
    );
  }

  const formatted = isArabic ? parts.join(" و") : parts.join(" ");
  if (options.forceSign) {
    if (seconds > 0) return `+${formatted}`;
    if (seconds < 0) return `-${formatted}`;
  }

  return formatted;
};

export default function Timing({ t, role, syncTick }) {
  const { toast, confirm } = useAppContext();
  const canEdit = role === "admin" || role === "timekeeper";
  const locale = t("yes") === "نعم" ? "ar" : "en";

  const [teams, setTeams] = useState([]);
  const [settings, setSettings] = useState({});
  const [selectedTeam, setSelectedTeam] = useState("");

  // Form variables
  const [timing, setTiming] = useState({});
  const [rawLegTimes, setRawLegTimes] = useState({
    leg1: "",
    leg2: "",
    leg3: "",
    leg4: "",
    leg5: "",
    leg6: "",
  });

  // Live computed values
  const [liveTotals, setLiveTotals] = useState({
    penaltySec: 0,
    rawSumSec: 0,
    totalResultSec: 0,
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Load setup data
  useEffect(() => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    setSettings(getSettings());
    if (loadedTeams.length > 0) {
      setSelectedTeam((prev) => prev || loadedTeams[0].team_number);
    }
  }, [syncTick]);

  // Fetch team's specific timing entry when team changes
  useEffect(() => {
    if (selectedTeam) {
      const entry = getTimingEntryByTeam(selectedTeam);
      setTiming(entry);

      // Load raw input fields
      setRawLegTimes({
        leg1: entry.leg1_time ? secondsToTimeString(entry.leg1_time) : "",
        leg2: entry.leg2_time ? secondsToTimeString(entry.leg2_time) : "",
        leg3: entry.leg3_time ? secondsToTimeString(entry.leg3_time) : "",
        leg4: entry.leg4_time ? secondsToTimeString(entry.leg4_time) : "",
        leg5: entry.leg5_time ? secondsToTimeString(entry.leg5_time) : "",
        leg6: entry.leg6_time ? secondsToTimeString(entry.leg6_time) : "",
      });
    }
  }, [selectedTeam]);

  // Recalculate live totals when inputs change
  useEffect(() => {
    if (!settings.barrier_knock_penalty_sec) return;

    // Parse raw leg times
    const leg1 = timeStringToSeconds(rawLegTimes.leg1);
    const leg2 = timeStringToSeconds(rawLegTimes.leg2);
    const leg3 = timeStringToSeconds(rawLegTimes.leg3);
    const leg4 = timeStringToSeconds(rawLegTimes.leg4);
    const leg5 = timeStringToSeconds(rawLegTimes.leg5);
    const leg6 = timeStringToSeconds(rawLegTimes.leg6);

    const rawSumSec =
      (leg1 || 0) +
      (leg2 || 0) +
      (leg3 || 0) +
      (leg4 || 0) +
      (leg5 || 0) +
      (leg6 || 0);

    const barrierPen =
      (timing.barriers_knocked || 0) * settings.barrier_knock_penalty_sec;
    const skipPen =
      (timing.obstacles_skipped || 0) * settings.obstacle_skip_penalty_sec;
    const helpPen =
      (timing.outside_help_count || 0) * settings.outside_help_penalty_sec;

    const playerPenSum =
      Number(timing.player1_penalty_sec || 0) +
      Number(timing.player2_penalty_sec || 0) +
      Number(timing.player3_penalty_sec || 0) +
      Number(timing.player4_penalty_sec || 0) +
      Number(timing.player5_penalty_sec || 0) +
      Number(timing.player6_penalty_sec || 0);

    const penaltySec = barrierPen + skipPen + helpPen + playerPenSum;
    const totalResultSec = rawSumSec + penaltySec;

    setLiveTotals({
      rawSumSec,
      penaltySec,
      totalResultSec,
    });
  }, [rawLegTimes, timing, settings]);

  const handleInputChange = (field, val) => {
    setTiming((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    const validation = validateTiming(rawLegTimes);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }

    const savedEntry = {
      ...timing,
      team_number: selectedTeam,
      leg1_time: timeStringToSeconds(rawLegTimes.leg1),
      leg2_time: timeStringToSeconds(rawLegTimes.leg2),
      leg3_time: timeStringToSeconds(rawLegTimes.leg3),
      leg4_time: timeStringToSeconds(rawLegTimes.leg4),
      leg5_time: timeStringToSeconds(rawLegTimes.leg5),
      leg6_time: timeStringToSeconds(rawLegTimes.leg6),
    };

    try {
      await upsertTimingEntry(savedEntry);
      const entry = getTimingEntryByTeam(selectedTeam);
      setTiming(entry);
      setError("");
      setMsg(t("timing_saved_success"));
      toast(t("timing_saved_toast"), "success");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setError(err.message || t("unable_save_timing"));
    }
  };

  const handleDeleteTiming = () => {
    if (!canEdit) return;
    confirm(
      t("delete_confirm"),
      async () => {
        try {
          await deleteTimingEntry(selectedTeam);
          const entry = getTimingEntryByTeam(selectedTeam);
          setTiming(entry);
          setRawLegTimes({
            leg1: "",
            leg2: "",
            leg3: "",
            leg4: "",
            leg5: "",
            leg6: "",
          });
          setMsg(t("timing_cleared_success"));
          toast(t("timing_cleared_toast"), "success");
          setTimeout(() => setMsg(""), 3000);
        } catch (err) {
          toast(err.message || t("unable_clear_timing"), "error");
        }
      },
      { title: t("delete") || "Delete", variant: "danger" },
    );
  };

  // Resolve player name indicators
  const players = getPlayers();
  const getPlayerName = (suffix) => {
    const key = `${selectedTeam}-${suffix}`;
    const p = players.find(
      (x) => x.player_key === key && x.status !== "Substituted",
    );
    return p ? p.full_name : `(${t("unregistered")})`;
  };

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: "1.8rem", fontWeight: 800 }}>
        {t("timing")}
      </h1>

      {!canEdit && (
        <div className="alert-banner critical">
          <AlertTriangle size={20} />
          <div>
            <div className="alert-banner-title">
              {t("access_restricted_title")}
            </div>
            <div className="alert-banner-desc">
              {t("access_restricted_desc")}
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div
          className="alert-banner"
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            color: "#34d399",
            borderColor: "rgba(16, 185, 129, 0.2)",
          }}
        >
          {msg}
        </div>
      )}
      {error && <div className="alert-banner critical">{error}</div>}

      <div className="grid-2">
        {/* Entry Form */}
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <h2 className="card-title">⏱️ {t("timing_title")}</h2>
          </div>

          <div
            style={{
              background: "rgba(14, 19, 43, 0.3)",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">{t("select_team")}</label>
              <select
                className="form-select number-text"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                {teams.map((t) => (
                  <option key={t.team_number} value={t.team_number}>
                    {t.team_number} - {t.team_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leg Times */}
          <h3
            className="mb-2"
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--color-primary-hover)",
            }}
          >
            🏃‍♂️ {t("leg_times")}
          </h3>

          <div className="form-grid">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div className="form-group" key={num}>
                <label
                  className="form-label"
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>{t(`player_time_${num}`)}</span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      maxWidth: "120px",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getPlayerName(num)}
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input timer-text"
                  placeholder="5:12"
                  value={rawLegTimes[`leg${num}`]}
                  disabled={!canEdit}
                  onChange={(e) =>
                    setRawLegTimes({
                      ...rawLegTimes,
                      [`leg${num}`]: e.target.value,
                    })
                  }
                />
              </div>
            ))}
          </div>

          {/* Core Penalties */}
          <h3
            className="mt-4 mb-2"
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--color-primary-hover)",
            }}
          >
            ⚠️ {t("team_penalties")}
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                {t("barriers")} (+{settings.barrier_knock_penalty_sec}s)
              </label>
              <input
                type="number"
                className="form-input timer-text"
                min={0}
                disabled={!canEdit}
                value={timing.barriers_knocked || 0}
                onChange={(e) =>
                  handleInputChange("barriers_knocked", e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("obstacles")} (+{settings.obstacle_skip_penalty_sec}s)
              </label>
              <input
                type="number"
                className="form-input timer-text"
                min={0}
                disabled={!canEdit}
                value={timing.obstacles_skipped || 0}
                onChange={(e) =>
                  handleInputChange("obstacles_skipped", e.target.value)
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("outside_help")} (+{settings.outside_help_penalty_sec}s)
              </label>
              <input
                type="number"
                className="form-input timer-text"
                min={0}
                disabled={!canEdit}
                value={timing.outside_help_count || 0}
                onChange={(e) =>
                  handleInputChange("outside_help_count", e.target.value)
                }
              />
            </div>
          </div>

          {/* Individual Player Penalties */}
          <h3
            className="mt-4 mb-2"
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--color-primary-hover)",
            }}
          >
            🎖️ {t("player_pens")}
          </h3>
          <div className="form-grid">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div className="form-group" key={num}>
                <label className="form-label">{t(`player_pen_${num}`)}</label>
                <input
                  type="number"
                  className="form-input timer-text"
                  min={0}
                  disabled={!canEdit}
                  value={timing[`player${num}_penalty_sec`] || 0}
                  onChange={(e) =>
                    handleInputChange(
                      `player${num}_penalty_sec`,
                      e.target.value,
                    )
                  }
                />
              </div>
            ))}
          </div>

          {/* Judge / Status */}
          <h3
            className="mt-4 mb-2"
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              color: "var(--color-primary-hover)",
            }}
          >
            ⚖️ {t("officiating")}
          </h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("result_status")}</label>
              <select
                className="form-select"
                value={timing.result_status || "Pending"}
                disabled={!canEdit}
                onChange={(e) =>
                  handleInputChange("result_status", e.target.value)
                }
              >
                <option value="Pending">{t("Pending")}</option>
                <option value="Finished">{t("Finished")}</option>
                <option value="DNS">{t("DNS")}</option>
                <option value="DNF">{t("DNF")}</option>
                <option value="Injured">{t("Injured")}</option>
                <option value="Disqualified">{t("Disqualified")}</option>
                <option value="Withdrawn">{t("Withdrawn")}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("judge")}</label>
              <select
                className="form-select"
                value={timing.judge_name || ""}
                disabled={!canEdit}
                onChange={(e) =>
                  handleInputChange("judge_name", e.target.value)
                }
              >
                <option value="">{t("select_judge")}</option>
                {(settings.judges || []).length > 0
                  ? settings.judges.map((judge) => (
                      <option key={judge} value={judge}>
                        {judge}
                      </option>
                    ))
                  : [
                      "الحكم أحمد",
                      "الحكم خالد",
                      "الحكم سالم",
                      "الحكم علي",
                      "حكم آخر",
                    ].map((judge) => (
                      <option key={judge} value={judge}>
                        {judge}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {canEdit && (
            <div className="flex-gap-2 mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <Save size={18} /> {t("save_timing")}
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteTiming}
              >
                {t("delete")}
              </button>
            </div>
          )}
        </form>

        {/* Live Calculation Preview Dashboard */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div
            className="card"
            style={{
              borderColor: "var(--color-primary-glow)",
              boxShadow: "0 0 15px var(--border-glow)",
            }}
          >
            <div
              className="card-header"
              style={{ borderColor: "rgba(225, 29, 72, 0.2)" }}
            >
              <h2
                className="card-title"
                style={{ color: "var(--color-primary-hover)" }}
              >
                📊 {t("live_computed")}
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              <div className="flex-between">
                <span className="form-label">{t("raw_time")}</span>
                <span
                  className="timer-text"
                  style={{ fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  {formatDuration(liveTotals.rawSumSec, locale) || "--"}
                </span>
              </div>

              <div className="flex-between">
                <span className="form-label">{t("total_penalty")}</span>
                <span
                  className="timer-text text-danger"
                  style={{ fontSize: "1.5rem", fontWeight: "bold" }}
                >
                  {formatDuration(
                    liveTotals.penaltySec,
                    t("yes") === "نعم" ? "ar" : "en",
                    { forceSign: true },
                  )}
                </span>
              </div>

              <hr
                style={{
                  border: "none",
                  borderTop: "1px solid var(--border-color)",
                }}
              />

              <div className="flex-between" style={{ padding: "0.5rem 0" }}>
                <span
                  className="form-label"
                  style={{ fontSize: "1rem", fontWeight: 800, color: "#fff" }}
                >
                  {t("final_time")}
                </span>
                <div>
                  {[
                    "DNS",
                    "DNF",
                    "Injured",
                    "Disqualified",
                    "Withdrawn",
                  ].includes(timing.result_status) ? (
                    <div style={{ textAlign: "end" }}>
                      <span
                        className="badge refunded"
                        style={{ fontSize: "1rem", padding: "0.4rem 0.8rem" }}
                      >
                        {timing.result_status} ({formatDuration(settings.dnf_dns_injury_value, locale)})
                      </span>
                      <span
                        className="timer-text block mt-1"
                        style={{
                          display: "block",
                          fontSize: "0.85rem",
                          color: "#6b7280",
                        }}
                      >
                        {t("literal_time")}: {formatDuration(
                          liveTotals.totalResultSec,
                          t("yes") === "نعم" ? "ar" : "en",
                        )}
                      </span>
                    </div>
                  ) : (
                    <span
                      className="timer-text"
                      style={{
                        fontSize: "2.2rem",
                        fontWeight: 800,
                        color: "var(--color-gold)",
                        textShadow: "0 0 10px var(--color-gold-glow)",
                      }}
                    >
                      {formatDuration(liveTotals.totalResultSec, locale) || "--"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Roster Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{t("team_lineup_title")}</h3>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div
                  key={num}
                  className="flex-between"
                  style={{
                    padding: "0.4rem 0.75rem",
                    background: "rgba(255,255,255,0.01)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                  }}
                >
                  <span
                    className="number-text"
                    style={{
                      fontWeight: "bold",
                      color: "var(--color-primary-hover)",
                    }}
                  >
                    {selectedTeam}-{num}
                  </span>
                  <span style={{ fontWeight: 600 }}>{getPlayerName(num)}</span>
                  <span className={`badge ${num <= 3 ? "starter" : "reserve"}`}>
                    {num <= 3 ? t("starter") : t("reserve")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
