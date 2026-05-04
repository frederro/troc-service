import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import crypto from "crypto";

export const runtime = "nodejs";

type PostBody = {
  annonce_id?: string;
};

type VueAnnonceRow = {
  user_id: string | null;
  ip_hash: string | null;
};

function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return null;
}

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 8);
}

async function countUniqueVisitorsForAnnonce(params: {
  supabase: ReturnType<typeof createRouteHandlerClient>;
  annonce_id: string;
}): Promise<number> {
  const uniques = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  // PostgREST pagine souvent les résultats (≈1000 lignes). On boucle pour être exact.
  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await params.supabase
      .from("vues_annonces")
      .select("user_id, ip_hash")
      .eq("annonce_id", params.annonce_id)
      .range(from, to);

    if (error) throw error;

    const rows = (data ?? []) as VueAnnonceRow[];
    for (const row of rows) {
      if (row.user_id) uniques.add(`u:${row.user_id}`);
      else if (row.ip_hash) uniques.add(`ip:${row.ip_hash}`);
    }

    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return uniques.size;
}

export async function POST(req: NextRequest) {
  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const annonce_id = body.annonce_id?.trim();
  if (!annonce_id) {
    return NextResponse.json({ error: "annonce_id requis" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  const user_id = session?.user?.id ?? null;

  const ip = user_id ? null : getClientIp(req) ?? "unknown";
  const ip_hash = user_id ? null : hashIp(ip);

  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  let existsQuery = supabase
    .from("vues_annonces")
    .select("id")
    .eq("annonce_id", annonce_id)
    .gte("created_at", sinceIso)
    .limit(1);

  // Doublon = même user_id OU (si non connecté) même ip_hash dans les dernières 24h
  if (user_id) existsQuery = existsQuery.eq("user_id", user_id);
  else existsQuery = existsQuery.eq("ip_hash", ip_hash);

  const { data: existing, error: existsError } = await existsQuery;
  if (existsError) {
    return NextResponse.json(
      { error: existsError.message, details: existsError },
      { status: 500 },
    );
  }

  const already_counted = (existing?.length ?? 0) > 0;

  if (!already_counted) {
    const { error: insertError } = await supabase.from("vues_annonces").insert({
      annonce_id,
      user_id,
      ip_hash,
    });

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message, details: insertError },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ success: true, already_counted });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const annonce_id = (searchParams.get("annonce_id") ?? "").trim();

  if (!annonce_id) {
    return NextResponse.json({ error: "annonce_id requis" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  const { count: total_vues, error: totalError } = await supabase
    .from("vues_annonces")
    .select("id", { count: "exact", head: true })
    .eq("annonce_id", annonce_id);

  if (totalError) {
    return NextResponse.json(
      { error: totalError.message, details: totalError },
      { status: 500 },
    );
  }

  try {
    const visiteurs_uniques = await countUniqueVisitorsForAnnonce({
      supabase,
      annonce_id,
    });

    return NextResponse.json({
      total_vues: total_vues ?? 0,
      visiteurs_uniques,
    });
  } catch (e) {
    const err = e as { message?: string };
    return NextResponse.json(
      { error: err?.message ?? "Erreur inconnue" },
      { status: 500 },
    );
  }
}
