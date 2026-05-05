import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AnnonceDetail from "./AnnonceDetail";

const ANNONCE_SELECT =
  "id, titre, description, categorie, portee, localisation, echange_souhaite, ouvert_propositions, membre_nom, photos, user_id";

function createServerSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      [
        "Supabase env vars missing.",
        `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl ? "set" : "missing"}`,
        `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey ? "set" : "missing"}`,
      ].join(" ")
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function generateMetadata({ params }) {
  const id = params?.id;
  const numericId = Number.parseInt(String(id), 10);

  const fallback = {
    title: "Annonce — Troc-Service",
    description: "Consultez cette annonce sur Troc-Service.",
  };

  if (!Number.isFinite(numericId)) {
    return fallback;
  }

  const supabase = createServerSupabase();
  const { data: annonce } = await supabase
    .from("annonces")
    .select("titre, description, membre_nom, localisation, photos, echange_souhaite")
    .eq("id", numericId)
    .single();

  if (!annonce) return fallback;

  const titre = annonce.titre ?? "Annonce";
  const membreNom = annonce.membre_nom ?? "Un membre";
  const localisation = annonce.localisation ?? "France";
  const echangeSouhaite = annonce.echange_souhaite ?? "Non précisé";

  return {
    title: annonce.titre,
    description: `${membreNom} propose "${titre}" à ${localisation}. Cherche : ${echangeSouhaite}.`,
    openGraph: {
      title: annonce.titre,
      description: `${membreNom} propose "${titre}" à ${localisation}.`,
      images: annonce.photos?.[0] ? [{ url: annonce.photos[0] }] : [],
      url: `https://www.troc-service.eu/annonce/${numericId}`,
    },
  };
}

export default async function Page({ params }) {
  const numericId = Number.parseInt(String(params?.id), 10);
  if (!Number.isFinite(numericId)) return notFound();

  const supabase = createServerSupabase();
  const { data: annonce, error: fetchError } = await supabase
    .from("annonces")
    .select(ANNONCE_SELECT)
    .eq("id", numericId)
    .single();

  if (fetchError || !annonce) return notFound();

  const { data: membreData } = annonce.user_id
    ? await supabase.from("membres").select("points").eq("id", annonce.user_id).single()
    : { data: null };

  const pointsMembre = membreData?.points ?? 0;
  const ownerId = annonce.user_id != null ? String(annonce.user_id) : null;

  return (
    <AnnonceDetail
      id={String(numericId)}
      initialAnnonce={annonce}
      initialPointsMembre={pointsMembre}
      initialOwnerId={ownerId}
    />
  );
}
