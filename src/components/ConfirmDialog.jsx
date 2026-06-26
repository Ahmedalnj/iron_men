import React from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const colors = {
    danger: { accent: "#f87171", background: "rgba(239, 68, 68, 0.12)" },
    warning: { accent: "#fbbf24", background: "rgba(245, 158, 11, 0.12)" },
    info: { accent: "#60a5fa", background: "rgba(59, 130, 246, 0.12)" },
  };

  const palette = colors[variant] || colors.warning;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 23, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 500,
      }}
    >
      <div
        style={{
          width: "min(92vw, 420px)",
          background: "#131a35",
          border: `1px solid ${palette.accent}`,
          borderRadius: "12px",
          padding: "1.25rem",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        }}
      >
        <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>{title}</h3>
        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>{message}</p>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1rem",
          }}
        >
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
