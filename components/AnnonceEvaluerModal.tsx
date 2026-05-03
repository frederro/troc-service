"use client";

import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/app/supabase";

const STAR_GOLD = "#FFD700";
const GREEN = "#1D9E75";
const GREEN_DARK = "#0F6E56";
const MINT = "#E1F5EE";
const ORANGE = "#E8622A";

type Props = {
  annonceId: number;
  annonceUserId: string | null | undefined;
  membreNom: string;
  titre: string;
};

export default function AnnonceEvaluerModal({
  annonceId,
  annonceUserId,
  membreNom,
  titre,
}: Props) {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [evaluateurNom, setEvaluateurNom] = useState("");
  const [note, setNote] = useState(0);
  const [hover, setHover] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isOwnAnnonce = Boolean(userId && annonceUserId && userId === annonceUserId);

  const loadUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id ?? null;
    setUserId(uid);
    if (!uid) {
      setEvaluateurNom("");
      return;
    }
    const { data: row } = await supabase
      .from("annonces")
      .select("membre_nom")
      .eq("user_id", uid)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (row?.membre_nom) setEvaluateurNom(String(row.membre_nom));
  }, []);

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  useEffect(() => {
    const sub = supabase.auth.onAuthStateChange(() => {
      void loadUser();
    });
    return () => sub.data.subscription.unsubscribe();
  }, [loadUser]);

  const resetForm = () => {
    setNote(0);
    setHover(0);
    setCommentaire("");
    setErr(null);
    setDone(false);
  };

  const openModal = () => {
    if (!userId) {
      window.location.href = "/connexion";
      return;
    }
    if (isOwnAnnonce) return;
    resetForm();
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  const envoyer = async () => {
    if (!userId) {
      window.location.href = "/connexion";
      return;
    }
    if (isOwnAnnonce) {
      setErr("Vous ne pouvez pas évaluer votre propre annonce.");
      return;
    }
    if (!note || note < 1 || note > 5) {
      setErr("Choisissez une note entre 1 et 5 étoiles.");
      return;
    }
    if (!evaluateurNom.trim()) {
      setErr("Indiquez votre prénom ou pseudo pour votre évaluation.");
      return;
    }
    if (!annonceUserId) {
      setErr("Impossible d'évaluer cette annonce");
      return;
    }

    setLoading(true);
    setErr(null);

    let dejaEvalue = false;
    if (userId) {
      const { data: dupByUser, error: dupErr } = await supabase
        .from("evaluations")
        .select("id")
        .eq("annonce_id", annonceId)
        .eq("evaluateur_id", userId)
        .maybeSingle();
      if (!dupErr && dupByUser?.id) dejaEvalue = true;
    }
    if (!dejaEvalue) {
      const { data: dupByName } = await supabase
        .from("evaluations")
        .select("id")
        .eq("annonce_id", annonceId)
        .eq("evaluateur_nom", evaluateurNom.trim())
        .maybeSingle();
      if (dupByName?.id) dejaEvalue = true;
    }
    if (dejaEvalue) {
      setErr("Vous avez déjà évalué cette annonce.");
      setLoading(false);
      return;
    }

    const payload = {
      evaluateur_id: userId,
      evaluateur_nom: evaluateurNom.trim(),
      membre_evalue_id: annonceUserId,
      evalue_nom: membreNom,
      annonce_id: annonceId,
      note,
      commentaire: commentaire.trim() || null,
    };

    const { error } = await supabase.from("evaluations").insert(payload);

    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        setErr("Vous avez déjà évalué cette annonce.");
      } else {
        setErr(error.message);
      }
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  const displayNote = hover || note;

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={isOwnAnnonce}
        title={
          isOwnAnnonce
            ? "Vous ne pouvez pas évaluer votre propre annonce"
            : "Évaluer ce membre après un échange"
        }
        style={{
          padding: "14px 16px",
          background: isOwnAnnonce ? "#f5f5f5" : "white",
          border: "1px solid #ddd",
          borderRadius: "8px",
          fontSize: "13px",
          cursor: isOwnAnnonce ? "not-allowed" : "pointer",
          color: isOwnAnnonce ? "#999" : "#444",
          opacity: isOwnAnnonce ? 0.75 : 1,
        }}
      >
        ⭐ Évaluer
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="eval-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              maxWidth: "440px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
              border: `1px solid ${MINT}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <h2 id="eval-modal-title" style={{ margin: 0, fontSize: "18px", fontWeight: 600, color: GREEN_DARK }}>
                Évaluer cet échange
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fermer"
                style={{
                  border: "none",
                  background: "#f5f5f5",
                  borderRadius: "8px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  fontSize: "18px",
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "18px" }}>
              {done ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    color: GREEN_DARK,
                    fontWeight: 500,
                    textAlign: "center",
                    padding: "12px 0",
                  }}
                >
                  Merci pour votre évaluation !
                </p>
              ) : (
                <>
                  <p style={{ fontSize: "14px", color: "#666", marginTop: 0, marginBottom: "14px" }}>
                    <strong style={{ color: "#333" }}>{titre}</strong>
                  </p>

                  <div
                    style={{
                      background: MINT,
                      border: `1px solid ${GREEN}`,
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "18px",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: "#666" }}>Vous évaluez</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: GREEN_DARK }}>{membreNom}</div>
                  </div>

                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#444" }}>
                    Votre nom affiché *
                  </label>
                  <input
                    value={evaluateurNom}
                    onChange={(e) => setEvaluateurNom(e.target.value)}
                    placeholder="Prénom ou pseudo"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      marginBottom: "18px",
                    }}
                  />

                  <div style={{ marginBottom: "8px", fontSize: "13px", fontWeight: 600, color: "#444" }}>Note *</div>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      justifyContent: "center",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNote(i)}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(0)}
                        aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                        style={{
                          fontSize: "clamp(32px, 8vw, 40px)",
                          lineHeight: 1,
                          cursor: "pointer",
                          background: "none",
                          border: "none",
                          padding: "4px",
                          color: i <= displayNote ? STAR_GOLD : "#ddd",
                          transition: "color 0.12s, transform 0.12s",
                          transform: i <= displayNote ? "scale(1.08)" : "none",
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {note > 0 && (
                    <div style={{ textAlign: "center", fontSize: "13px", color: "#666", marginBottom: "16px" }}>
                      {["", "Très insatisfaisant", "Insatisfaisant", "Correct", "Bien", "Excellent"][note]}
                    </div>
                  )}

                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px", color: "#444" }}>
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    value={commentaire}
                    onChange={(e) => setCommentaire(e.target.value)}
                    placeholder="Décrivez brièvement votre expérience…"
                    rows={4}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "14px",
                      boxSizing: "border-box",
                      resize: "vertical",
                      marginBottom: "14px",
                    }}
                  />

                  {err && (
                    <div
                      style={{
                        fontSize: "13px",
                        color: ORANGE,
                        marginBottom: "12px",
                        padding: "8px 10px",
                        background: "#fff3ee",
                        borderRadius: "8px",
                      }}
                    >
                      {err}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void envoyer()}
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "13px",
                      background: loading ? "#ccc" : GREEN,
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Envoi…" : "Envoyer l'évaluation"}
                  </button>
                </>
              )}
            </div>

            {done && (
              <div style={{ padding: "0 18px 18px" }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: GREEN_DARK,
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
