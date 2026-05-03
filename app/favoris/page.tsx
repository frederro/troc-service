"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";

type Annonce = {
  id: number;
  titre?: string | null;
  categorie?: string | null;
  echange_souhaite?: string | null;
  membre_nom?: string | null;
  localisation?: string | null;
  photos?: string[] | null;
};

export default function FavorisPage() {
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user) {
        window.location.href = "/connexion";
        return;
      }
      const { data: favs } = await supabase
        .from("favoris")
        .select("annonce_id, annonces(*)")
        .eq("user_id", data.user.id);

      if (favs) {
        setAnnonces(favs.map((f: any) => f.annonces).filter(Boolean));
      }
      setLoading(false);
    });
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: "1100px", margin: "0 auto", padding: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <a href="/" style={{ color: "#1D9E75", textDecoration: "none", fontSize: "14px" }}>← Retour</a>
        <h1 style={{ fontSize: "22px", fontWeight: "600", margin: 0 }}>❤️ Mes favoris</h1>
      </div>

      {loading ? (
        <p style={{ color: "#999" }}>Chargement...</p>
      ) : annonces.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#999" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🤍</div>
          <p>Vous n'avez pas encore de favoris.</p>
          <a href="/" style={{ color: "#1D9E75" }}>Parcourir les annonces</a>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {annonces.map((annonce) => (
            <a key={annonce.id} href={`/annonce/${annonce.id}`} style={{ border: "1px solid #eee", borderRadius: "12px", overflow: "hidden", textDecoration: "none", color: "inherit", display: "block", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              {annonce?.photos?.[0] ? (
                <img src={annonce.photos[0]} alt={annonce.titre || ""} style={{ height: "160px", width: "100%", objectFit: "contain", background: "#fff" }} />
              ) : (
                <div style={{ height: "120px", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>Photo</div>
              )}
              <div style={{ padding: "12px" }}>
                <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "#E1F5EE", color: "#0F6E56" }}>{annonce.categorie}</span>
                <div style={{ fontWeight: "500", fontSize: "13px", margin: "6px 0 4px" }}>{annonce.titre}</div>
                {annonce.echange_souhaite && (
                  <div style={{ fontSize: "12px", color: "#666" }}>Échange contre : <span style={{ color: "#1D9E75" }}>{annonce.echange_souhaite}</span></div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                  <span style={{ fontSize: "11px", color: "#999" }}>{annonce.membre_nom}</span>
                  <span style={{ fontSize: "10px", padding: "2px 8px", background: "#E1F5EE", color: "#0F6E56", borderRadius: "20px" }}>{annonce.localisation}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}