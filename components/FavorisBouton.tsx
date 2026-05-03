"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/supabase";

export default function FavorisBouton({ annonceId }: { annonceId: number }) {
  const [isFav, setIsFav] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) return;
      setUserId(data.user.id);
      supabase
        .from("favoris")
        .select("id")
        .eq("user_id", data.user.id)
        .eq("annonce_id", annonceId)
        .single()
        .then(({ data: fav }) => setIsFav(!!fav));
    });
  }, [annonceId]);

  const handleToggle = async () => {
    if (!userId) {
      window.location.href = "/connexion";
      return;
    }
    if (isFav) {
      await supabase.from("favoris").delete().eq("user_id", userId).eq("annonce_id", annonceId);
      setIsFav(false);
    } else {
      await supabase.from("favoris").insert({ user_id: userId, annonce_id: annonceId });
      setIsFav(true);
    }
  };

  return (
    <button
      onClick={handleToggle}
      style={{
        padding: '14px 18px',
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        fontSize: '18px',
        cursor: 'pointer',
        transition: 'transform 0.1s ease',
      }}
      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isFav ? "❤️" : "🤍"}
    </button>
  );
}