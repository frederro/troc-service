"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";

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

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [ville, setVille] = useState("");
  const [codePostal, setCodePostal] = useState("");
  const [pays, setPays] = useState("France");
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        window.location.href = "/connexion";
        return;
      }
      setUser(data.user);
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
        <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>👤 Mon compte</h2>

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
