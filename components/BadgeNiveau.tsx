"use client";

import React, { useMemo } from "react";

export type BadgeNiveauProps = {
  points: number;
  size?: "sm" | "md" | "lg";
};

type Niveau = {
  emoji: string;
  label: "Bronze" | "Argent" | "Or";
  color: string;
};

function clampPoints(points: number): number {
  if (!Number.isFinite(points)) return 0;
  return Math.max(0, Math.floor(points));
}

function getNiveau(points: number): Niveau {
  const p = clampPoints(points);
  if (p >= 300) return { emoji: "🥇", label: "Or", color: "#FFD700" };
  if (p >= 100) return { emoji: "🥈", label: "Argent", color: "#A8A8A8" };
  return { emoji: "🥉", label: "Bronze", color: "#CD7F32" };
}

export default function BadgeNiveau({ points, size = "md" }: BadgeNiveauProps) {
  const safePoints = clampPoints(points);
  const niveau = useMemo(() => getNiveau(safePoints), [safePoints]);

  const ui = useMemo(() => {
    if (size === "sm") {
      return {
        fontSize: 12,
        padding: "6px 10px",
        gap: 6,
      } as const;
    }
    if (size === "lg") {
      return {
        fontSize: 15,
        padding: "10px 14px",
        gap: 8,
      } as const;
    }
    return {
      fontSize: 13,
      padding: "8px 12px",
      gap: 7,
    } as const;
  }, [size]);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: ui.gap,
        padding: ui.padding,
        borderRadius: 999,
        border: `1px solid ${niveau.color}`,
        background: "white",
        color: "#111",
        fontWeight: 800,
        fontSize: ui.fontSize,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
      aria-label={`${niveau.label} (${safePoints} points)`}
      title={`${niveau.emoji} ${niveau.label} (${safePoints} pts)`}
    >
      <span aria-hidden="true" style={{ color: niveau.color }}>
        {niveau.emoji}
      </span>
      <span>
        <span style={{ color: niveau.color }}>{niveau.label}</span> ({safePoints} pts)
      </span>
    </span>
  );
}

