import React, { useState, useEffect } from "react";
import { getOverallPlayerRanking } from "../state";
import { formatTime } from "../utils/timeHelpers";

export default function PlayerRanking({ t, syncTick }) {
  const [rankings, setRankings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const isArabic = t("yes") === "نعم";

  useEffect(() => {
    const loadRankings = () => {
      setRankings(getOverallPlayerRanking());
    };

    loadRankings();
    const interval = setInterval(loadRankings, 5000);
    return () => clearInterval(interval);
  }, [syncTick]);

  const filtered = rankings.filter(
    (p) =>
      p.player_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.player_key.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const finishedCount = rankings.filter((row) => row.status === "Finished").length;
  const pendingCount = rankings.filter((row) => row.status === "Pending").length;

  return (
    <div className="results-page">
      <div className="results-report-header card">
        <div>
          <h1 className="results-report-title">{t("player_rank_title")}</h1>
          <p className="results-report-subtitle">
            {isArabic ? "جدول النتائج الفردية" : "Individual results report"}
          </p>
        </div>
        <button type="button" className="results-print-button" onClick={() => window.print()}>
          {isArabic ? "طباعة / PDF" : "Print / PDF"}
        </button>
      </div>

      <div className="results-summary card">
        <div className="results-summary__item">
          <span>{isArabic ? "إجمالي المتسابقين" : "Total competitors"}</span>
          <strong>{rankings.length}</strong>
        </div>
        <div className="results-summary__item">
          <span>{isArabic ? "منتهية" : "Finished"}</span>
          <strong>{finishedCount}</strong>
        </div>
        <div className="results-summary__item">
          <span>{isArabic ? "قيد الانتظار" : "Pending"}</span>
          <strong>{pendingCount}</strong>
        </div>
      </div>

      <div className="results-controls card">
        <div className="results-controls__field">
          <input
            type="text"
            className="form-input"
            placeholder={t("search").replace("فريق", "لاعب")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t("rank")}</th>
              <th>{t("player_key")}</th>
              <th>{t("full_name")}</th>
              <th>{t("team_name")}</th>
              <th>{t("individual_time")}</th>
              <th>{t("individual_pen")}</th>
              <th>{t("total_time")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="results-empty-state">
                  {t("yes") === "نعم"
                    ? "لا توجد نتائج مطابقة لمنافسين."
                    : "No competitor rankings recorded yet."}
                </td>
              </tr>
            ) : (
              filtered.map((row) => {
                let rankClass = "";
                if (row.rank === 1) rankClass = "rank-1";
                else if (row.rank === 2) rankClass = "rank-2";
                else if (row.rank === 3) rankClass = "rank-3";

                return (
                  <tr key={row.player_id} className={rankClass}>
                    <td>
                      <div
                        className={`rank-badge ${row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : row.rank === 3 ? "bronze" : "other"}`}
                      >
                        {row.rank}
                      </div>
                    </td>
                    <td className="number-text" style={{ fontWeight: "bold" }}>
                      {row.player_key}
                    </td>
                    <td style={{ fontWeight: 700 }}>{row.player_name}</td>
                    <td>
                      <span
                        className="number-text"
                        style={{
                          color: "var(--color-primary-hover)",
                          fontWeight: "bold",
                          marginInlineEnd: "0.5rem",
                        }}
                      >
                        [{row.team_number}]
                      </span>
                      {row.team_name}
                    </td>
                    <td className="timer-text">{formatTime(row.raw_time_seconds)}</td>
                    <td className="timer-text text-danger">
                      {row.penalty_seconds > 0
                        ? `+${formatTime(row.penalty_seconds)}`
                        : "00:00.00"}
                    </td>
                    <td>
                      <span
                        className="timer-text"
                        style={{
                          fontWeight: 800,
                          color: "var(--color-gold)",
                          fontSize: "1rem",
                        }}
                      >
                        {formatTime(row.final_time_seconds)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${row.status.toLowerCase()}`}>
                        {t(row.status) || row.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
