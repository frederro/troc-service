"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/app/supabase";

type Annonce = {
  id: number;
  user_id?: string | null;
  categorie?: string | null;
  sous_categorie?: string | null;
  titre?: string | null;
  echange_souhaite?: string | null;
  categorie_souhaitee?: string | null;
  sous_categorie_souhaitee?: string | null;
  ouvert_propositions?: boolean | null;
  membre_nom?: string | null;
  localisation?: string | null;
  photos?: unknown;
  mode?: "propose" | "cherche" | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

const COLORS = {
  green: "#1D9E75",
  greenDark: "#0F6E56",
  greenLight: "#E1F5EE",
  orange: "#E8622A",
} as const;

const RADIUS_OPTIONS_KM = [2, 5, 10, 25, 50, 100, 200, 500] as const;
/** Index 0–7 = km, 8 = toute la France */
const SLIDER_FRANCE_INDEX = 8;

const SELECT_FIELDS =
  "id,titre,categorie,sous_categorie,echange_souhaite,categorie_souhaitee,sous_categorie_souhaitee,ouvert_propositions,membre_nom,localisation,photos,user_id,mode,latitude,longitude";

function normalizeText(v: string | null | undefined) {
  return (v ?? "").trim();
}

function cityOfLocalisation(localisation: string | null | undefined) {
  const raw = normalizeText(localisation).toLowerCase();
  if (!raw) return "";
  const beforeComma = raw.split(",")[0] ?? raw;
  const beforeParen = beforeComma.split("(")[0] ?? beforeComma;
  return beforeParen.trim();
}

function normalizePhotos(photos: unknown): string[] {
  if (!photos) return [];
  if (Array.isArray(photos)) return photos.filter(Boolean).map(String);
  if (typeof photos === "string") {
    const s = photos.trim();
    if (!s) return [];
    if (s.startsWith("[") && s.endsWith("]")) {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      } catch {
        // ignore
      }
    }
    return [s];
  }
  return [];
}

