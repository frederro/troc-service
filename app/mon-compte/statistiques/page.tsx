"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/app/supabase";

type Annonce = {
  id: number;
  titre?: string | null;
  created_at?: string | null;
};

type VueStats = {
  total_vues: number;
  visiteurs_uniques: number;
};

type Row = {
  annonce: Annonce;
  total_vues: number;
  visiteurs_uniques: number;
};

const COLORS = {
  green: "#1D9E75",
  greenLight: "#E1F5EE",
  orange: "#E8622A",
} as const;

function formatDateFr(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "720px" }}>
        <thead>
          <tr>
            {["Annonce", "👁 Vues", "👤 Uniques", "Créée le"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  fontSize: "12px",
                  color: "#0F6E56",
                  background: COLORS.greenLight,
                  padding: "12px 12px",
                  borderTop: "1px solid rgba(15,110,86,0.12)",
                  borderBottom: "1px solid rgba(15,110,86,0.12)",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i}>
              <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ height: 14, width: "60%", borderRadius: 8, background: "rgba(15,110,86,0.12)" }} />
              </td>
              <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ height: 14, width: 84, borderRadius: 8, background: "rgba(15,110,86,0.12)" }} />
              </td>
              <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ height: 14, width: 110, borderRadius: 8, background: "rgba(15,110,86,0.12)" }} />
              </td>
              <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ height: 14, width: 120, borderRadius: 8, background: "rgba(15,110,86,0.12)" }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <style>{`
        table td > div, table th { animation: sk 1.2s ease-in-out infinite; }
        @keyframes sk { 0% { opacity: 0.55; } 50% { opacity: 0.95; } 100% { opacity: 0.55; } }
      `}</style>
    </div>
  );
}

