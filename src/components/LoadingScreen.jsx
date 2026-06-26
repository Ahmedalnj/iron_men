import React from "react";

export default function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0f24",
      }}
    >
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "999px",
            border: "4px solid rgba(225, 29, 72, 0.2)",
            borderTopColor: "#e11d48",
            margin: "0 auto 1rem",
            animation: "spin 1s linear infinite",
          }}
        />
        <h2 style={{ marginBottom: "0.5rem" }}>بطولة البطل الحديدي 2026</h2>
        <p style={{ color: "#9ca3af" }}>Loading tournament data…</p>
      </div>
    </div>
  );
}
