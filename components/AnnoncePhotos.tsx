"use client";

import React from "react";

type Props = {
  photos?: string[] | null;
  altBase?: string;
};

export default function AnnoncePhotos({ photos, altBase }: Props) {
  const list = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  if (list.length === 0) {
    return (
      <div
        style={{
          background: "#f5f5f5",
          height: "200px",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ccc",
          marginBottom: "24px",
          fontSize: "14px",
        }}
      >
        Photo à venir
      </div>
    );
  }

  const selected = list[Math.min(selectedIndex, list.length - 1)];

  return (
    <div style={{ marginBottom: "24px" }}>
      <img
        src={selected}
        alt={altBase ? `${altBase} — photo ${selectedIndex + 1}` : `Photo ${selectedIndex + 1}`}
        style={{
          width: "100%",
          height: "320px",
          objectFit: "contain",
          borderRadius: "12px",
          background: "white",
          display: "block",
          border: "1px solid #eee",
        }}
      />

      {list.length > 1 && (
        <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
          {list.map((url, idx) => {
            const isActive = idx === selectedIndex;
            return (
              <button
                key={`${url}-${idx}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                aria-current={isActive ? "true" : undefined}
                style={{
                  padding: 0,
                  border: isActive ? "2px solid #1D9E75" : "1px solid #ddd",
                  borderRadius: "10px",
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "white",
                }}
              >
                <img
                  src={url}
                  alt={altBase ? `${altBase} — miniature ${idx + 1}` : `Miniature ${idx + 1}`}
                  style={{
                    width: "84px",
                    height: "64px",
                    objectFit: "cover",
                    display: "block",
                    background: "#f5f5f5",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

