import React, { useState, useEffect } from "react";
import {
  getTeams,
  getPlayers,
  upsertPlayer,
  deletePlayer,
  getSettings,
} from "../state";
import { useAppContext } from "../context/AppContext";
import { validatePlayer } from "../utils/validation";
import { Plus, Edit2, Trash2, Check, X, ShieldAlert } from "lucide-react";

export default function Players({ t, role, syncTick }) {
  const { toast, confirm } = useAppContext();
  const canEdit = role === "admin" || role === "timekeeper";
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [settings, setSettings] = useState({});
  const [selectedTeam, setSelectedTeam] = useState("");

  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    team_number: "",
    full_name: "",
    player_type: "Starter",
    status: "Ready",
    medical_notes: "None",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    setPlayers(getPlayers());
    setSettings(getSettings());

    if (loadedTeams.length > 0) {
      setSelectedTeam((prev) => prev || loadedTeams[0].team_number);
    }
  }, [syncTick]);

  const handleEditClick = (player) => {
    if (!canEdit) return;
    setEditingPlayer(player.id);
    setFormData({ ...player });
    setError("");
  };

  const handleCancel = () => {
    setEditingPlayer(null);
    setFormData({
      id: "",
      team_number: selectedTeam,
      full_name: "",
      player_type: "Starter",
      status: "Ready",
      medical_notes: "None",
    });
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      const payload = {
        ...formData,
        team_number: selectedTeam,
      };

      const validation = validatePlayer(payload, settings, players);
      if (!validation.valid) {
        setError(validation.errors[0]);
        return;
      }

      await upsertPlayer(payload);
      setPlayers(getPlayers());
      handleCancel();
      toast(
        t("yes") === "نعم"
          ? "تم حفظ اللاعب بنجاح"
          : "Player saved successfully",
        "success",
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = (id) => {
    if (!canEdit) return;
    confirm(
      t("delete_confirm"),
      async () => {
        try {
          await deletePlayer(id);
          setPlayers(getPlayers());
          toast(
            t("yes") === "نعم"
              ? "تم حذف اللاعب بنجاح"
              : "Player deleted successfully",
            "success",
          );
        } catch (err) {
          toast(err.message || "Unable to delete player", "error");
        }
      },
      { title: t("delete") || "Delete", variant: "danger" },
    );
  };

  // Filter players by selected team
  const filteredPlayers = players.filter((p) => p.team_number === selectedTeam);

  // Group starters and reserves
  const starters = filteredPlayers.filter((p) => p.player_type === "Starter");
  const reserves = filteredPlayers.filter((p) => p.player_type === "Reserve");

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>{t("players")}</h1>

        {/* Team Selector Tab List */}
        <div className="flex-gap-2">
          <label className="form-label mr-2">{t("select_team")}:</label>
          <select
            className="form-select number-text"
            style={{ fontWeight: "bold" }}
            value={selectedTeam}
            onChange={(e) => {
              setSelectedTeam(e.target.value);
              setFormData((prev) => ({ ...prev, team_number: e.target.value }));
              handleCancel();
            }}
          >
            {teams.map((t) => (
              <option key={t.team_number} value={t.team_number}>
                {t.team_number} - {t.team_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert-banner critical">{error}</div>}

      {/* Add / Edit Form */}
      {canEdit && selectedTeam && (
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <h2 className="card-title">
              {editingPlayer
                ? `✏️ ${t("edit_player")}`
                : `➕ ${t("add_player")}`}
            </h2>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("full_name")}</label>
              <input
                type="text"
                className="form-input"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("player_type")}</label>
              <select
                className="form-select"
                value={formData.player_type}
                disabled={!!editingPlayer} // Lock type on edit to prevent sequential key breakage
                onChange={(e) =>
                  setFormData({ ...formData, player_type: e.target.value })
                }
              >
                <option value="Starter">{t("starter")}</option>
                <option value="Reserve">{t("reserve")}</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("player_status")}</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
              >
                <option value="Ready">{t("Ready")}</option>
                <option value="Injured">{t("Injured")}</option>
                <option value="Withdrawn">{t("Withdrawn")}</option>
                <option value="DNS">{t("DNS")}</option>
                <option value="DNF">{t("DNF")}</option>
                <option value="Completed">{t("Completed")}</option>
                <option value="Substituted">{t("Substituted")}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("medical_notes")}</label>
              <select
                className="form-select"
                value={formData.medical_notes}
                onChange={(e) =>
                  setFormData({ ...formData, medical_notes: e.target.value })
                }
              >
                <option value="None">
                  {t("yes") === "نعم" ? "لا يوجد" : "None"}
                </option>
                <option value="Asthma">
                  {t("yes") === "نعم" ? "ربو" : "Asthma"}
                </option>
                <option value="Diabetes">
                  {t("yes") === "نعم" ? "سكري" : "Diabetes"}
                </option>
                <option value="Heart">
                  {t("yes") === "نعم" ? "أمراض قلب" : "Heart condition"}
                </option>
                <option value="Other">
                  {t("yes") === "نعم" ? "أخرى" : "Other"}
                </option>
              </select>
            </div>
          </div>

          <div className="flex-gap-2 mt-4">
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> {t("save_player")}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
            >
              <X size={16} /> {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Players List Table */}
      <div className="table-container">
        <div
          className="card-header"
          style={{ borderBottom: "none", padding: "1rem" }}
        >
          <h3 className="card-title">
            👥 Roster: {selectedTeam} ({starters.length} Starters,{" "}
            {reserves.length} Reserves)
          </h3>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t("player_key")}</th>
              <th>{t("full_name")}</th>
              <th>{t("player_type")}</th>
              <th>{t("player_status")}</th>
              <th>{t("medical_notes")}</th>
              {canEdit && <th>{t("actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length === 0 ? (
              <tr>
                <td
                  colSpan={canEdit ? 6 : 5}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  {t("yes") === "نعم"
                    ? "لا يوجد لاعبون مسجلون لهذا الفريق."
                    : "No players registered on this team yet."}
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  className={
                    player.status === "Substituted" ? "opacity-50" : ""
                  }
                >
                  <td className="number-text" style={{ fontWeight: "bold" }}>
                    {player.player_key}
                  </td>
                  <td style={{ fontWeight: 600 }}>{player.full_name}</td>
                  <td>
                    <span
                      className={`badge ${player.player_type.toLowerCase()}`}
                    >
                      {player.player_type === "Starter"
                        ? t("starter")
                        : t("reserve")}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${player.status.toLowerCase()}`}>
                      {t(player.status) || player.status}
                    </span>
                  </td>
                  <td>
                    {player.medical_notes === "None" ? (
                      <span style={{ color: "#6b7280" }}>—</span>
                    ) : (
                      <span className="badge refunded">
                        {t(player.medical_notes) || player.medical_notes}
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td>
                      <div className="flex-gap-2">
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleEditClick(player)}
                          title={t("edit")}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => handleDelete(player.id)}
                          title={t("delete")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
