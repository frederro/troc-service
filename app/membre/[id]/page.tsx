"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/app/supabase";

type Annonce = {
  id: number;
  user_id?: string | null;
  categorie?: string | null;
  sous_categorie?: string | null;
  titre?: string | null;
  echange_souhaite?: string | null;
  ouvert_propositions?: boolean | null;
  membre_nom?: string | null;
  localisation?: string | null;
  photos?: string[] | null;
  mode?: "propose" | "cherche" | string | null;
};

type EvaluationRow = {
  id?: number;
  evaluateur_nom?: string | null;
  note?: number | null;
  commentaire?: string | null;
  created_at?: string | null;
};

function FavorisButton({
  annonceId,
  favorisSet,
  onToggle,
}: {
  annonceId: number;
  favorisSet: Set<number>;
  onToggle: (id: number, e: React.MouseEvent) => void;
}) {
  const isFav = favorisSet.has(annonceId);
  return (
    <button
      onClick={(e) => onToggle(annonceId, e)}
      style={{
        position: "absolute",
        top: "8px",
        right: "8px",
        background: "rgba(255,255,255,0.9)",
        border: "none",
        borderRadius: "50%",
        width: "32px",
        height: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        zIndex: 10,
      }}
      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
      aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isFav ? "❤️" : "🤍"}
    </button>
  );
}

