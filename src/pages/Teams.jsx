import React, { useState, useEffect } from "react";
import { getTeams, upsertTeam, deleteTeam, getSettings } from "../state";
import { Plus, Edit2, Trash2, Check, X, ShieldAlert } from "lucide-react";

// Convert a 1-based index to an Excel-style letter code: 1 -> A, 2 -> B ... 26 -> Z, 27 -> AA, 28 -> AB ...
function indexToTeamCode(index) {
  let n = index;
  let code = "";
  while (n > 0) {
    const remainder = (n - 1) % 26;
    code = String.fromCharCode(65 + remainder) + code;
    n = Math.floor((n - 1) / 26);
  }
  return code;
}

// Convert an Excel-style letter code back to a 1-based index: A -> 1, Z -> 26, AA -> 27 ...
function teamCodeToIndex(code) {
  let n = 0;
  for (let i = 0; i < code.length; i++) {
    n = n * 26 + (code.charCodeAt(i) - 64);
  }
  return n;
}

// Find the next available team code given existing teams (fills gaps left by deleted teams first)
function getNextTeamCode(existingTeams) {
  const usedIndices = new Set(
    existingTeams
      .map((team) => team.team_number)
      .filter((code) => /^[A-Z]+$/.test(code))
      .map(teamCodeToIndex),
  );

  let candidate = 1;
  while (usedIndices.has(candidate)) {
    candidate++;
  }
  return indexToTeamCode(candidate);
}

