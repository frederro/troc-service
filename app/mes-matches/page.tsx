"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/app/supabase";

type Annonce = {
  id: number;
  titre?: string | null;
  description?: string | null;
  categorie?: string | null;
  sous_categorie?: string | null;
  echange_souhaite?: string | null;
  categorie_souhaitee?: string | null;
  sous_categorie_souhaitee?: string | null;
  ouvert_propositions?: boolean | null;
  membre_nom?: string | null;
  localisation?: string | null;
  photos?: unknown;
  user_id?: string | null;
};

type MatchItem = {
  annonce: Annonce;
  score: number;
};

const COLORS = {
  green: "#1D9E75",
  greenDark: "#0F6E56",
  greenLight: "#E1F5EE",
  orange: "#E8622A",
} as const;

function normalizeText(v: string | null | undefined) {
  return (v ?? "").trim();
}

function cityOfLocalisation(localisation: string | null | undefined) {
  const raw = normalizeText(localisation).toLowerCase();
  if (!raw) return "";
  const beforeComma = raw.split(",")[0] ?? raw;
  const beforeParen = beforeComma.split("(")[0] ?? beforeComma;
  return beforeParen.trim();
}

function normalizePhotos(photos: unknown): string[] {
  if (!photos) return [];
  if (Array.isArray(photos)) return photos.filter(Boolean).map(String);
  if (typeof photos === "string") {
    const s = photos.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {
        // ignore
      }
    }
    return [s];
  }
  return [];
}

function computeScore(a: Annonce, b: Annonce) {
  let score = 0;

  if (normalizeText(b.categorie) && normalizeText(a.categorie_souhaitee) && b.categorie === a.categorie_souhaitee) score += 40;
  if (normalizeText(b.sous_categorie) && normalizeText(a.sous_categorie_souhaitee) && b.sous_categorie === a.sous_categorie_souhaitee) score += 30;
  if (normalizeText(a.categorie) && normalizeText(b.categorie_souhaitee) && a.categorie === b.categorie_souhaitee) score += 40;
  if (normalizeText(a.sous_categorie) && normalizeText(b.sous_categorie_souhaitee) && a.sous_categorie === b.sous_categorie_souhaitee) score += 30;

  const cityA = cityOfLocalisation(a.localisation);
  const cityB = cityOfLocalisation(b.localisation);
  if (cityA && cityB && cityA === cityB) score += 20;

  if (b.ouvert_propositions === true) score += 10;

  return score;
}

