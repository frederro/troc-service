import { supabase } from "@/app/supabase";
import MembrePublicClientPage from "./MembrePublicClient";

export async function generateMetadata({ params }: { params: { id: string } }) {
  let prenom = "Membre";
  try {
    const { data } = await supabase
      .from("annonces")
      .select("membre_nom")
      .eq("user_id", params.id)
      .limit(1)
      .single();

    prenom = data?.membre_nom ?? "Membre";
  } catch {
    prenom = "Membre";
  }

  const { data: membreData } = await supabase.from("membres").select("points").eq("id", params.id).maybeSingle();

  const points = (membreData as any)?.points ?? 0;
  const badge = points >= 300 ? "Or" : points >= 100 ? "Argent" : "Bronze";

  return {
    title: `Profil de ${prenom} — Troc-Service`,
    description: `Découvrez les annonces de ${prenom} sur Troc-Service. Badge ${badge}.`,
    openGraph: {
      title: `Profil de ${prenom} — Troc-Service`,
      description: `Découvrez les annonces de ${prenom} sur Troc-Service.`,
      url: `https://www.troc-service.eu/membre/${params.id}`,
      type: "profile",
    },
  };
}

export default async function MembrePublicPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolved = await (params as any);
  const memberId = String(resolved?.id ?? "");
  return <MembrePublicClientPage memberId={memberId} />;
}