export default function Teams({ t, role, syncTick }) {
  const isAdmin = role === "admin";
  const [teams, setTeams] = useState([]);
  const [settings, setSettings] = useState({});
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    team_number: "",
    team_name: "",
    manager_name: "",
    whatsapp_number: "",
    payment_status: "Pending",
    amount_paid: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadedTeams = getTeams();
    setTeams(loadedTeams);
    setSettings(getSettings());
    // Auto-fill the next available team code when not currently editing an existing team
    setFormData((prev) =>
      editingTeam
        ? prev
        : { ...prev, team_number: getNextTeamCode(loadedTeams) },
    );
  }, [syncTick]);

  const handleEditClick = (team) => {
    if (!isAdmin) return;
    setEditingTeam(team.team_number);
    setFormData({ ...team });
    setError("");
  };

  const handleCancel = (refreshedTeams) => {
    setEditingTeam(null);
    setFormData({
      team_number: getNextTeamCode(refreshedTeams || teams),
      team_name: "",
      manager_name: "",
      whatsapp_number: "",
      payment_status: "Pending",
      amount_paid: 0,
    });
    setError("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isAdmin) return;

    // Validations: accept Excel-style letter codes (A, B, ... Z, AA, AB, ...)
    const teamNum = formData.team_number.trim().toUpperCase();
    if (!/^[A-Z]+$/.test(teamNum)) {
      setError(
        t("yes") === "نعم"
          ? "يجب أن يكون رمز الفريق حروفاً فقط (A, B, ...Z, AA, AB...)"
          : "Team code must be letters only (A, B, ...Z, AA, AB...)",
      );
      return;
    }
    const LIBYA_MOBILE_REGEX = /^09[1-5][0-9]{7}$/;
    const phone = formData.whatsapp_number.trim();

    if (phone && !LIBYA_MOBILE_REGEX.test(phone)) {
      setError(
        t("yes") === "نعم"
          ? "رقم الواتساب غير صحيح. يجب أن يبدأ بـ 91/92/93/94/95 ويتكون من 9 أرقام"
          : "Invalid WhatsApp number. Must start with 91/92/93/94/95 and be 9 digits",
      );
      return;
    }
    if(formData.amount_paid <= 0) {
      setError(
        t("yes") === "نعم"
          ? "جب أن يكون المبلغ المدفوع رقمًا اكبر من 0"
          : "Amount paid must be a positive number",
      );
      return;
    }

    // Check unique team code (if creating new)
    if (!editingTeam) {
      const exists = teams.some((t) => t.team_number === teamNum);
      if (exists) {
        setError(
          t("yes") === "نعم"
            ? "رمز الفريق مسجل بالفعل!"
            : "Team code already exists!",
        );
        return;
      }
    }

    const payload = {
      ...formData,
      team_number: teamNum,
      amount_paid: Number(formData.amount_paid || 0),
    };

    upsertTeam(payload);
    const refreshedTeams = getTeams();
    setTeams(refreshedTeams);
    handleCancel(refreshedTeams);
  };

  const handleDelete = (teamNumber) => {
    if (!isAdmin) return;
    if (window.confirm(t("delete_confirm"))) {
      deleteTeam(teamNumber);
      setTeams(getTeams());
    }
  };

  const showForm = isAdmin && (!settings.lock_tournament_day || editingTeam);

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>{t("teams")}</h1>
        {settings.lock_tournament_day && isAdmin && (
          <span className="badge pending" style={{ padding: "0.5rem 1rem" }}>
            🔒 {t("lock_status")}
          </span>
        )}
      </div>

      {error && <div className="alert-banner critical">{error}</div>}

      {/* Team Form */}
      {showForm && (
        <form onSubmit={handleSave} className="card">
          <div className="card-header">
            <h2 className="card-title">
              {editingTeam
                ? `✏️ ${t("edit_team")} ${editingTeam}`
                : `➕ ${t("add_team")}`}
            </h2>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("team_num")}</label>
              <input
                type="text"
                className="form-input text-uppercase number-text"
                value={formData.team_number}
                disabled={true}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    team_number: e.target.value.toUpperCase(),
                  })
                }
                required
                placeholder="A"
                title={
                  t("yes") === "نعم"
                    ? "يتم توليد رمز الفريق تلقائياً"
                    : "Team code is generated automatically"
                }
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("team_name")}</label>
              <input
                type="text"
                className="form-input"
                value={formData.team_name}
                disabled={settings.lock_tournament_day}
                onChange={(e) =>
                  setFormData({ ...formData, team_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("manager")}</label>
              <input
                type="text"
                className="form-input"
                value={formData.manager_name}
                disabled={settings.lock_tournament_day}
                onChange={(e) =>
                  setFormData({ ...formData, manager_name: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("whatsapp")}</label>
              <input
                type="text"
                className="form-input timer-text"
                value={formData.whatsapp_number}
                disabled={settings.lock_tournament_day}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp_number: e.target.value })
                }
                placeholder="91XXXXXXX"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">{t("payment_status")}</label>
              <select
                className="form-select"
                value={formData.payment_status}
                onChange={(e) =>
                  setFormData({ ...formData, payment_status: e.target.value })
                }
              >
                <option value="Pending">{t("Pending")}</option>
                <option value="Paid">{t("Paid")}</option>
                <option value="Waived">{t("Waived")}</option>
                <option value="Refunded">{t("Refunded")}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t("amount_paid")}</label>
              <input
                type="number"
                className="form-input timer-text"
                value={formData.amount_paid}
                onChange={(e) =>
                  setFormData({ ...formData, amount_paid: e.target.value })
                }
                required
                min={0}
              />
            </div>
          </div>

          <div className="flex-gap-2 mt-4">
            <button type="submit" className="btn btn-primary">
              <Check size={16} /> {t("save_team")}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleCancel()}
            >
              <X size={16} /> {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Teams List */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t("team_num")}</th>
              <th>{t("team_name")}</th>
              <th>{t("manager")}</th>
              <th>{t("whatsapp")}</th>
              <th>{t("payment_status")}</th>
              <th>{t("amount_paid")}</th>
              <th>{t("team_status")}</th>
              {isAdmin && <th>{t("actions")}</th>}
            </tr>
          </thead>
          <tbody>
            {teams.length === 0 ? (
              <tr>
                <td
                  colSpan={isAdmin ? 8 : 7}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  {t("yes") === "نعم"
                    ? "لا توجد فرق مسجلة بعد."
                    : "No teams registered yet."}
                </td>
              </tr>
            ) : (
              teams.map((team) => (
                <tr key={team.team_number}>
                  <td className="number-text" style={{ fontWeight: 800 }}>
                    {team.team_number}
                  </td>
                  <td style={{ fontWeight: 700 }}>{team.team_name}</td>
                  <td>{team.manager_name}</td>
                  <td className="number-text">{team.whatsapp_number}</td>
                  <td>
                    <span
                      className={`badge ${team.payment_status.toLowerCase()}`}
                    >
                      {t(team.payment_status) || team.payment_status}
                    </span>
                  </td>
                  <td className="timer-text">{team.amount_paid} د.ل</td>
                  <td>
                    <span className={`badge ${team.team_status.toLowerCase()}`}>
                      {team.team_status === "Approved"
                        ? t("yes") === "نعم"
                          ? "مقبول ✅"
                          : "Approved ✅"
                        : t("yes") === "نعم"
                          ? "معلق ⏳"
                          : "Pending ⏳"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="flex-gap-2">
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => handleEditClick(team)}
                          title={t("edit")}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          disabled={settings.lock_tournament_day}
                          onClick={() => handleDelete(team.team_number)}
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
