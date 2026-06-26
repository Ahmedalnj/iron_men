import React, { useState, useEffect } from "react";
import {
  getSettings,
  updateSettings,
  resetDatabase,
  exportDatabaseState,
  importDatabaseState,
} from "../state";
import { useAppContext } from "../context/AppContext";
import {
  Save,
  AlertTriangle,
  Download,
  Upload,
  RotateCcw,
  Lock,
} from "lucide-react";

export default function Settings({ t, role, syncTick }) {
  const { toast, confirm } = useAppContext();
  const isAdmin = role === "admin";
  const [settings, setSettings] = useState({
    tournament_name: "",
    tournament_date: "",
    starters_per_team: 3,
    max_reserves_per_team: 3,
    barrier_knock_penalty_sec: 5,
    obstacle_skip_penalty_sec: 10,
    outside_help_penalty_sec: 10,
    dnf_dns_injury_value: 9999,
    lock_tournament_day: false,
    judges: [],
  });

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loaded = getSettings();
    setSettings({
      ...loaded,
      judges: Array.isArray(loaded.judges) ? loaded.judges : [],
    });
  }, [syncTick]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    try {
      const payload = {
        ...settings,
        judges: (settings.judges || []).filter(Boolean),
      };
      await updateSettings(payload);
      setSettings({
        ...getSettings(),
        judges: Array.isArray(getSettings().judges) ? getSettings().judges : [],
      });
      setMsg(
        t("yes") === "نعم"
          ? "تم حفظ الإعدادات بنجاح!"
          : "Settings saved successfully!",
      );
      setError("");
      toast(
        t("yes") === "نعم" ? "تم حفظ الإعدادات" : "Settings updated",
        "success",
      );
      setTimeout(() => setMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleExport = () => {
    const dataStr = exportDatabaseState();
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `iron_champion_backup_${new Date().toISOString().slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        const result = await importDatabaseState(event.target.result);
        if (result) {
          toast(
            t("yes") === "نعم"
              ? "تم استيراد البيانات وإعادة التشغيل!"
              : "Database restored! Page will reload.",
            "success",
          );
          window.location.reload();
        } else {
          toast(
            t("yes") === "نعم"
              ? "فشل استيراد الملف، يرجى التحقق من الهيكل!"
              : "Failed to parse JSON. Check file structure.",
            "error",
          );
        }
      };
    }
  };

  const handleReset = () => {
    confirm(
      t("reset_confirm"),
      async () => {
        const success = await resetDatabase();
        if (success) {
          toast(
            t("yes") === "نعم"
              ? "تمت إعادة الضبط بنجاح!"
              : "Database reset to factory seeds completed!",
            "success",
          );
          window.location.reload();
        } else {
          toast(
            t("yes") === "نعم" ? "فشل إعادة الضبط" : "Reset failed",
            "error",
          );
        }
      },
      { title: t("reset_btn") || "Reset", variant: "danger" },
    );
  };

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: "1.8rem", fontWeight: 800 }}>
        {t("settings")}
      </h1>

      {!isAdmin && (
        <div className="alert-banner critical">
          <Lock size={20} />
          <div>
            <div className="alert-banner-title">
              {t("yes") === "نعم" ? "عرض فقط" : "Access Restricted"}
            </div>
            <div className="alert-banner-desc">
              {t("yes") === "نعم"
                ? "يجب تسجيل الدخول كمسؤول للنظام لتغيير هذه الإعدادات."
                : "You must switch your role to Admin in the header to modify tournament configs."}
            </div>
          </div>
        </div>
      )}

      {settings.lock_tournament_day && isAdmin && (
        <div className="alert-banner">
          <Lock size={20} />
          <div>
            <div className="alert-banner-title">{t("lock_status")}</div>
            <div className="alert-banner-desc">
              {t("yes") === "نعم"
                ? "يوم البطولة نشط. تم قفل الحقول لمنع التعديلات العشوائية أثناء السباقات."
                : "Tournament Day Lock is active. Configuration is read-only except for toggle controls."}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="card">
        <div className="card-header">
          <h2 className="card-title">⚙️ {t("settings_title")}</h2>
        </div>

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

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">{t("t_name")}</label>
            <input
              type="text"
              className="form-input"
              value={settings.tournament_name}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({ ...settings, tournament_name: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("t_date")}</label>
            <input
              type="date"
              className="form-input timer-text"
              value={settings.tournament_date}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({ ...settings, tournament_date: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">{t("starters_limit")}</label>
            <input
              type="number"
              className="form-input timer-text"
              value={settings.starters_per_team}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  starters_per_team: parseInt(e.target.value, 10),
                })
              }
              required
              min={1}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("reserves_limit")}</label>
            <input
              type="number"
              className="form-input timer-text"
              value={settings.max_reserves_per_team}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_reserves_per_team: parseInt(e.target.value, 10),
                })
              }
              required
              min={0}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">{t("barrier_pen")}</label>
            <input
              type="number"
              className="form-input timer-text"
              value={settings.barrier_knock_penalty_sec}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  barrier_knock_penalty_sec: parseInt(e.target.value, 10),
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("obstacle_pen")}</label>
            <input
              type="number"
              className="form-input timer-text"
              value={settings.obstacle_skip_penalty_sec}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  obstacle_skip_penalty_sec: parseInt(e.target.value, 10),
                })
              }
              required
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">{t("outside_help_pen")}</label>
            <input
              type="number"
              className="form-input timer-text"
              value={settings.outside_help_penalty_sec}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  outside_help_penalty_sec: parseInt(e.target.value, 10),
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t("dnf_val")}</label>
            <input
              type="number"
              className="form-input timer-text"
              value={settings.dnf_dns_injury_value}
              disabled={!isAdmin || settings.lock_tournament_day}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dnf_dns_injury_value: parseInt(e.target.value, 10),
                })
              }
              required
            />
          </div>
        </div>

        {/* Lock Day Switch */}
        <div
          className="form-group"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 0",
          }}
        >
          <input
            type="checkbox"
            id="lock_day"
            style={{
              width: "20px",
              height: "20px",
              accentColor: "var(--color-primary)",
            }}
            checked={settings.lock_tournament_day}
            disabled={!isAdmin}
            onChange={(e) =>
              setSettings({
                ...settings,
                lock_tournament_day: e.target.checked,
              })
            }
          />
          <label
            htmlFor="lock_day"
            className="form-label"
            style={{ cursor: "pointer", fontSize: "1rem", color: "#fff" }}
          >
            {t("lock_day")}
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">Judges</label>
          <input
            type="text"
            className="form-input"
            value={(settings.judges || []).join(", ")}
            disabled={!isAdmin || settings.lock_tournament_day}
            onChange={(e) =>
              setSettings({
                ...settings,
                judges: e.target.value
                  .split(",")
                  .map((judge) => judge.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Judge 1, Judge 2"
          />
        </div>

        {isAdmin && (
          <button type="submit" className="btn btn-primary">
            <Save size={18} /> {t("save_settings")}
          </button>
        )}
      </form>

      {/* Backup and Restore Controls */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">💾 {t("backup_restore")}</h2>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} /> {t("export_btn")}
          </button>

          <label
            className="btn btn-secondary"
            style={{ display: "inline-flex", cursor: "pointer" }}
          >
            <Upload size={18} style={{ marginInlineEnd: "0.5rem" }} />{" "}
            {t("import_btn")}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: "none" }}
              disabled={!isAdmin}
            />
          </label>

          {isAdmin && (
            <button
              className="btn btn-danger"
              onClick={handleReset}
              style={{ marginInlineStart: "auto" }}
            >
              <RotateCcw size={18} /> {t("reset_btn")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