export default function MesMatchesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [myAnnonces, setMyAnnonces] = useState<Annonce[]>([]);
  const [otherAnnonces, setOtherAnnonces] = useState<Annonce[]>([]);

  const [scrolled, setScrolled] = useState(false);
  const [menuCompteOpen, setMenuCompteOpen] = useState(false);
  const menuCompteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      setIsCheckingAuth(false);
      if (!uid) window.location.assign("/connexion");
    });
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuCompteRef.current && !menuCompteRef.current.contains(e.target as Node)) setMenuCompteOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("annonces")
          .select(
            "id,titre,description,categorie,sous_categorie,echange_souhaite,categorie_souhaitee,sous_categorie_souhaitee,ouvert_propositions,membre_nom,localisation,photos,user_id"
          );
        if (err) throw err;
        const rows = (data ?? []) as Annonce[];
        const mine = rows.filter((a) => a.user_id === userId);
        const others = rows.filter((a) => a.user_id && a.user_id !== userId);
        if (!cancelled) {
          setMyAnnonces(mine);
          setOtherAnnonces(others);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Erreur inconnue");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const matches = useMemo<MatchItem[]>(() => {
    if (!userId) return [];
    if (myAnnonces.length === 0 || otherAnnonces.length === 0) return [];

    const bestById = new Map<number, MatchItem>();

    for (const a of myAnnonces) {
      for (const b of otherAnnonces) {
        if (!b?.id) continue;
        const score = computeScore(a, b);
        if (score < 40) continue;
        const existing = bestById.get(b.id);
        if (!existing || score > existing.score) bestById.set(b.id, { annonce: b, score });
      }
    }

    return Array.from(bestById.values()).sort((x, y) => y.score - x.score);
  }, [userId, myAnnonces, otherAnnonces]);

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (isCheckingAuth) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: "40px 20px", maxWidth: "1100px", margin: "0 auto", color: "#666" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div className="matchesRoot" style={{ fontFamily: "sans-serif" }}>
      {/* NAVBAR (copiée de HomeClient.tsx) */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "white",
          borderBottom: "1px solid #eee",
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
          transition: "box-shadow 0.2s ease",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS.green }} />
                <span style={{ fontWeight: "600", fontSize: "18px" }}>Troc-Service</span>
              </a>

              {!!userId && (
                <div ref={menuCompteRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setMenuCompteOpen((v) => !v)}
                    style={{
                      padding: "6px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      background: "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                      color: "#333",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    👤 Mon compte <span style={{ fontSize: "10px", color: "#999" }}>▾</span>
                  </button>
                  {menuCompteOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        left: 0,
                        background: "white",
                        border: "1px solid #eee",
                        borderRadius: "10px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                        minWidth: "180px",
                        zIndex: 500,
                        overflow: "hidden",
                      }}
                    >
                      {[
                        { href: "/profil", label: "👤 Mon profil" },
                        { href: "/profil", label: "📋 Mes annonces" },
                        { href: "/favoris", label: "❤️ Mes favoris" },
                        { href: "/messages", label: "✉️ Mes messages" },
                      ].map((item) => (
                        <a
                          key={item.href + item.label}
                          href={item.href}
                          style={{
                            display: "block",
                            padding: "10px 16px",
                            textDecoration: "none",
                            color: "#333",
                            fontSize: "13px",
                            borderBottom: "1px solid #f5f5f5",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.greenLight)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                        >
                          {item.label}
                        </a>
                      ))}
                      <button
                        onClick={handleDeconnexion}
                        style={{
                          display: "block",
                          width: "100%",
                          padding: "10px 16px",
                          textAlign: "left",
                          background: "white",
                          border: "none",
                          cursor: "pointer",
                          color: COLORS.orange,
                          fontSize: "13px",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff3ee")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                      >
                        🚪 Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {!!userId && (
                <>
                  <a
                    href="/messages"
                    title="Mes messages"
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      background: "white",
                      textDecoration: "none",
                      fontSize: "18px",
                      lineHeight: "1",
                    }}
                  >
                    ✉️
                  </a>
                  <a
                    href="/favoris"
                    title="Mes favoris"
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      background: "white",
                      textDecoration: "none",
                      fontSize: "18px",
                      lineHeight: "1",
                    }}
                  >
                    ❤️
                  </a>
                </>
              )}
              <a
                href="/creer-annonce"
                style={{
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "8px",
                  background: COLORS.green,
                  color: "white",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                }}
              >
                + Déposer
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ padding: "40px 0 18px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "500", marginBottom: "10px" }}>🔄 Mes matches</h1>
          <p style={{ color: "#666", marginBottom: 0 }}>Annonces qui correspondent à ce que vous cherchez</p>
        </div>

        {isLoading && (
          <div style={{ padding: "14px 0", color: "#666" }}>
            Chargement des matches…
          </div>
        )}

        {!!error && (
          <div
            style={{
              padding: "12px 14px",
              border: "1px solid #ffd6c9",
              background: "#fff3ee",
              color: COLORS.orange,
              borderRadius: "10px",
              marginBottom: "16px",
            }}
          >
            {error}
          </div>
        )}

        {!isLoading && !error && myAnnonces.length === 0 && (
          <div
            style={{
              padding: "14px 16px",
              border: "1px solid #eee",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontWeight: "600", marginBottom: "6px" }}>Pour trouver des matches, commencez par publier une annonce.</div>
            <div style={{ color: "#666", fontSize: "13px", marginBottom: "10px" }}>
              Ajoutez une <span style={{ color: COLORS.greenDark, fontWeight: "500" }}>catégorie souhaitée</span> et une{" "}
              <span style={{ color: COLORS.greenDark, fontWeight: "500" }}>sous-catégorie souhaitée</span> pour améliorer le matching.
            </div>
            <a
              href="/creer-annonce"
              style={{
                display: "inline-block",
                padding: "10px 14px",
                borderRadius: "10px",
                background: COLORS.green,
                color: "white",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              + Créer une annonce
            </a>
          </div>
        )}

        {!isLoading && !error && myAnnonces.length > 0 && matches.length === 0 && (
          <div
            style={{
              padding: "14px 16px",
              border: "1px solid #eee",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontWeight: "600", marginBottom: "6px" }}>Pas encore de match — mais vous êtes tout près.</div>
            <div style={{ color: "#666", fontSize: "13px", marginBottom: "10px" }}>
              Publiez plus d’annonces et renseignez bien{" "}
              <span style={{ color: COLORS.greenDark, fontWeight: "500" }}>catégorie souhaitée</span> /{" "}
              <span style={{ color: COLORS.greenDark, fontWeight: "500" }}>sous-catégorie souhaitée</span> pour augmenter vos chances.
            </div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <a
                href="/creer-annonce"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: COLORS.green,
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                + Créer une annonce
              </a>
              <a
                href="/"
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "white",
                  border: `1px solid ${COLORS.green}`,
                  color: COLORS.greenDark,
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Explorer les annonces
              </a>
            </div>
          </div>
        )}

        {!isLoading && !error && matches.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "500", margin: 0 }}>
              {matches.length} match{matches.length > 1 ? "s" : ""} trouvé{matches.length > 1 ? "s" : ""}
            </h2>
            <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: COLORS.greenLight, color: COLORS.greenDark }}>
              Score min. 40 pts
            </span>
          </div>
        )}

        <div className="annoncesGrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {matches.map(({ annonce, score }) => {
            const photos = normalizePhotos(annonce.photos);
            return (
              <a
                key={annonce.id}
                href={`/annonce/${annonce.id}`}
                className="annonceCard"
                style={{
                  border: "2px solid #eee",
                  borderRadius: "12px",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  position: "relative",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = COLORS.green;
                  e.currentTarget.style.boxShadow = "0 0 0 3px #E1F5EE";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#eee";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: COLORS.greenLight,
                      color: COLORS.greenDark,
                      fontSize: "12px",
                      fontWeight: "600",
                      border: "1px solid #9FE1CB",
                      zIndex: 10,
                    }}
                    title="Score de compatibilité"
                  >
                    {score} pts
                  </div>

                  {score >= 120 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "42px",
                        left: "8px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "#fff3ee",
                        color: COLORS.orange,
                        fontSize: "12px",
                        fontWeight: "600",
                        border: "1px solid #ffd6c9",
                        zIndex: 10,
                      }}
                    >
                      Match parfait 🎯
                    </div>
                  )}

                  {photos?.[0] ? (
                    <div className="annoncePhotoWrap">
                      <img className="annoncePhoto" src={photos[0]} alt={annonce.titre || "Photo annonce"} />
                    </div>
                  ) : (
                    <div className="annoncePhotoPlaceholder">📷</div>
                  )}
                </div>

                <div className="annonceBody" style={{ padding: "14px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <span
                      className="annonceCategory"
                      style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: COLORS.greenLight, color: COLORS.greenDark }}
                    >
                      {annonce.categorie}
                    </span>
                    {annonce.sous_categorie && (
                      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: "#f0faf5", color: COLORS.greenDark, border: "1px solid #9FE1CB" }}>
                        {annonce.sous_categorie}
                      </span>
                    )}
                  </div>
                  <div className="annonceTitle" style={{ fontWeight: "600", fontSize: "15px", margin: "4px 0 5px" }}>
                    {annonce.titre}
                  </div>
                  {!!annonce.echange_souhaite && (
                    <div className="annonceEchange" style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                      Échange contre : <span style={{ color: COLORS.green, fontWeight: "500" }}>{annonce.echange_souhaite}</span>
                    </div>
                  )}
                  {!!annonce.ouvert_propositions && (
                    <div style={{ fontSize: "12px", color: COLORS.greenDark, marginBottom: "6px" }}>✅ Ouvert à toute autre proposition</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#999" }}>{annonce.membre_nom}</span>
                    <span className="annonceLocation" style={{ fontSize: "11px", padding: "2px 8px", background: COLORS.greenLight, color: COLORS.greenDark, borderRadius: "20px" }}>
                      {annonce.localisation}
                    </span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid #eee", padding: "20px 0", marginTop: "40px", fontSize: "11px", color: "#999" }}>
          Troc-Service — Plateforme d'échange entre particuliers · <a href="#" style={{ color: COLORS.green }}>CGU</a> ·{" "}
          <a href="#" style={{ color: COLORS.green }}>Mentions légales</a> · <a href="#" style={{ color: COLORS.green }}>RGPD</a>
        </div>
      </main>

      <style jsx>{`
        .annoncePhotoWrap {
          width: 100%;
          aspect-ratio: 1 / 1;
          overflow: hidden;
          background: #f5f5f5;
        }
        .annoncePhoto {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }
        .annonceCard:hover .annoncePhoto {
          transform: scale(1.04);
        }
        .annoncePhotoPlaceholder {
          width: 100%;
          aspect-ratio: 1 / 1;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
          font-size: 32px;
        }
        @media (max-width: 1024px) {
          .annoncesGrid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
        }
        @media (max-width: 768px) {
          .annoncesGrid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .annonceCard {
            border-radius: 8px !important;
          }
          .annonceBody {
            padding: 8px !important;
          }
          .annonceCategory {
            font-size: 11px !important;
          }
          .annonceTitle {
            font-size: 13px !important;
          }
          .annonceEchange {
            font-size: 11px !important;
            margin-bottom: 3px !important;
          }
          .annonceLocation {
            font-size: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}