export default function MembrePublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: memberId } = React.use(params);

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [favorisSet, setFavorisSet] = useState<Set<number>>(new Set());
  const [scrolled, setScrolled] = useState(false);
  const [menuCompteOpen, setMenuCompteOpen] = useState(false);
  const menuCompteRef = useRef<HTMLDivElement>(null);
  const [evalSummary, setEvalSummary] = useState<{ avg: number; count: number } | null>(null);
  const [evalDerniers, setEvalDerniers] = useState<EvaluationRow[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuCompteRef.current && !menuCompteRef.current.contains(e.target as Node)) {
        setMenuCompteOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!cancelled) {
          if (auth?.user) {
            setUserId(auth.user.id);
            const { data: favs } = await supabase
              .from("favoris")
              .select("annonce_id")
              .eq("user_id", auth.user.id);
            if (!cancelled) setFavorisSet(new Set((favs || []).map((f: any) => f.annonce_id)));
          } else {
            setUserId(null);
            setFavorisSet(new Set());
          }
        }

        const { data, error } = await supabase
          .from("annonces")
          .select("*")
          .eq("user_id", memberId)
          .order("id", { ascending: false });

        if (error) throw error;
        const annoncesData = (data || []) as Annonce[];
        if (!cancelled) setAnnonces(annoncesData);

        const annonceIds = annoncesData.map((a) => a.id);
        if (annonceIds.length === 0) {
          if (!cancelled) {
            setEvalSummary(null);
            setEvalDerniers([]);
          }
        } else {
          const { data: evalData, error: evalErr } = await supabase
            .from("evaluations")
            .select("id, evaluateur_nom, note, commentaire, created_at")
            .in("annonce_id", annonceIds);
          if (!cancelled && !evalErr && evalData) {
            const rows = evalData as EvaluationRow[];
            const notes = rows.map((r) => Number(r.note)).filter((n) => Number.isFinite(n));
            const count = notes.length;
            const avg = count ? notes.reduce((s, n) => s + n, 0) / count : 0;
            setEvalSummary(count ? { avg, count } : null);
            const sorted = [...rows].sort((a, b) => {
              const ta = a.created_at ? new Date(a.created_at).getTime() : Number(a.id) || 0;
              const tb = b.created_at ? new Date(b.created_at).getTime() : Number(b.id) || 0;
              return tb - ta;
            });
            setEvalDerniers(sorted.slice(0, 5));
          } else if (!cancelled) {
            setEvalSummary(null);
            setEvalDerniers([]);
          }
        }
      } catch {
        if (!cancelled) {
          setAnnonces([]);
          setEvalSummary(null);
          setEvalDerniers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (memberId) run();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleToggleFavori = async (annonceId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      window.location.href = "/connexion";
      return;
    }
    const isFav = favorisSet.has(annonceId);
    if (isFav) {
      await supabase.from("favoris").delete().eq("user_id", userId).eq("annonce_id", annonceId);
      setFavorisSet((prev) => {
        const next = new Set(prev);
        next.delete(annonceId);
        return next;
      });
    } else {
      await supabase.from("favoris").insert({ user_id: userId, annonce_id: annonceId });
      setFavorisSet((prev) => new Set(prev).add(annonceId));
    }
  };

  const memberNom = useMemo(() => annonces?.[0]?.membre_nom || "Membre", [annonces]);
  const memberLocalisation = useMemo(() => annonces?.[0]?.localisation || "", [annonces]);
  const initiale = useMemo(() => (memberNom?.trim()?.[0] || "M").toUpperCase(), [memberNom]);

  const confianceBadge =
    evalSummary && evalSummary.count >= 3 && evalSummary.avg >= 4;

  return (
    <div className="membreRoot" style={{ fontFamily: "sans-serif" }}>
      {/* NAVBAR (identique HomeClient) */}
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
          <div
            className="navRow"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
            }}
          >
            <div className="navLeft" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <a
                href="/"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#1D9E75" }} />
                <span style={{ fontWeight: "600", fontSize: "18px" }}>Troc-Service</span>
              </a>

              {!userId && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <a
                    href="/connexion"
                    style={{
                      padding: "6px 14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      textDecoration: "none",
                      color: "#333",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Connexion
                  </a>
                  <a
                    href="/abonnement"
                    className="navBtnOrangeDesktop"
                    style={{
                      padding: "6px 14px",
                      border: "none",
                      borderRadius: "8px",
                      background: "#E8622A",
                      color: "white",
                      textDecoration: "none",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Rejoindre — 1€/mois
                  </a>
                </div>
              )}

              {!!userId && (
                <div ref={menuCompteRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setMenuCompteOpen((v) => !v)}
                    className="navCompteBtn"
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
                    aria-label="Mon compte"
                  >
                    <span className="navCompteIcon" aria-hidden="true">
                      👤
                    </span>
                    <span className="navCompteText">Mon compte</span>
                    <span className="navCompteCaret" aria-hidden="true" style={{ fontSize: "10px", color: "#999" }}>
                      ▾
                    </span>
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
                        { href: "/mes-matches", label: "🔄 Mes matches" },
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
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#E1F5EE")}
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
                          color: "#E8622A",
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

            <div className="navRight" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
                    href="/mes-matches"
                    title="Mes matches"
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
                    🔄
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
                  background: "#1D9E75",
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
        <div style={{ padding: "26px 0 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#1D9E75",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "white",
                }}
                aria-label="Avatar"
              >
                {initiale}
              </div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 600, marginBottom: "2px" }}>
                  {loading ? "Chargement..." : memberNom}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {!!memberLocalisation && (
                    <span
                      style={{
                        fontSize: "12px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: "#E1F5EE",
                        color: "#0F6E56",
                      }}
                    >
                      {memberLocalisation}
                    </span>
                  )}
                  {!loading && evalSummary && evalSummary.count > 0 && (
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFD700" }}>
                      ⭐ {evalSummary.avg.toFixed(1)}/5 — {evalSummary.count} évaluation{evalSummary.count > 1 ? "s" : ""}
                    </span>
                  )}
                  {confianceBadge && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "#fff8e1",
                        color: "#b8860b",
                        border: "1px solid #FFD700",
                      }}
                    >
                      ⭐ Membre de confiance
                    </span>
                  )}
                  {!loading && (
                    <span style={{ fontSize: "12px", color: "#666" }}>
                      {annonces.length} annonce{annonces.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <a
              href="/messages"
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                background: "#E8622A",
                color: "white",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              Contacter
            </a>
          </div>
        </div>

        {!loading && evalDerniers.length > 0 && (
          <section
            style={{
              marginBottom: "28px",
              padding: "18px",
              borderRadius: "12px",
              border: "1px solid #E1F5EE",
              background: "#fafdfb",
            }}
          >
            <h2 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 600, color: "#0F6E56" }}>
              Derniers avis
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {evalDerniers.map((ev, idx) => (
                <li
                  key={ev.id ?? idx}
                  style={{
                    paddingBottom: "14px",
                    marginBottom: "14px",
                    borderBottom: idx < evalDerniers.length - 1 ? "1px solid #eee" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "#333" }}>{ev.evaluateur_nom || "Membre"}</span>
                    <span style={{ fontSize: "12px", color: "#999" }}>
                      {ev.created_at
                        ? new Date(ev.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#FFD700", marginTop: "4px" }}>
                    {"★".repeat(Math.min(5, Math.max(0, Math.round(Number(ev.note) || 0))))}
                    <span style={{ color: "#999", marginLeft: "6px" }}>({Number(ev.note) || 0}/5)</span>
                  </div>
                  {ev.commentaire?.trim() ? (
                    <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#555", lineHeight: 1.5 }}>{ev.commentaire}</p>
                  ) : (
                    <p style={{ margin: "8px 0 0", fontSize: "13px", color: "#aaa", fontStyle: "italic" }}>Pas de commentaire</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {loading ? (
          <div style={{ padding: "18px 0", color: "#666", fontSize: "14px" }}>Chargement des annonces...</div>
        ) : annonces.length === 0 ? (
          <div
            style={{
              padding: "18px 0",
              color: "#666",
              fontSize: "14px",
              borderTop: "1px solid #eee",
              marginTop: "10px",
            }}
          >
            Ce membre n'a pas encore d'annonces
          </div>
        ) : (
          <div className="annoncesGrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {annonces.map((annonce) => (
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
              >
                <div style={{ position: "relative" }}>
                  <FavorisButton annonceId={annonce.id} favorisSet={favorisSet} onToggle={handleToggleFavori} />
                  {annonce?.photos?.[0] ? (
                    <div className="annoncePhotoWrap">
                      <img className="annoncePhoto" src={annonce.photos[0]} alt={annonce.titre || "Photo annonce"} />
                    </div>
                  ) : (
                    <div className="annoncePhotoPlaceholder">📷</div>
                  )}
                </div>

                <div className="annonceBody" style={{ padding: "14px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <span
                      className="annonceCategory"
                      style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#E1F5EE", color: "#0F6E56" }}
                    >
                      {annonce.categorie}
                    </span>
                    {annonce.sous_categorie && (
                      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: "#f0faf5", color: "#0F6E56", border: "1px solid #9FE1CB" }}>
                        {annonce.sous_categorie}
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                    {annonce.mode === "cherche" ? (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#fff3ee", color: "#E8622A", fontWeight: 600 }}>🔍 Cherche</span>
                    ) : (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#E1F5EE", color: "#0F6E56", fontWeight: 600 }}>🎁 Propose</span>
                    )}
                  </div>

                  <div className="annonceTitle" style={{ fontWeight: "600", fontSize: "15px", margin: "4px 0 5px" }}>
                    {annonce.titre}
                  </div>

                  {!!annonce.echange_souhaite && (
                    <div className="annonceEchange" style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                      Échange contre : <span style={{ color: "#1D9E75", fontWeight: "500" }}>{annonce.echange_souhaite}</span>
                    </div>
                  )}

                  {!!annonce.ouvert_propositions && <div style={{ fontSize: "12px", color: "#0F6E56", marginBottom: "6px" }}>✅ Ouvert à toute autre proposition</div>}

                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                    <span style={{ fontSize: "12px", color: "#999" }}>{annonce.membre_nom}</span>
                    <span className="annonceLocation" style={{ fontSize: "11px", padding: "2px 8px", background: "#E1F5EE", color: "#0F6E56", borderRadius: "20px" }}>
                      {annonce.localisation}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        <div style={{ borderTop: "1px solid #eee", padding: "20px 0", marginTop: "40px", fontSize: "11px", color: "#999" }}>
          Troc-Service — Plateforme d'échange entre particuliers ·{" "}
          <a href="#" style={{ color: "#1D9E75" }}>
            CGU
          </a>{" "}
          ·{" "}
          <a href="#" style={{ color: "#1D9E75" }}>
            Mentions légales
          </a>{" "}
          ·{" "}
          <a href="#" style={{ color: "#1D9E75" }}>
            RGPD
          </a>
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
          .navBtnOrangeDesktop {
            display: none !important;
          }
          .navRow {
            flex-wrap: nowrap !important;
          }
          .navLeft {
            flex-wrap: nowrap !important;
            min-width: 0 !important;
            gap: 10px !important;
          }
          .navRight {
            flex-shrink: 0 !important;
          }
          .navCompteBtn {
            padding: 8px 10px !important;
            gap: 0 !important;
          }
          .navCompteText,
          .navCompteCaret {
            display: none !important;
          }
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

