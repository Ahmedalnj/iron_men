import React from "react";

export default function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        <div className="loading-spinner" />
        <h2>بطولة البطل الحديدي 2026</h2>
        <p>Loading tournament data…</p>
      </div>
    </div>
  );
}
