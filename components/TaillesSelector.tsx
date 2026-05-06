"use client";

import React from "react";

export type TaillesValeurs = {
  taille_haut: string;
  taille_bas_fr: string;
  taille_bas_us: string;
  pointure_eu: string;
  pointure_us: string;
};

export type TaillesSelectorProps = {
  valeurs: TaillesValeurs;
  onChange: (champ: string, valeur: string) => void;
};

const HAUTS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;
const BAS_FR = ["34", "36", "38", "40", "42", "44", "46", "48"] as const;
const BAS_US = ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "36", "38"] as const;
const POINTURES_EU = [
  "36",
  "36.5",
  "37",
  "37.5",
  "38",
  "38.5",
  "39",
  "39.5",
  "40",
  "40.5",
  "41",
  "41.5",
  "42",
  "42.5",
  "43",
  "43.5",
  "44",
  "44.5",
  "45",
  "45.5",
  "46",
] as const;
const POINTURES_US = [
  "4",
  "4.5",
  "5",
  "5.5",
  "6",
  "6.5",
  "7",
  "7.5",
  "8",
  "8.5",
  "9",
  "9.5",
  "10",
  "10.5",
  "11",
  "11.5",
  "12",
  "13",
] as const;

function SelectField(props: {
  id: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      id={props.id}
      value={props.value || ""}
      onChange={(e) => props.onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid #ddd",
        fontSize: "14px",
        background: "white",
        boxSizing: "border-box",
        outline: "none",
      }}
    >
      <option value="">{props.placeholder}</option>
      {props.options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

export default function TaillesSelector({ valeurs, onChange }: TaillesSelectorProps) {
  const titleId = "tailles-title";

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: "14px",
    fontWeight: 800,
    marginBottom: "10px",
    color: "#0F6E56",
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "6px",
    color: "#444",
  };

  const clearBtnStyle: React.CSSProperties = {
    marginTop: "10px",
    background: "transparent",
    border: "none",
    padding: 0,
    fontSize: "12px",
    fontWeight: 700,
    color: "#777",
    cursor: "pointer",
    textDecoration: "underline",
    textUnderlineOffset: 3,
    alignSelf: "flex-start",
  };

  return (
    <section
      aria-labelledby={titleId}
      style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: "12px",
        padding: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", marginBottom: "14px" }}>
        <h3 id={titleId} style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1D9E75" }}>
          Mes tailles <span style={{ fontSize: "12px", fontWeight: 700, color: "#999" }}>(optionnel)</span>
        </h3>
      </div>

      {/* Haut */}
      <div
        style={{
          border: "1px solid #E1F5EE",
          borderRadius: "12px",
          padding: "14px",
          background: "#fbfffd",
          marginBottom: "12px",
        }}
      >
        <div style={sectionTitleStyle}>
          <span aria-hidden="true">👕</span>
          <span>Haut</span>
        </div>
        <label htmlFor="taille_haut" style={labelStyle}>
          Taille
        </label>
        <SelectField
          id="taille_haut"
          value={valeurs?.taille_haut ?? ""}
          placeholder="—"
          options={HAUTS}
          onChange={(v) => onChange("taille_haut", v)}
        />
        <button
          type="button"
          onClick={() => onChange("taille_haut", "")}
          style={clearBtnStyle}
          aria-label="Effacer la taille haut"
        >
          Effacer
        </button>
      </div>

      {/* Bas */}
      <div
        style={{
          border: "1px solid #E1F5EE",
          borderRadius: "12px",
          padding: "14px",
          background: "#fbfffd",
          marginBottom: "12px",
        }}
      >
        <div style={sectionTitleStyle}>
          <span aria-hidden="true">👖</span>
          <span>Bas</span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px", minWidth: 180 }}>
            <label htmlFor="taille_bas_fr" style={labelStyle}>
              FR
            </label>
            <SelectField
              id="taille_bas_fr"
              value={valeurs?.taille_bas_fr ?? ""}
              placeholder="—"
              options={BAS_FR}
              onChange={(v) => onChange("taille_bas_fr", v)}
            />
          </div>

          <div style={{ flex: "1 1 180px", minWidth: 180 }}>
            <label htmlFor="taille_bas_us" style={labelStyle}>
              US
            </label>
            <SelectField
              id="taille_bas_us"
              value={valeurs?.taille_bas_us ?? ""}
              placeholder="—"
              options={BAS_US}
              onChange={(v) => onChange("taille_bas_us", v)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onChange("taille_bas_fr", "");
            onChange("taille_bas_us", "");
          }}
          style={clearBtnStyle}
          aria-label="Effacer les tailles bas"
        >
          Effacer
        </button>
      </div>

      {/* Pointure */}
      <div
        style={{
          border: "1px solid #E1F5EE",
          borderRadius: "12px",
          padding: "14px",
          background: "#fbfffd",
        }}
      >
        <div style={sectionTitleStyle}>
          <span aria-hidden="true">👟</span>
          <span>Pointure</span>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px", minWidth: 180 }}>
            <label htmlFor="pointure_eu" style={labelStyle}>
              EU
            </label>
            <SelectField
              id="pointure_eu"
              value={valeurs?.pointure_eu ?? ""}
              placeholder="—"
              options={POINTURES_EU}
              onChange={(v) => onChange("pointure_eu", v)}
            />
          </div>

          <div style={{ flex: "1 1 180px", minWidth: 180 }}>
            <label htmlFor="pointure_us" style={labelStyle}>
              US
            </label>
            <SelectField
              id="pointure_us"
              value={valeurs?.pointure_us ?? ""}
              placeholder="—"
              options={POINTURES_US}
              onChange={(v) => onChange("pointure_us", v)}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onChange("pointure_eu", "");
            onChange("pointure_us", "");
          }}
          style={clearBtnStyle}
          aria-label="Effacer les pointures"
        >
          Effacer
        </button>
      </div>
    </section>
  );
}