export default function StatistiquesPage() {
  const [userId, setUserId] = useState<string | null>(null);

  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string>("");

  const [statsById, setStatsById] = useState<Record<number, VueStats>>({});

  useEffect(() => {
    let cancelled = false;
    setLoadingAnnonces(true);
    setError("");

    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        const uid = data?.user?.id ?? null;
        if (!uid) {
          window.location.assign("/connexion");
          return;
        }
        if (cancelled) return;
        setUserId(uid);

        const { data: rows, error: annoncesError } = await supabase
          .from("annonces")
          .select("id,titre,created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (annoncesError) {
          setError(annoncesError.message);
          setAnnonces([]);
          return;
        }
        setAnnonces((rows ?? []) as Annonce[]);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement";
        setError(msg);
        setAnnonces([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAnnonces(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loadingAnnonces) return;
    if (annonces.length === 0) {
      setStatsById({});
      setLoadingStats(false);
      return;
    }

    const controller = new AbortController();
    setLoadingStats(true);

    Promise.all(
      annonces.map(async (a) => {
        const res = await fetch(`/api/vues?annonce_id=${encodeURIComponent(String(a.id))}`, {
          method: "GET",
          signal: controller.signal,
          headers: { accept: "application/json" },
        });

        if (!res.ok) {
          let msg = "Erreur lors du chargement des statistiques";
          try {
            const j = (await res.json()) as { error?: string };
            if (typeof j?.error === "string" && j.error.trim()) msg = j.error.trim();
          } catch {
            // ignore
          }
          throw new Error(msg);
        }

        const json = (await res.json()) as Partial<VueStats>;
        const total_vues = typeof json.total_vues === "number" ? json.total_vues : 0;
        const visiteurs_uniques = typeof json.visiteurs_uniques === "number" ? json.visiteurs_uniques : 0;
        return [a.id, { total_vues, visiteurs_uniques }] as const;
      }),
    )
      .then((entries) => {
        if (controller.signal.aborted) return;
        setStatsById(Object.fromEntries(entries));
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        const msg = e instanceof Error ? e.message : "Erreur lors du chargement des statistiques";
        setError(msg);
        setStatsById({});
      })
      .finally(() => {
        if (controller.signal.aborted) return;
        setLoadingStats(false);
      });

    return () => controller.abort();
  }, [loadingAnnonces, annonces]);

  const rows: Row[] = useMemo(() => {
    return annonces.map((a) => {
      const s = statsById[a.id];
      return {
        annonce: a,
        total_vues: s?.total_vues ?? 0,
        visiteurs_uniques: s?.visiteurs_uniques ?? 0,
      };
    });
  }, [annonces, statsById]);

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: "1100px", margin: "0 auto", padding: "22px 20px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 800, color: "#0F6E56" }}>📊 Mes statistiques</h1>
          <p style={{ margin: "6px 0 0", color: "#666", fontSize: "13px", lineHeight: 1.5 }}>
            Vues totales et visiteurs uniques (compte ou IP), toutes périodes.
          </p>
        </div>
        <a
          href="/profil"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ddd",
            background: "white",
            textDecoration: "none",
            color: "#333",
            fontWeight: 700,
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          ← Retour à mon compte
        </a>
      </div>

      {!!error && (
        <div
          style={{
            marginTop: 14,
            background: "#fff3ee",
            border: "1px solid rgba(232,98,42,0.25)",
            color: COLORS.orange,
            padding: "12px 14px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          background: "white",
          border: "1px solid #eee",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        }}
      >
        {(loadingAnnonces || loadingStats) && <SkeletonTable rows={6} />}

        {!loadingAnnonces && !loadingStats && annonces.length === 0 && (
          <div style={{ padding: "18px 16px", background: COLORS.greenLight, color: "#0F6E56", fontWeight: 800 }}>
            Aucune annonce pour le moment
          </div>
        )}

        {!loadingAnnonces && !loadingStats && annonces.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: "720px" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: "12px",
                      color: "#0F6E56",
                      background: COLORS.greenLight,
                      padding: "12px 12px",
                      borderTop: "1px solid rgba(15,110,86,0.12)",
                      borderBottom: "1px solid rgba(15,110,86,0.12)",
                    }}
                  >
                    Annonce
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: "12px",
                      color: "#0F6E56",
                      background: COLORS.greenLight,
                      padding: "12px 12px",
                      borderTop: "1px solid rgba(15,110,86,0.12)",
                      borderBottom: "1px solid rgba(15,110,86,0.12)",
                      width: 130,
                      whiteSpace: "nowrap",
                    }}
                  >
                    👁 total_vues
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: "12px",
                      color: "#0F6E56",
                      background: COLORS.greenLight,
                      padding: "12px 12px",
                      borderTop: "1px solid rgba(15,110,86,0.12)",
                      borderBottom: "1px solid rgba(15,110,86,0.12)",
                      width: 160,
                      whiteSpace: "nowrap",
                    }}
                  >
                    👤 visiteurs_uniques
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      fontSize: "12px",
                      color: "#0F6E56",
                      background: COLORS.greenLight,
                      padding: "12px 12px",
                      borderTop: "1px solid rgba(15,110,86,0.12)",
                      borderBottom: "1px solid rgba(15,110,86,0.12)",
                      width: 170,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Date de création
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.annonce.id} style={{ background: "white" }}>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0" }}>
                      <a
                        href={`/annonce/${r.annonce.id}`}
                        style={{
                          color: COLORS.green,
                          fontWeight: 800,
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                      >
                        {r.annonce.titre || "Annonce"}
                      </a>
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0", fontWeight: 800, color: "#111" }}>
                      {r.total_vues}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0", fontWeight: 800, color: "#111" }}>
                      {r.visiteurs_uniques}
                    </td>
                    <td style={{ padding: "12px", borderBottom: "1px solid #f0f0f0", color: "#666", fontWeight: 700 }}>
                      {formatDateFr(r.annonce.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!!userId && (
        <div style={{ marginTop: 14, fontSize: 12, color: "#888" }}>
          Astuce : vous pouvez partager le lien d’une annonce pour augmenter sa visibilité.
        </div>
      )}
    </main>
  );
}

