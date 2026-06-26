import React from "react";

export default function Toast({ toasts }) {
  if (!toasts?.length) return null;

  return (
    <div className="toast-wrapper">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card ${toast.type || "info"}`}>
          <strong>{toast.message}</strong>
        </div>
      ))}
    </div>
  );
}
