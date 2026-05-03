import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const categorieRaw = searchParams.get("categorie");
  const categorie = categorieRaw?.trim() ? categorieRaw.trim() : null;

  const limitParam = searchParams.get("limit");
  let limit = 50;
  if (limitParam !== null && limitParam !== "") {
    const n = Number.parseInt(limitParam, 10);
    if (!Number.isFinite(n)) {
      return NextResponse.json({ error: "limit invalide" }, { status: 400 });
    }
    limit = Math.min(50, Math.max(1, n));
  }

  if (q.length < 2) {
    return NextResponse.json(
      { error: "Le terme de recherche doit contenir au moins 2 caractères." },
      { status: 400 }
    );
  }

  let query = supabase
    .from("annonces")
    .select("*")
    .textSearch("search_vector", q, { type: "websearch", config: "french" })
    .limit(limit);

  if (categorie && categorie !== "Tout") {
    query = query.eq("categorie", categorie);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }

  return NextResponse.json({ annonces: data ?? [] });
}
