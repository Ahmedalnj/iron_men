import React, { useState, useEffect } from "react";
import { getTeamResultsCalculated } from "../state";
import { formatDurationLabel } from "../utils/timeHelpers";
import { Trophy, Search, Filter, HelpCircle } from "lucide-react";

export default function Results({ t, syncTick }) {
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const isArabic = t("yes") === "نعم";

  useEffect(() => {
    const loadResults = () => {
      const data = getTeamResultsCalculated();

      // Sort by ranking time. Incomplete runs (9999) go to bottom. Unrecorded (null) go lower.
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

  // Filtered list
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

  return (
    <div>
      <h1 className="mb-4" style={{ fontSize: "1.8rem", fontWeight: 800 }}>
        {t("results")}
      </h1>

      {/* Filters Card */}
      <div
        className="card"
        style={{
          padding: "1rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            flex: "1",
            minWidth: "240px",
          }}
        >
          <Search size={18} style={{ color: "#9ca3af" }} />
          <input
            type="text"
            className="form-input"
            style={{ width: "100%" }}
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "center",
            minWidth: "200px",
          }}
        >
          <Filter size={18} style={{ color: "#9ca3af" }} />
          <select
            className="form-select"
            style={{ width: "100%" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">
              {t("yes") === "نعم" ? "كل النتائج" : "All Standings"}
            </option>
            <option value="FINISHED">
              {t("yes") === "نعم" ? "منتهي فقط" : "Finished Only"}
            </option>
            <option value="INCOMPLETE">
              {t("yes") === "نعم"
                ? "غير مكتمل (DNF/DNS)"
                : "Incomplete (DNF/DNS)"}
            </option>
            <option value="PENDING">
              {t("yes") === "نعم" ? "قيد الانتظار" : "Pending Only"}
            </option>
          </select>
        </div>
      </div>

      {/* Results Standings table */}
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
                <td
                  colSpan={8}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  {t("yes") === "نعم"
                    ? "لا توجد نتائج مطابقة لبحثك."
                    : "No matching results found."}
                </td>
              </tr>
            ) : (
              filtered.map((row, index) => {
                // Determine live rank index for completed runs.
                // Runs with null timing or incomplete shouldn't show podium icons, but let's calculate rank cleanly.
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
                    <td style={{ fontSize: "0.8rem", maxWidth: "300px" }}>
                      {/* Sub-grid with leg-by-leg details */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "0.25rem",
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const legTime = row.timing[`leg${num}_time`];
                          if (
                            legTime === null ||
                            legTime === undefined ||
                            legTime === ""
                          )
                            return null;
                          return (
                            <div
                              key={num}
                              className="number-text"
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                padding: "2px 4px",
                                borderRadius: "4px",
                              }}
                            >
                              L{num}:{" "}
                              {formatDurationLabel(legTime, {
                                locale: isArabic ? "ar" : "en",
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="timer-text">
                      {row.has_times
                        ? formatDurationLabel(
                            row.total_result_seconds - row.penalty_seconds,
                            { locale: isArabic ? "ar" : "en" },
                          )
                        : "--:--"}
                    </td>
                    <td
                      className="timer-text text-danger"
                      style={{ fontWeight: "bold" }}
                    >
                      {row.penalty_seconds > 0
                        ? `+${formatDurationLabel(row.penalty_seconds, { locale: isArabic ? "ar" : "en" })}`
                        : isArabic
                          ? "0 ثانية"
                          : "0 seconds"}
                    </td>
                    <td>
                      {row.is_incomplete ? (
                        <span className="badge refunded">
                          {row.result_status}
                        </span>
                      ) : row.has_times ? (
                        <span
                          className="timer-text"
                          style={{
                            fontWeight: 800,
                            color: "var(--color-primary-hover)",
                            fontSize: "1rem",
                          }}
                        >
                          {formatDurationLabel(row.total_result_seconds, {
                            locale: isArabic ? "ar" : "en",
                          })}
                        </span>
                      ) : (
                        <span style={{ color: "#9ca3af" }}>--:--</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${row.result_status.toLowerCase()}`}
                      >
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

      {/* Summary Card for Judges / Timekeepers */}
      <div className="card">
        <h3 className="card-title mb-2">
          ⚖️ ملاحظات التحكيم والميقاتي / Officiating Notes
        </h3>
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", lineHeight: "1.5" }}>
          *{" "}
          {t("yes") === "نعم"
            ? "الفرق التي تسجل حالات DNS (لم يبدأ) أو DNF (لم ينهِ) أو إصابة يتم استبعادها من الترتيب التنافسي المباشر وتثبيتها بقيمة زمنية جزائية قدرها 9999 ثانية لدفعها لآخر الجدول."
            : "Teams recording DNF, DNS, or Injured status are automatically pushed to the bottom of the scoreboard using the 9999s penalty sentinel value to preserve the competitive ranking structure."}
        </p>
      </div>
    </div>
  );
}
