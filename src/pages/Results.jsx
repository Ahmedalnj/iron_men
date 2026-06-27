import React, { useState, useEffect } from "react";
import { getTeamResultsCalculated } from "../state";
import { formatTime } from "../utils/timeHelpers";

export default function Results({ t, syncTick }) {
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const isArabic = t("yes") === "نعم";

  useEffect(() => {
    const loadResults = () => {
      const data = getTeamResultsCalculated();

      data.sort((a, b) => {
        if (a.ranking_time_seconds === null && b.ranking_time_seconds === null)
          return 0;
        if (a.ranking_time_seconds === null) return 1;
        if (b.ranking_time_seconds === null) return -1;

        if (a.ranking_time_seconds !== b.ranking_time_seconds) {
          return a.ranking_time_seconds - b.ranking_time_seconds;
        }
        return a.team_number.localeCompare(b.team_number);
      });

      setResults(data);
    };

    loadResults();
    const interval = setInterval(loadResults, 5000);
    return () => clearInterval(interval);
  }, [syncTick]);

  const filtered = results.filter((row) => {
    const matchesSearch =
      row.team_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.team_number.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "FINISHED") {
      matchesStatus = row.result_status === "Finished";
    } else if (statusFilter === "INCOMPLETE") {
      matchesStatus = row.is_incomplete;
    } else if (statusFilter === "PENDING") {
      matchesStatus = row.result_status === "Pending";
    }

    return matchesSearch && matchesStatus;
  });

  const finishedCount = results.filter((row) => row.result_status === "Finished").length;
  const incompleteCount = results.filter((row) => row.is_incomplete).length;
  const pendingCount = results.filter((row) => row.result_status === "Pending").length;

  return (
    <div className="results-page">
      <div className="results-report-header card">
        <div>
          <h1 className="results-report-title">{t("results")}</h1>
          <p className="results-report-subtitle">
            {isArabic ? "جدول النتائج النهائي" : "Final standings report"}
          </p>
        </div>
        <button
          type="button"
          className="results-print-button"
          onClick={() => window.print()}
        >
          {isArabic ? "طباعة / PDF" : "Print / PDF"}
        </button>
      </div>

      <div className="results-summary card">
        <div className="results-summary__item">
          <span>{isArabic ? "إجمالي الفرق" : "Total teams"}</span>
          <strong>{results.length}</strong>
        </div>
        <div className="results-summary__item">
          <span>{isArabic ? "منتهية" : "Finished"}</span>
          <strong>{finishedCount}</strong>
        </div>
        <div className="results-summary__item">
          <span>{isArabic ? "غير مكتملة" : "Incomplete"}</span>
          <strong>{incompleteCount}</strong>
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
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="results-controls__field">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">
              {isArabic ? "كل النتائج" : "All Standings"}
            </option>
            <option value="FINISHED">
              {isArabic ? "منتهي فقط" : "Finished Only"}
            </option>
            <option value="INCOMPLETE">
              {isArabic ? "غير مكتمل (DNF/DNS)" : "Incomplete (DNF/DNS)"}
            </option>
            <option value="PENDING">
              {isArabic ? "قيد الانتظار" : "Pending Only"}
            </option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>{t("overall_rank")}</th>
              <th>{t("team_num")}</th>
              <th>{t("team_name")}</th>
              <th>{isArabic ? "وقت اللاعبين" : "Player Times"}</th>
              <th>{t("raw_time")}</th>
              <th>{t("penalty_sec")}</th>
              <th>{t("total_time")}</th>
              <th>{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="results-empty-state">
                  {isArabic ? "لا توجد نتائج مطابقة لبحثك." : "No matching results found."}
                </td>
              </tr>
            ) : (
              filtered.map((row, index) => {
                const hasTime = row.has_times && !row.is_incomplete;
                const rankNum = hasTime ? index + 1 : null;

                let rankClass = "";
                if (rankNum === 1) rankClass = "rank-1";
                if (rankNum === 2) rankClass = "rank-2";
                if (rankNum === 3) rankClass = "rank-3";

                return (
                  <tr key={row.team_number} className={rankClass}>
                    <td>
                      {rankNum ? (
                        <div
                          className={`rank-badge ${rankNum === 1 ? "gold" : rankNum === 2 ? "silver" : rankNum === 3 ? "bronze" : "other"}`}
                        >
                          {rankNum}
                        </div>
                      ) : (
                        <span style={{ color: "#6b7280" }}>—</span>
                      )}
                    </td>
                    <td className="number-text" style={{ fontWeight: 800 }}>
                      {row.team_number}
                    </td>
                    <td style={{ fontWeight: 700 }}>{row.team_name}</td>
                    <td style={{ fontSize: "0.8rem", maxWidth: "320px" }}>
                      <div className="results-player-list" style={{ direction: isArabic ? "rtl" : "ltr" }}>
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const legTime = row.timing[`leg${num}_time`];
                          if (legTime === null || legTime === undefined || legTime === "") {
                            return null;
                          }

                          const playerName =
                            row.leg_players?.[`leg${num}_player_name`] ||
                            (isArabic ? "لاعب غير معروف" : "Unknown Player");

                          return (
                            <div key={num} className="results-player-item">
                              <span>{playerName}</span>
                              <span>{formatTime(legTime)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="timer-text">
                      {row.has_times
                        ? formatTime(row.total_result_seconds - row.penalty_seconds)
                        : "00:00.00"}
                    </td>
                    <td className="timer-text text-danger" style={{ fontWeight: "bold" }}>
                      {row.penalty_seconds > 0
                        ? `+${formatTime(row.penalty_seconds)}`
                        : "00:00.00"}
                    </td>
                    <td>
                      {row.is_incomplete ? (
                        <span className="badge refunded">{row.result_status}</span>
                      ) : row.has_times ? (
                        <span
                          className="timer-text"
                          style={{
                            fontWeight: 800,
                            color: "var(--color-primary-hover)",
                            fontSize: "1rem",
                          }}
                        >
                          {formatTime(row.total_result_seconds)}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>00:00.00</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${row.result_status.toLowerCase()}`}>
                        {t(row.result_status) || row.result_status}
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
