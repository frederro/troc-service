import { supabase } from "@/app/supabase";
import { notFound } from "next/navigation";
import AnnoncePhotos from "@/components/AnnoncePhotos";
import FavorisBouton from "@/components/FavorisBouton";
import AnnonceViewTracker from "@/components/AnnonceViewTracker";
import BadgeNiveau from "@/components/BadgeNiveau";

const ANNONCE_SELECT =
  "id, titre, description, categorie, portee, localisation, echange_souhaite, ouvert_propositions, membre_nom, photos, user_id";

export default async function FicheAnnonce({ params }) {
  const { id } = await params;
  const numericId = Number.parseInt(String(id), 10);
  if (!Number.isFinite(numericId)) {
    return notFound();
  }

  const { data: annonce, error: fetchError } = await supabase
    .from("annonces")
    .select(ANNONCE_SELECT)
    .eq("id", numericId)
    .maybeSingle();

  if (fetchError || !annonce) {
    return notFound();
  }

  const { data: membreData } = annonce.user_id
    ? await supabase.from("membres").select("points").eq("id", annonce.user_id).single()
    : { data: null };
  const pointsMembre = membreData?.points ?? 0;

  const ownerId = annonce.user_id != null ? String(annonce.user_id) : null;
  const destinataireIdParam = ownerId ?? "";
  // Note: l’email du destinataire n’est pas disponible côté client avec la clé anon.
  // Si vous ajoutez plus tard l’email via profils ou une route admin, vous pourrez passer `destinataire_email=...` ici.
  const contacterUrl = `/contacter/${annonce.id}?destinataire=${encodeURIComponent(String(annonce.membre_nom ?? ""))}&titre=${encodeURIComponent(String(annonce.titre ?? ""))}&destinataire_id=${destinataireIdParam}`;
  const evaluerUrl = `/evaluer/${annonce.id}?membre=${encodeURIComponent(String(annonce.membre_nom ?? ""))}&titre=${encodeURIComponent(String(annonce.titre ?? ""))}`;

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <AnnonceViewTracker annonceId={Number(annonce.id)} annonceUserId={ownerId} />

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

      <AnnoncePhotos photos={annonce?.photos} altBase={annonce?.titre} />

      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "12px",
              padding: "3px 10px",
              borderRadius: "20px",
              background: "#E1F5EE",
              color: "#0F6E56",
            }}
          >
            {annonce.categorie}
          </span>
          {annonce.portee != null && annonce.portee !== "" && (
            <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#f5f5f5", color: "#666" }}>
              {annonce.portee}
            </span>
          )}
          <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#f5f5f5", color: "#666" }}>
            {annonce.localisation}
          </span>
        </div>
        <h1 style={{ fontSize: "26px", fontWeight: "500", marginBottom: "12px" }}>{annonce.titre}</h1>
        <p style={{ fontSize: "15px", color: "#444", lineHeight: "1.7", marginBottom: "20px" }}>{annonce.description}</p>
      </div>

      <div
        style={{
          background: "#f0faf5",
          border: "1px solid #9FE1CB",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: "500", color: "#666", marginBottom: "6px" }}>Échange contre :</div>
        <div style={{ fontSize: "15px", color: "#1D9E75", marginBottom: "8px" }}>{annonce.echange_souhaite || "Non précisé"}</div>
        {annonce.ouvert_propositions && (
          <div style={{ fontSize: "13px", color: "#0F6E56", display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1D9E75" }} />
            Ouvert à toute autre proposition
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "16px 0",
          borderTop: "1px solid #eee",
          borderBottom: "1px solid #eee",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#E1F5EE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            fontWeight: "500",
            color: "#0F6E56",
          }}
        >
          {annonce.membre_nom?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {ownerId ? (
              <a
                href={`/membre/${ownerId}`}
                style={{ fontWeight: "500", fontSize: "15px", color: "#0F6E56", textDecoration: "underline" }}
              >
                {annonce.membre_nom}
              </a>
            ) : (
              <span style={{ fontWeight: "500", fontSize: "15px", color: "#666" }}>{annonce.membre_nom}</span>
            )}
            <BadgeNiveau points={pointsMembre} size="sm" />
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>{annonce.localisation}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "stretch" }}>
        <a
          href={contacterUrl}
          style={{
            flex: "1 1 200px",
            padding: "14px",
            background: "#1D9E75",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
            textDecoration: "none",
            textAlign: "center",
            display: "block",
          }}
        >
          Contacter & proposer un échange
        </a>
        {ownerId ? (
          <a
            href={evaluerUrl}
            style={{
              flex: "1 1 200px",
              padding: "14px",
              background: "white",
              color: "#0F6E56",
              border: "1px solid #9FE1CB",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "500",
              cursor: "pointer",
              textDecoration: "none",
              textAlign: "center",
              display: "block",
            }}
          >
            ⭐ Évaluer cet échange
          </a>
        ) : (
          <div
            role="status"
            style={{
              padding: "14px 16px",
              background: "#fff3ee",
              border: "1px solid #f0c4b2",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#E8622A",
              flex: "1 1 200px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            Impossible d&apos;évaluer cette annonce
          </div>
        )}
        <FavorisBouton annonceId={annonce.id} />
      </div>

      <div style={{ marginTop: "16px", fontSize: "11px", color: "#bbb", lineHeight: "1.6" }}>
        Annonce publiée par un particulier. Troc-Service est un intermédiaire de mise en relation et n&apos;est pas responsable de la qualité des biens ou services échangés.
      </div>
    </main>
  );
}
