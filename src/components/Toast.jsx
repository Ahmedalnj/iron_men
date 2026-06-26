import React from "react";

const variants = {
  success: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#34d399",
    borderColor: "rgba(16, 185, 129, 0.24)",
  },
  error: {
    background: "rgba(239, 68, 68, 0.12)",
    color: "#f87171",
    borderColor: "rgba(239, 68, 68, 0.24)",
  },
  warning: {
    background: "rgba(245, 158, 11, 0.12)",
    color: "#fbbf24",
    borderColor: "rgba(245, 158, 11, 0.24)",
  },
  info: {
    background: "rgba(59, 130, 246, 0.12)",
    color: "#60a5fa",
    borderColor: "rgba(59, 130, 246, 0.24)",
  },
};

export default function Toast({ toasts }) {
  if (!toasts?.length) return null;

  return (
    <div
      style={{
        position: "fixed",
        insetInlineEnd: "1rem",
        bottom: "1rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
        zIndex: 300,
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            minWidth: "260px",
            maxWidth: "340px",
            border: "1px solid",
            borderRadius: "10px",
            padding: "0.8rem 1rem",
            backdropFilter: "blur(8px)",
            ...(variants[toast.type] || variants.info),
          }}
        >
          <strong style={{ display: "block", marginBottom: "0.2rem" }}>
            {toast.message}
          </strong>
        </div>
      ))}
    </div>
  );
}
