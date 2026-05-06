"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";
import BadgeNiveau from "@/components/BadgeNiveau";
import TaillesSelector from "@/components/TaillesSelector";

const PAYS_OPTIONS = [
  "France",
  "Belgique",
  "Suisse",
  "Luxembourg",
  "Canada",
  "Espagne",
  "Italie",
  "Allemagne",
  "Royaume-Uni",
  "Portugal",
  "Maroc",
  "Tunisie",
  "Algérie",
  "Sénégal",
  "Côte d'Ivoire",
  "Autre",
] as const;

type Annonce = {
  id: number;
  titre?: string | null;
  categorie?: string | null;
  echange_souhaite?: string | null;
  localisation?: string | null;
  photos?: string[] | null;
  created_at?: string | null;
};

type VueStats = {
  total_vues: number;
  visiteurs_uniques: number;
};

type AnnonceStats = {
  annonce_id: number;
  total_vues: number;
  visiteurs_uniques: number;
};

type Tailles = {
  taille_haut: string;
  taille_bas_fr: string;
  taille_bas_us: string;
  pointure_eu: string;
  pointure_us: string;
};

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [pays, setPays] = useState("France");
  const [savingLocation, setSavingLocation] = useState(false);
  const [points, setPoints] = useState(0);
  const [tailles, setTailles] = useState<Tailles>({
    taille_haut: "",
    taille_bas_fr: "",
    taille_bas_us: "",
    pointure_eu: "",
    pointure_us: "",
  });

  const [statsAnnonces, setStatsAnnonces] = useState<Record<number, AnnonceStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        window.location.href = "/connexion";
        return;
      }
      setUser(data.user);

      const { data: pointsRow } = await supabase.from("membres").select("points").eq("id", data.user.id).single();
      const points = (pointsRow as any)?.points ?? 0;
      setPoints(points);

      const { data: taillesRow } = await supabase
        .from("membres")
        .select("taille_haut, taille_bas_fr, taille_bas_us, pointure_eu, pointure_us")
        .eq("id", data.user.id)
        .single();
      if (taillesRow) setTailles(taillesRow as unknown as Tailles);

      const md = data.user.user_metadata || {};
      setVille(typeof md.ville === "string" ? md.ville : "");
      setCodePostal(typeof md.code_postal === "string" ? md.code_postal : "");
      setPays(typeof md.pays === "string" && md.pays ? md.pays : "France");

      const { data: mes_annonces } = await supabase
        .from("annonces")
        .select("*")
        .eq("user_id", data.user.id)
        .order("created_at", { ascending: false });

      if (mes_annonces) setAnnonces(mes_annonces);
      setLoading(false);
    });
  }, []);

  const handleTailleChange = async (champ: keyof Tailles, valeur: string) => {
    if (!user?.id) return;
    setTailles((prev) => ({ ...prev, [champ]: valeur }));
    await supabase.from("membres").update({ [champ]: valeur }).eq("id", user.id);
  };

  async function fetchStatsAnnonces(params: { annonces: Annonce[]; signal?: AbortSignal }): Promise<Record<number, AnnonceStats>> {
    const entries = await Promise.all(
      params.annonces.map(async (a) => {
        const res = await fetch(`/api/vues?annonce_id=${encodeURIComponent(String(a.id))}`, {
          method: "GET",
          signal: params.signal,
          headers: { "accept": "application/json" },
        });

        if (!res.ok) {
          let msg = "Erreur lors du chargement des statistiques";
          try {
            const j = (await res.json()) as { error?: string };
            if (typeof j?.error === "string" && j.error.trim()) msg = j.error.trim();
          } catch {
            // ignore JSON parse errors
          }
          throw new Error(msg);
        }

        const json = (await res.json()) as Partial<VueStats>;
        const total_vues = typeof json.total_vues === "number" ? json.total_vues : 0;
        const visiteurs_uniques = typeof json.visiteurs_uniques === "number" ? json.visiteurs_uniques : 0;

        const stats: AnnonceStats = { annonce_id: a.id, total_vues, visiteurs_uniques };
        return [a.id, stats] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  useEffect(() => {
    if (loading) return;
    if (annonces.length === 0) {
      setStatsAnnonces({});
      setStatsError("");
      setLoadingStats(false);
      return;
    }

    const controller = new AbortController();
    setLoadingStats(true);
    setStatsError("");

    fetchStatsAnnonces({ annonces, signal: controller.signal })
      .then((map) => {
        if (controller.signal.aborted) return;
        setStatsAnnonces(map);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement des statistiques";
        setStatsError(msg);
        setStatsAnnonces({});
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoadingStats(false);
      });

    return () => controller.abort();
  }, [loading, annonces]);

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSupprimerAnnonce = async (id: number) => {
    if (!confirm("Supprimer cette annonce ?")) return;
    await supabase.from("annonces").delete().eq("id", id);
    setAnnonces((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSaveLocation = async () => {
    if (!user) return;
    setSavingLocation(true);
    setSuccessMsg("");
    const md = user.user_metadata || {};
    const { error } = await supabase.auth.updateUser({
      data: {
        ...md,
        ville: ville.trim(),
        code_postal: codePostal.trim(),
        pays: pays || "France",
      },
    });
    setSavingLocation(false);
    if (error) {
      alert("Impossible d'enregistrer : " + error.message);
      return;
    }
    const { data: fresh } = await supabase.auth.getUser();
    if (fresh?.user) setUser(fresh.user);
    setSuccessMsg("Localisation enregistrée.");
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  if (loading) return <p style={{ padding: "40px", fontFamily: "sans-serif" }}>Chargement...</p>;

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
          borderBottom: "1px solid #eee",
          marginBottom: "30px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#1D9E75" }} />
          <a href="/" style={{ fontWeight: "500", fontSize: "18px", textDecoration: "none", color: "black" }}>
            Troc-Service
          </a>
        </div>
        <a href="/" style={{ fontSize: "13px", color: "#666", textDecoration: "none" }}>
          ← Retour aux annonces
        </a>
      </nav>

      <div
        style={{
          background: "#f9f9f9",
          border: "1px solid #eee",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>👤 Mon Profil</h2>
        <div style={{ marginTop: "-6px", marginBottom: "14px" }}>
          <BadgeNiveau points={points} size="lg" />
        </div>

        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "13px", color: "#999" }}>Email</span>
          <div style={{ fontSize: "15px", fontWeight: "500", marginTop: "2px" }}>{user?.email}</div>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <span style={{ fontSize: "13px", color: "#999" }}>Membre depuis</span>
          <div style={{ fontSize: "15px", fontWeight: "500", marginTop: "2px" }}>
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })
              : "—"}
          </div>
        </div>

        {successMsg && (
          <div
            style={{
              background: "#E1F5EE",
              color: "#0F6E56",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              marginBottom: "12px",
            }}
          >
            {successMsg}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a
            href="/creer-annonce"
            style={{
              padding: "10px 18px",
              background: "#1D9E75",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            + Déposer une annonce
          </a>
          <a
            href="/favoris"
            style={{
              padding: "10px 18px",
              background: "white",
              border: "1px solid #ddd",
              color: "#444",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "14px",
            }}
          >
            ❤️ Mes favoris
          </a>
          <button
            onClick={handleDeconnexion}
            style={{
              padding: "10px 18px",
              background: "white",
              border: "1px solid #ddd",
              color: "#E8622A",
              borderRadius: "8px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "30px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px", color: "#1D9E75" }}>📍 Ma localisation</h2>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px", lineHeight: 1.5 }}>
          Ces informations sont utilisées pour géocoder vos annonces. Elles sont stockées dans votre compte.
        </p>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "#444" }}>Pays</label>
          <select
            value={pays}
            onChange={(e) => setPays(e.target.value)}
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "14px",
              background: "white",
              boxSizing: "border-box",
            }}
          >
            {PAYS_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "#444" }}>Code postal</label>
          <input
            value={codePostal}
            onChange={(e) => setCodePostal(e.target.value)}
            placeholder="Ex. : 75001"
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: "500", marginBottom: "6px", color: "#444" }}>Ville</label>
          <input
            value={ville}
            onChange={(e) => setVille(e.target.value)}
            placeholder="Ex. : Paris"
            style={{
              width: "100%",
              maxWidth: "400px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSaveLocation}
          disabled={savingLocation}
          style={{
            padding: "11px 22px",
            background: savingLocation ? "#ccc" : "#1D9E75",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: savingLocation ? "not-allowed" : "pointer",
          }}
        >
          {savingLocation ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "10px", color: "#1D9E75" }}>
          📊 Statistiques de mes annonces
        </h2>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px", lineHeight: 1.5 }}>
          Vues totales et visiteurs uniques (uniques = compte ou IP), toutes périodes.
        </p>

        {annonces.length === 0 ? (
          <div
            style={{
              background: "#E1F5EE",
              border: "1px solid rgba(15,110,86,0.15)",
              color: "#0F6E56",
              padding: "14px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            Vous n'avez pas encore d'annonces
          </div>
        ) : loadingStats ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {Array.from({ length: Math.min(5, Math.max(2, annonces.length)) }).map((_, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid #E1F5EE",
                  borderRadius: "12px",
                  padding: "14px 14px",
                  background: "linear-gradient(90deg, #E1F5EE 0%, #f7fffb 50%, #E1F5EE 100%)",
                  backgroundSize: "200% 100%",
                  animation: "skeleton 1.2s ease-in-out infinite",
                }}
              >
                <div style={{ height: "14px", width: "55%", borderRadius: "6px", background: "rgba(15,110,86,0.14)", marginBottom: "10px" }} />
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <div style={{ height: "12px", width: "120px", borderRadius: "6px", background: "rgba(15,110,86,0.12)" }} />
                  <div style={{ height: "12px", width: "150px", borderRadius: "6px", background: "rgba(15,110,86,0.12)" }} />
                  <div style={{ height: "12px", width: "160px", borderRadius: "6px", background: "rgba(15,110,86,0.12)" }} />
                </div>
              </div>
            ))}
            <style>{`
              @keyframes skeleton {
                0% { background-position: 0% 0; }
                100% { background-position: 200% 0; }
              }
            `}</style>
          </div>
        ) : statsError ? (
          <div
            style={{
              background: "#fff5f2",
              border: "1px solid rgba(232,98,42,0.25)",
              color: "#E8622A",
              padding: "12px 14px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {statsError}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {annonces.map((a) => {
              const stats = statsAnnonces[a.id];
              const created = a.created_at
                ? new Date(a.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" })
                : "—";
              return (
                <div
                  key={a.id}
                  style={{
                    border: "1px solid #E1F5EE",
                    borderRadius: "12px",
                    padding: "14px 14px",
                    background: "#fbfffd",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px", color: "#0F6E56" }}>
                    {a.titre || "Annonce"}
                  </div>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", fontSize: "13px", color: "#333" }}>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#E1F5EE",
                        color: "#0F6E56",
                        fontWeight: 700,
                      }}
                    >
                      👁 {stats?.total_vues ?? 0} vues totales
                    </span>
                    <span
                      style={{
                        padding: "6px 10px",
                        borderRadius: "999px",
                        background: "#f3fbf7",
                        border: "1px solid #E1F5EE",
                        color: "#0F6E56",
                        fontWeight: 700,
                      }}
                    >
                      👤 {stats?.visiteurs_uniques ?? 0} visiteurs uniques
                    </span>
                    <span style={{ padding: "6px 0", color: "#666", fontWeight: 600 }}>Créée le {created}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>📋 Mes annonces ({annonces.length})</h2>

      {annonces.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#999", border: "1px dashed #ddd", borderRadius: "12px" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📭</div>
          <p>Vous n'avez pas encore d'annonces.</p>
          <a href="/creer-annonce" style={{ color: "#1D9E75", textDecoration: "none", fontWeight: "500" }}>
            Déposer ma première annonce
          </a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {annonces.map((annonce) => (
            <div
              key={annonce.id}
              style={{
                display: "flex",
                gap: "16px",
                border: "1px solid #eee",
                borderRadius: "12px",
                overflow: "hidden",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              {annonce?.photos?.[0] ? (
                <img
                  src={annonce.photos[0]}
                  alt={annonce.titre || ""}
                  style={{ width: "100px", height: "100px", objectFit: "cover", flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    background: "#f5f5f5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    flexShrink: 0,
                  }}
                >
                  📷
                </div>
              )}
              <div style={{ flex: 1, padding: "12px 12px 12px 0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: "#E1F5EE",
                        color: "#0F6E56",
                      }}
                    >
                      {annonce.categorie}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "20px",
                        background: "#f5f5f5",
                        color: "#666",
                      }}
                    >
                      {annonce.localisation}
                    </span>
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "15px", marginBottom: "4px" }}>{annonce.titre}</div>
                  {annonce.echange_souhaite && (
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      Échange contre : <span style={{ color: "#1D9E75" }}>{annonce.echange_souhaite}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <a
                    href={`/annonce/${annonce.id}`}
                    style={{
                      fontSize: "12px",
                      padding: "6px 12px",
                      border: "1px solid #ddd",
                      borderRadius: "6px",
                      textDecoration: "none",
                      color: "#444",
                    }}
                  >
                    Voir
                  </a>
                  <button
                    onClick={() => handleSupprimerAnnonce(annonce.id)}
                    style={{
                      fontSize: "12px",
                      padding: "6px 12px",
                      border: "1px solid #ffcccc",
                      borderRadius: "6px",
                      background: "white",
                      color: "#cc0000",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaillesSelector valeurs={tailles} onChange={handleTailleChange} />

      <div style={{ borderTop: "1px solid #eee", padding: "20px 0", marginTop: "40px", fontSize: "11px", color: "#999" }}>
        Troc-Service —{" "}
        <a href="#" style={{ color: "#1D9E75" }}>
          CGU
        </a>{" "}
        ·{" "}
        <a href="#" style={{ color: "#1D9E75" }}>
          Mentions légales
        </a>
      </div>
    </main>
  );
}
