import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import {
  getTeams,
  getPlayers,
  getCheckIns,
  upsertCheckIn,
  getUncheckedPlayers,
  deleteCheckIn,
} from "../state";
import { UserCheck, AlertCircle, Trash2, Edit2 } from "lucide-react";

export default function CheckIn({ t, role, syncTick }) {
  const { toast } = useAppContext();
  const canEdit = role === "admin" || role === "timekeeper";

  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [unchecked, setUnchecked] = useState([]);

  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedLeg, setSelectedLeg] = useState(1);

  // Resolved info
  const [matchedPlayer, setMatchedPlayer] = useState(null);

  // Form fields
  const [present, setPresent] = useState("Present");
  const [jersey, setJersey] = useState(false);
  const [warmup, setWarmup] = useState(false);
  const [cleared, setCleared] = useState(false);

  const loadData = () => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    setPlayers(getPlayers());
    const loadedCheckins = getCheckIns();
    setCheckIns(loadedCheckins);
    setUnchecked(getUncheckedPlayers());

    if (loadedTeams.length > 0 && !selectedTeam) {
      setSelectedTeam(loadedTeams[0].team_number);
    }
  };

  useEffect(() => {
    loadData();
  }, [syncTick]);

  // Recalculate matched player when team or leg changes
  useEffect(() => {
    if (selectedTeam && selectedLeg) {
      const key = `${selectedTeam}-${selectedLeg}`;
      const found = players.find((p) => p.player_key === key);
      setMatchedPlayer(found || null);

      // Pre-fill form if check-in already exists
      const existing = checkIns.find((c) => c.player_key === key);
      if (existing) {
        setPresent(existing.present || "Present");
        setJersey(!!existing.jersey_received);
        setWarmup(!!existing.warmup_completed);
        setCleared(!!existing.cleared_to_compete);
      } else {
        // Reset defaults
        setPresent("Present");
        setJersey(false);
        setWarmup(false);
        setCleared(false);
      }
    }
  }, [selectedTeam, selectedLeg, players, checkIns]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!canEdit) return;

    const payload = {
      team_number: selectedTeam,
      leg_number: Number(selectedLeg),
      present,
      jersey_received: jersey,
      warmup_completed: warmup,
      cleared_to_compete: cleared,
    };

    try {
      upsertCheckIn(payload);
      toast(t("checkin_saved_success"), "success");
      loadData();
    } catch (error) {
      toast(t("checkin_save_failed"), "error");
    }
  };

  const handleSelectUnchecked = (player) => {
    setSelectedTeam(player.team_number);
    const leg = parseInt(player.player_key.split("-")[1], 10);
    if (leg) {
      setSelectedLeg(leg);
    }
  };

  const handleEditCheckin = (playerKey) => {
    const [team, leg] = playerKey.split("-");
    setSelectedTeam(team);
    setSelectedLeg(parseInt(leg, 10));
  };

  const handleDeleteCheckin = (key) => {
    if (!canEdit) return;
    if (window.confirm(t("delete_confirm"))) {
      deleteCheckIn(key);
      toast(t("checkin_delete_success"), "success");
      loadData();
    }
  };

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: "1.8rem", fontWeight: 800 }}>
        {t("checkin")}
      </h1>

      <div className="grid-2">
        {/* Check-In Entry Form */}
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <h2 className="card-title">📝 {t("checkin_title")}</h2>
          </div>

          <div
            style={{
              background: "rgba(14, 19, 43, 0.3)",
              padding: "1rem",
              borderRadius: "8px",
              marginBottom: "1.5rem",
            }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                color: "#9ca3af",
                marginBottom: "1rem",
              }}
            >
              {t("checkin_desc")}
            </p>

            <div className="form-grid">
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

              <div className="form-group">
                <label className="form-label">{t("leg_num")}</label>
                <select
                  className="form-select timer-text"
                  value={selectedLeg}
                  onChange={(e) => setSelectedLeg(parseInt(e.target.value, 10))}
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      {num}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Matched Player Card */}
          {matchedPlayer ? (
            <div
              className="card"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "var(--border-color)",
                margin: "1rem 0",
              }}
            >
              <div className="flex-between">
                <div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      color: "#fff",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {matchedPlayer.full_name}
                  </h3>
                  <span
                    className={`badge ${matchedPlayer.player_type.toLowerCase()}`}
                  >
                    {matchedPlayer.player_type === "Starter"
                      ? t("starter")
                      : t("reserve")}
                  </span>
                  <span
                    className="number-text ml-2 mr-2"
                    style={{ color: "#9ca3af", fontSize: "0.9rem" }}
                  >
                    ({matchedPlayer.player_key})
                  </span>
                </div>
                <div>
                  {matchedPlayer.medical_notes !== "None" && (
                    <span className="badge refunded">
                      🩺{" "}
                      {t(matchedPlayer.medical_notes) ||
                        matchedPlayer.medical_notes}
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  marginTop: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Attendance selection */}
                <div className="form-group">
                  <label className="form-label">{t("present")}</label>
                  <select
                    className="form-select"
                    value={present}
                    disabled={!canEdit}
                    onChange={(e) => setPresent(e.target.value)}
                  >
                    <option value="Present">{t("Present")}</option>
                    <option value="Absent">{t("Absent")}</option>
                    <option value="Late">{t("Late")}</option>
                  </select>
                </div>

                {/* Checklist options */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "1rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <label className="flex-gap-2" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "var(--color-primary)",
                      }}
                      checked={jersey}
                      disabled={!canEdit}
                      onChange={(e) => setJersey(e.target.checked)}
                    />
                    <span className="form-label" style={{ color: "#fff" }}>
                      {t("jersey")}
                    </span>
                  </label>

                  <label className="flex-gap-2" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "var(--color-primary)",
                      }}
                      checked={warmup}
                      disabled={!canEdit}
                      onChange={(e) => setWarmup(e.target.checked)}
                    />
                    <span className="form-label" style={{ color: "#fff" }}>
                      {t("warmup")}
                    </span>
                  </label>

                  <label className="flex-gap-2" style={{ cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "var(--color-primary)",
                      }}
                      checked={cleared}
                      disabled={!canEdit}
                      onChange={(e) => setCleared(e.target.checked)}
                    />
                    <span className="form-label" style={{ color: "#fff" }}>
                      {t("cleared")}
                    </span>
                  </label>
                </div>
              </div>

              {canEdit && (
                <button
                  type="submit"
                  className="btn btn-primary mt-4"
                  style={{ width: "100%" }}
                >
                  <UserCheck size={18} /> {t("checkin_btn")}
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                background: "rgba(239, 68, 68, 0.05)",
                borderRadius: "8px",
                color: "#f87171",
                border: "1px dashed rgba(239,68,68,0.2)",
                margin: "1rem 0",
              }}
            >
              <AlertCircle
                size={32}
                style={{ margin: "0 auto 0.5rem auto", display: "block" }}
              />
              <div>
                {t("no_player_in_slot")} {selectedTeam}-{selectedLeg}
              </div>
            </div>
          )}
        </form>

        {/* Players Awaiting Check-In Sidebar */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              ⚠️ {t("not_checked_title")} ({unchecked.length})
            </h2>
          </div>
          {unchecked.length === 0 ? (
            <div
              style={{
                color: "#34d399",
                textAlign: "center",
                padding: "2rem",
                fontWeight: 600,
              }}
            >
              {t("no_unchecked")}
            </div>
          ) : (
            <div
              style={{
                maxHeight: "420px",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {unchecked.map((player) => (
                <div
                  key={player.id}
                  className="stat-card"
                  onClick={() => handleSelectUnchecked(player)}
                  style={{
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span
                      className="number-text"
                      style={{
                        fontWeight: "bold",
                        color: "var(--color-primary-hover)",
                        marginInlineEnd: "0.5rem",
                      }}
                    >
                      {player.player_key}
                    </span>
                    <strong style={{ color: "#fff" }}>
                      {player.full_name}
                    </strong>
                  </div>
                  <span className={`badge ${player.player_type.toLowerCase()}`}>
                    {player.player_type === "Starter"
                      ? t("starter")
                      : t("reserve")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Check-ins List */}
      <div className="card mt-4">
        <div className="card-header">
          <h2 className="card-title">
            ✅ {t("confirmed_checkins")} ({checkIns.length})
          </h2>
        </div>
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>{t("player_key")}</th>
                <th>{t("full_name")}</th>
                <th>{t("present")}</th>
                <th>{t("jersey")}</th>
                <th>{t("warmup")}</th>
                <th>{t("cleared")}</th>
                {canEdit && <th>{t("actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {checkIns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    {t("no_checked_in_players")}
                  </td>
                </tr>
              ) : (
                checkIns.map((c) => {
                  const pName =
                    players.find(
                      (x) =>
                        x.player_key === c.player_key &&
                        x.status !== "Substituted",
                    )?.full_name || t("unregistered");
                  return (
                    <tr key={c.player_key}>
                      <td
                        className="number-text"
                        style={{ fontWeight: "bold" }}
                      >
                        {c.player_key}
                      </td>
                      <td style={{ fontWeight: 600 }}>{pName}</td>
                      <td>
                        <span className={`badge ${c.present.toLowerCase()}`}>
                          {t(c.present) || c.present}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${c.jersey_received ? "approved" : "refunded"}`}
                        >
                          {c.jersey_received ? t("yes") : t("no")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${c.warmup_completed ? "approved" : "refunded"}`}
                        >
                          {c.warmup_completed ? t("yes") : t("no")}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${c.cleared_to_compete ? "approved" : "refunded"}`}
                        >
                          {c.cleared_to_compete ? t("yes") : t("no")}
                        </span>
                      </td>
                      {canEdit && (
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: "0.5rem",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              className="btn btn-secondary btn-compact"
                              onClick={() => handleEditCheckin(c.player_key)}
                              title={t("edit")}
                            >
                              <Edit2 size={14} /> {t("edit")}
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-compact"
                              onClick={() => handleDeleteCheckin(c.player_key)}
                              title={t("delete")}
                            >
                              <Trash2 size={14} /> {t("delete")}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
