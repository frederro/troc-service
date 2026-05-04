"use client";

import { useEffect } from "react";
import { supabase } from "@/app/supabase";

export default function AnnonceViewTracker({
  annonceId,
  annonceUserId,
}: {
  annonceId: number;
  annonceUserId: string | null;
}) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const viewerId = data?.user?.id ? String(data.user.id) : null;

        if (viewerId && annonceUserId && viewerId === annonceUserId) return;
        if (cancelled) return;

        await fetch("/api/vues", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ annonce_id: annonceId }),
        });
      } catch {
        // tracking silencieux
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [annonceId, annonceUserId]);

  return null;
}