/** Distance en km entre deux points WGS84 (formule Haversine). */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseCoord(v: number | string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function defaultRadiusIndexForCategory(categorie: string | null | undefined): number {
  const c = normalizeText(categorie);
  if (c === "Services" || c === "Coups de main") {
    return RADIUS_OPTIONS_KM.indexOf(50);
  }
  return SLIDER_FRANCE_INDEX;
}

function formatDistanceLabel(km: number | null): string | null {
  if (km == null || !Number.isFinite(km)) return null;
  if (km < 0.5) return "📍 Dans votre rue !";
  if (km < 2) return "📍 Dans votre quartier !";
  if (km < 10) {
    const rounded = Math.round(km * 10) / 10;
    return `📍 À ${String(rounded).replace(".", ",")} km de vous`;
  }
  return `📍 À ${Math.round(km)} km de vous`;
}

function computeScore(a: Annonce, b: Annonce) {
  let score = 0;
  if (normalizeText(b.categorie) && normalizeText(a.categorie_souhaitee) && b.categorie === a.categorie_souhaitee) score += 40;
  if (normalizeText(b.sous_categorie) && normalizeText(a.sous_categorie_souhaitee) && b.sous_categorie === a.sous_categorie_souhaitee) score += 30;
  if (normalizeText(a.categorie) && normalizeText(b.categorie_souhaitee) && a.categorie === b.categorie_souhaitee) score += 40;
  if (normalizeText(a.sous_categorie) && normalizeText(b.sous_categorie_souhaitee) && a.sous_categorie === b.sous_categorie_souhaitee) score += 30;
  const cityA = cityOfLocalisation(a.localisation);
  const cityB = cityOfLocalisation(b.localisation);
  if (cityA && cityB && cityA === cityB) score += 20;
  if (b.ouvert_propositions === true) score += 10;
  return score;
}

export default function DecouvrirPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [currentUserNom, setCurrentUserNom] = useState<string>("");

  const [scrolled, setScrolled] = useState(false);
  const [menuCompteOpen, setMenuCompteOpen] = useState(false);
  const menuCompteRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rawCandidates, setRawCandidates] = useState<Annonce[]>([]);
  const [myAnnonces, setMyAnnonces] = useState<Annonce[]>([]);
  const [idx, setIdx] = useState(0);
  const [swipedAnnonceIds, setSwipedAnnonceIds] = useState<number[]>([]);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"pending" | "ok" | "none">("pending");

  const [radiusIndex, setRadiusIndex] = useState(SLIDER_FRANCE_INDEX);
  const radiusUserAdjusted = useRef(false);

  const [matchOpen, setMatchOpen] = useState(false);
  const [isSavingSwipe, setIsSavingSwipe] = useState<"like" | "pass" | null>(null);

  const swipedSet = useMemo(() => new Set(swipedAnnonceIds), [swipedAnnonceIds]);

  const filteredCandidates = useMemo(() => {
    if (radiusIndex >= SLIDER_FRANCE_INDEX) return rawCandidates;
    const maxKm = RADIUS_OPTIONS_KM[radiusIndex];
    if (!userLocation) return rawCandidates;

    return rawCandidates.filter((a) => {
      const lat = parseCoord(a.latitude);
      const lng = parseCoord(a.longitude);
      if (lat == null || lng == null) return false;
      return haversineKm(userLocation.lat, userLocation.lng, lat, lng) <= maxKm;
    });
  }, [rawCandidates, userLocation, radiusIndex]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data?.user?.id ?? null;
      setUserId(uid);
      setIsCheckingAuth(false);
      setCurrentUserEmail(String(data?.user?.email ?? ""));
      if (!uid) window.location.assign("/connexion");
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from("annonces")
      .select("membre_nom")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const nom = data?.membre_nom != null ? String(data.membre_nom) : "";
        setCurrentUserNom(nom);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const fetchFallbackLocation = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("annonces")
      .select("latitude,longitude")
      .eq("user_id", uid)
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    const lat = parseCoord(data.latitude as number | string | null);
    const lng = parseCoord(data.longitude as number | string | null);
    if (lat == null || lng == null) return null;
    return { lat, lng };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const apply = (lat: number, lng: number) => {
      if (cancelled) return;
      setUserLocation({ lat, lng });
      setLocationStatus("ok");
    };

    const failToSupabase = async () => {
      const fb = await fetchFallbackLocation(userId);
      if (cancelled) return;
      if (fb) apply(fb.lat, fb.lng);
      else setLocationStatus("none");
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      void failToSupabase();
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => apply(pos.coords.latitude, pos.coords.longitude),
      () => void failToSupabase(),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 }
    );

    return () => {
      cancelled = true;
    };
  }, [userId, fetchFallbackLocation]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuCompteRef.current && !menuCompteRef.current.contains(e.target as Node)) setMenuCompteOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setIdx(0);
  }, [userLocation?.lat, userLocation?.lng]);

  const loadDeck = async (uid: string) => {
    setIsLoading(true);
    setError(null);
    radiusUserAdjusted.current = false;
    try {
      const [myRes, swipedRes] = await Promise.all([
        supabase.from("annonces").select(SELECT_FIELDS).eq("user_id", uid).order("id", { ascending: false }),
        supabase.from("swipes").select("annonce_id").eq("swiper_id", uid),
      ]);
      if (myRes.error) throw myRes.error;
      if (swipedRes.error) throw swipedRes.error;

      const mine = (myRes.data ?? []) as Annonce[];
      const swipedIds = (swipedRes.data ?? []).map((r: { annonce_id: unknown }) => Number(r.annonce_id)).filter(Boolean);

      let q = supabase
        .from("annonces")
        .select(SELECT_FIELDS)
        .neq("user_id", uid)
        .order("id", { ascending: false })
        .limit(80);
      if (swipedIds.length > 0) q = q.not("id", "in", `(${swipedIds.join(",")})`);
      const { data: rows, error: err } = await q;
      if (err) throw err;

      const rowsData = (rows ?? []) as Annonce[];
      setMyAnnonces(mine);
      setRawCandidates(rowsData);
      setSwipedAnnonceIds(swipedIds);
      setIdx(0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Erreur inconnue";
      setError(msg);
      setRawCandidates([]);
      setIdx(0);
      setSwipedAnnonceIds([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    void loadDeck(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const current = useMemo(() => {
    let i = idx;
    while (i < filteredCandidates.length) {
      const c = filteredCandidates[i];
      if (c && !swipedSet.has(c.id)) return c;
      i += 1;
    }
    return null;
  }, [filteredCandidates, idx, swipedSet]);

  /** Rayon auto selon la carte en cours (si l’utilisateur n’a pas touché au slider) + aligne idx sur la carte après changement de filtre. */
  useEffect(() => {
    if (!current) return;

    if (!radiusUserAdjusted.current) {
      const nextR = defaultRadiusIndexForCategory(current.categorie);
      if (nextR !== radiusIndex) {
        setRadiusIndex(nextR);
        return;
      }
    }

    const i = filteredCandidates.findIndex((c) => c.id === current.id);
    if (i >= 0) setIdx(i);
    else setIdx(0);
  }, [current?.id, current?.categorie, filteredCandidates, radiusIndex]);

  const myAnnonceIds = useMemo(() => myAnnonces.map((a) => a.id).filter(Boolean), [myAnnonces]);

  const currentScore = useMemo(() => {
    if (!current || myAnnonces.length === 0) return 0;
    let best = 0;
    for (const a of myAnnonces) {
      const s = computeScore(a, current);
      if (s > best) best = s;
    }
    return best;
  }, [current, myAnnonces]);

  const distanceKmCurrent = useMemo(() => {
    if (!userLocation || !current) return null;
    const lat = parseCoord(current.latitude);
    const lng = parseCoord(current.longitude);
    if (lat == null || lng == null) return null;
    return haversineKm(userLocation.lat, userLocation.lng, lat, lng);
  }, [userLocation, current]);

  const distanceLine = formatDistanceLabel(distanceKmCurrent);

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const swipe = async (direction: "like" | "pass") => {
    if (!userId || !current || isSavingSwipe) return;

    const cardId = current.id;
    const cardUserId = current.user_id;

    setSwipedAnnonceIds((prev) => (prev.includes(cardId) ? prev : [...prev, cardId]));
    setIsSavingSwipe(direction);

    try {
      const { error: insErr } = await supabase.from("swipes").insert({
        swiper_id: userId,
        annonce_id: cardId,
        direction,
      });
      if (insErr) throw insErr;

      if (direction === "like" && cardUserId && myAnnonceIds.length > 0) {
        const { data: reciprocal, error: recErr } = await supabase
          .from("swipes")
          .select("id,annonce_id")
          .eq("swiper_id", cardUserId)
          .eq("direction", "like")
          .in("annonce_id", myAnnonceIds)
          .limit(1);
        if (recErr) throw recErr;
        if ((reciprocal ?? []).length > 0) {
          setMatchOpen(true);

          // Email Brevo après détection du match
          try {
            await fetch("/api/email/match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                membre1_email: currentUserEmail,
                membre1_nom: currentUserNom || currentUserEmail || "Vous",
                membre2_nom: current.membre_nom || "Membre",
                annonce_titre: current.titre || "Annonce",
              }),
            });
          } catch {
            // ne bloque pas l’UX
          }
        }
      }
    } catch (e: unknown) {
      setSwipedAnnonceIds((prev) => prev.filter((id) => id !== cardId));
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Impossible d'enregistrer le swipe";
      setError(msg);
    } finally {
      setIsSavingSwipe(null);
    }
  };

  const remaining = useMemo(
    () => Math.max(0, filteredCandidates.length - swipedAnnonceIds.filter((id) => filteredCandidates.some((c) => c.id === id)).length),
    [filteredCandidates, swipedAnnonceIds]
  );

  const radiusLabel =
    radiusIndex >= SLIDER_FRANCE_INDEX ? "Toute la France" : `${RADIUS_OPTIONS_KM[radiusIndex]} km`;

  const showLocationHint =
    radiusIndex < SLIDER_FRANCE_INDEX && locationStatus !== "pending" && !userLocation;

  if (isCheckingAuth) {
    return (
      <div style={{ fontFamily: "sans-serif", padding: "40px 20px", maxWidth: "1100px", margin: "0 auto", color: "#666" }}>
        Chargement…
      </div>
    );
  }

  return (
    <div className="decouvrirRoot" style={{ fontFamily: "sans-serif", background: "#fafafa", minHeight: "100vh" }}>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "white",
          borderBottom: "1px solid #eee",
          boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
          transition: "box-shadow 0.2s ease",
        }}
      >
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
          <div className="navRow" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
            <div className="navLeft" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: COLORS.green }} />
                <span style={{ fontWeight: "600", fontSize: "18px" }}>Troc-Service</span>
              </a>

              {!userId && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <a href="/connexion" style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: "8px", textDecoration: "none", color: "#333", fontSize: "13px", fontWeight: "500" }}>
                    Connexion
                  </a>
                  <a href="/abonnement" className="navBtnOrangeDesktop" style={{ padding: "6px 14px", border: "none", borderRadius: "8px", background: COLORS.orange, color: "white", textDecoration: "none", fontSize: "13px", fontWeight: "500" }}>
                    Rejoindre — 1€/mois
                  </a>
                </div>
              )}

              {!!userId && (
                <div ref={menuCompteRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setMenuCompteOpen((v) => !v)}
                    className="navCompteBtn"
                    style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#333", display: "flex", alignItems: "center", gap: "6px" }}
                    aria-label="Mon compte"
                  >
                    <span className="navCompteIcon" aria-hidden="true">👤</span>
                    <span className="navCompteText">Mon compte</span>
                    <span className="navCompteCaret" aria-hidden="true" style={{ fontSize: "10px", color: "#999" }}>▾</span>
                  </button>
                  {menuCompteOpen && (
                    <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "white", border: "1px solid #eee", borderRadius: "10px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: "180px", zIndex: 500, overflow: "hidden" }}>
                      {[
                        { href: "/profil", label: "👤 Mon profil" },
                        { href: "/profil", label: "📋 Mes annonces" },
                        { href: "/mon-compte/statistiques", label: "📊 Mes statistiques" },
                        { href: "/decouvrir", label: "🔍 Découvrir" },
                        { href: "/mes-matches", label: "🔄 Mes matches" },
                        { href: "/favoris", label: "❤️ Mes favoris" },
                        { href: "/messages", label: "✉️ Mes messages" },
                      ].map((item) => (
                        <a
                          key={item.href + item.label}
                          href={item.href}
                          style={{ display: "block", padding: "10px 16px", textDecoration: "none", color: "#333", fontSize: "13px", borderBottom: "1px solid #f5f5f5" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.greenLight)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                        >
                          {item.label}
                        </a>
                      ))}
                      <button
                        onClick={handleDeconnexion}
                        style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", background: "white", border: "none", cursor: "pointer", color: COLORS.orange, fontSize: "13px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff3ee")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                      >
                        🚪 Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="navRight" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {!!userId && (
                <>
                  <a href="/decouvrir" title="Découvrir" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: COLORS.greenLight, textDecoration: "none", fontSize: "18px", lineHeight: "1", color: COLORS.greenDark }}>
                    🔍
                  </a>
                  <a href="/messages" title="Mes messages" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: "white", textDecoration: "none", fontSize: "18px", lineHeight: "1" }}>
                    ✉️
                  </a>
                  <a href="/mes-matches" title="Mes matches" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: "white", textDecoration: "none", fontSize: "18px", lineHeight: "1" }}>
                    🔄
                  </a>
                  <a href="/favoris" title="Mes favoris" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: "white", textDecoration: "none", fontSize: "18px", lineHeight: "1" }}>
                    ❤️
                  </a>
                </>
              )}
              <a href="/creer-annonce" style={{ padding: "8px 16px", border: "none", borderRadius: "8px", background: COLORS.green, color: "white", textDecoration: "none", fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap" }}>
                + Déposer
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "16px 20px 22px" }}>
        <div style={{ padding: "8px 0 12px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, margin: 0 }}>🔍 Découvrir</h1>
          <p style={{ color: "#666", margin: "6px 0 0", fontSize: "13px" }}>Une annonce à la fois — like ou passer.</p>
        </div>

        <div
          className="radiusPanel"
          style={{
            marginBottom: 14,
            padding: "14px 16px",
            background: "white",
            borderRadius: 14,
            border: "1px solid #eee",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <label htmlFor="radius-slider" style={{ display: "block", fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#222" }}>
            Rayon de recherche : {radiusLabel}
          </label>
          <input
            id="radius-slider"
            type="range"
            min={0}
            max={SLIDER_FRANCE_INDEX}
            step={1}
            value={radiusIndex}
            onChange={(e) => {
              radiusUserAdjusted.current = true;
              setRadiusIndex(Number(e.target.value));
              setIdx(0);
            }}
            className="radiusSlider"
            aria-valuetext={radiusLabel}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 4,
              fontSize: 11,
              color: "#888",
              marginTop: 8,
            }}
          >
            <span>2 km</span>
            <span style={{ fontWeight: 600, color: COLORS.greenDark }}>Toute la France</span>
          </div>
          {showLocationHint && (
            <p style={{ margin: "10px 0 0", fontSize: 12, color: COLORS.orange }}>
              Activez la géolocalisation ou ajoutez une annonce avec adresse pour filtrer par distance.
            </p>
          )}
        </div>

        {!!error && (
          <div style={{ padding: "12px 14px", border: "1px solid #ffd6c9", background: "#fff3ee", color: COLORS.orange, borderRadius: "12px", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        {isLoading && (
          <div style={{ padding: "16px 0", color: "#666" }}>
            Chargement des annonces…
          </div>
        )}

        {!isLoading && !current && (
          <div style={{ padding: "18px 16px", border: "1px solid #eee", background: "white", borderRadius: "14px", boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 700, marginBottom: "6px" }}>Revenez plus tard ! 🌿</div>
            <div style={{ color: "#666", fontSize: "13px" }}>
              {radiusIndex < SLIDER_FRANCE_INDEX && userLocation && filteredCandidates.length === 0 && rawCandidates.length > 0
                ? "Aucune annonce dans ce rayon. Élargissez le rayon ou choisissez « Toute la France »."
                : "Vous avez tout vu pour le moment."}
            </div>
            <button
              onClick={() => userId && loadDeck(userId)}
              style={{ marginTop: "12px", padding: "10px 14px", borderRadius: "10px", background: COLORS.green, color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              Rafraîchir
            </button>
          </div>
        )}

        {!!current && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div key={current.id} className="card" style={{ width: "100%", maxWidth: "520px", background: "white", border: "1px solid #eee", borderRadius: "18px", overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.10)" }}>
              <div style={{ position: "relative" }}>
                {currentScore > 0 && (
                  <div style={{ position: "absolute", top: "10px", left: "10px", padding: "6px 10px", borderRadius: "999px", background: COLORS.greenLight, color: COLORS.greenDark, fontSize: "12px", fontWeight: 800, border: "1px solid #9FE1CB", zIndex: 2 }}>
                    {currentScore} pts
                  </div>
                )}

                <div style={{ position: "absolute", top: "10px", right: "10px", zIndex: 2 }}>
                  {current.mode === "cherche" ? (
                    <span style={{ fontSize: "12px", padding: "6px 10px", borderRadius: "999px", background: "#fff3ee", color: COLORS.orange, fontWeight: 800, border: "1px solid #ffd6c9" }}>
                      🔍 Cherche
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", padding: "6px 10px", borderRadius: "999px", background: COLORS.greenLight, color: COLORS.greenDark, fontWeight: 800, border: "1px solid #9FE1CB" }}>
                      🎁 Propose
                    </span>
                  )}
                </div>

                {normalizePhotos(current.photos)[0] ? (
                  <div className="photoWrap">
                    <img className="photo" src={normalizePhotos(current.photos)[0]} alt={current.titre || "Photo annonce"} />
                  </div>
                ) : (
                  <div className="photoPlaceholder">📷</div>
                )}
              </div>

              <div style={{ padding: "14px 16px 16px" }}>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: COLORS.greenLight, color: COLORS.greenDark, fontWeight: 700 }}>
                    {current.categorie || "Sans catégorie"}
                  </span>
                  {!!current.sous_categorie && (
                    <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: "#f0faf5", color: COLORS.greenDark, border: "1px solid #9FE1CB", fontWeight: 700 }}>
                      {current.sous_categorie}
                    </span>
                  )}
                </div>

                {distanceLine ? (
                  <div style={{ fontSize: "13px", fontWeight: 700, color: COLORS.greenDark, marginBottom: 8 }}>{distanceLine}</div>
                ) : userLocation && (parseCoord(current.latitude) == null || parseCoord(current.longitude) == null) ? (
                  <div style={{ fontSize: "13px", color: "#888", marginBottom: 8 }}>📍 Localisation de l’annonce indisponible</div>
                ) : !userLocation && locationStatus === "none" ? (
                  <div style={{ fontSize: "13px", color: "#888", marginBottom: 8 }}>📍 Activez la géolocalisation pour voir la distance</div>
                ) : null}

                <div style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", lineHeight: 1.2 }}>
                  {current.titre || "Annonce"}
                </div>

                {!!current.echange_souhaite && (
                  <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
                    Échange souhaité : <span style={{ color: COLORS.greenDark, fontWeight: 700 }}>{current.echange_souhaite}</span>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => current.user_id && (window.location.href = `/membre/${current.user_id}`)}
                    style={{ fontSize: "13px", color: "#666", background: "none", border: "none", padding: 0, cursor: current.user_id ? "pointer" : "default", textDecoration: current.user_id ? "underline" : "none" }}
                    title="Voir le profil du membre"
                  >
                    {current.membre_nom || "Membre"}
                  </button>
                  {!!current.localisation && (
                    <span style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "999px", background: COLORS.greenLight, color: COLORS.greenDark, fontWeight: 700 }}>
                      {current.localisation}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "16px", position: "relative", zIndex: 10 }}>
                  <button
                    disabled={!!isSavingSwipe}
                    onClick={() => swipe("pass")}
                    style={{
                      flex: 1,
                      padding: "14px 14px",
                      borderRadius: "14px",
                      border: "1px solid #eee",
                      background: "white",
                      cursor: isSavingSwipe ? "not-allowed" : "pointer",
                      fontSize: "15px",
                      fontWeight: 900,
                      color: "#333",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    }}
                  >
                    ❌ Passer
                  </button>
                  <button
                    disabled={!!isSavingSwipe}
                    onClick={() => swipe("like")}
                    style={{
                      flex: 1,
                      padding: "14px 14px",
                      borderRadius: "14px",
                      border: "none",
                      background: COLORS.green,
                      cursor: isSavingSwipe ? "not-allowed" : "pointer",
                      fontSize: "15px",
                      fontWeight: 900,
                      color: "white",
                      boxShadow: "0 10px 20px rgba(29,158,117,0.25)",
                    }}
                  >
                    ✅ Intéressé
                  </button>
                </div>

                <div style={{ marginTop: "10px", fontSize: "12px", color: "#999", textAlign: "center" }}>
                  {remaining} restante(s)
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {matchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "18px" }}
          onClick={() => setMatchOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "420px", background: "white", borderRadius: "18px", border: "1px solid #eee", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}
          >
            <div style={{ padding: "16px 16px 12px", background: COLORS.greenLight, borderBottom: "1px solid #d8efe7" }}>
              <div style={{ fontSize: "20px", fontWeight: 900, color: COLORS.greenDark }}>🎉 Match !</div>
              <div style={{ color: "#2b4b41", fontSize: "13px", marginTop: "6px" }}>Vous pouvez vous contacter.</div>
            </div>
            <div style={{ padding: "14px 16px 16px" }}>
              <a
                href="/messages"
                style={{ display: "block", width: "100%", textAlign: "center", padding: "12px 14px", borderRadius: "12px", background: COLORS.orange, color: "white", textDecoration: "none", fontWeight: 900, marginBottom: "10px" }}
              >
                Aller aux messages
              </a>
              <button
                onClick={() => setMatchOpen(false)}
                style={{ width: "100%", padding: "12px 14px", borderRadius: "12px", border: `1px solid ${COLORS.green}`, background: "white", color: COLORS.greenDark, cursor: "pointer", fontWeight: 900 }}
              >
                Continuer à découvrir
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .radiusSlider {
          width: 100%;
          max-width: 100%;
          height: 36px;
          accent-color: #1d9e75;
          cursor: pointer;
          touch-action: manipulation;
        }
        .radiusPanel {
          box-sizing: border-box;
        }
        .photoWrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #f5f5f5;
        }
        .photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .photoPlaceholder {
          width: 100%;
          aspect-ratio: 4 / 3;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
          font-size: 42px;
        }
        @media (max-width: 768px) {
          .navBtnOrangeDesktop {
            display: none !important;
          }
          .navRow {
            flex-wrap: nowrap !important;
          }
          .navLeft {
            flex-wrap: nowrap !important;
            min-width: 0 !important;
            gap: 10px !important;
          }
          .navRight {
            flex-shrink: 0 !important;
          }
          .navCompteBtn {
            padding: 8px 10px !important;
            gap: 0 !important;
          }
          .navCompteText,
          .navCompteCaret {
            display: none !important;
          }
          .card {
            border-radius: 14px !important;
          }
          .radiusPanel {
            padding: 12px 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
