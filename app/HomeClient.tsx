"use client";

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import MapComponent from "@/components/MapComponent";
import { supabase } from "@/app/supabase";

type Annonce = {
  id: number;
  user_id?: string | null;
  categorie?: string | null;
  sous_categorie?: string | null;
  titre?: string | null;
  echange_souhaite?: string | null;
  ouvert_propositions?: boolean | null;
  membre_nom?: string | null;
  localisation?: string | null;
  photos?: string[] | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  mode?: "propose" | "cherche" | string | null;
};

const CATEGORIES = [
  "Tout",
  "Vêtements",
  "Objets & matériel",
  "Services",
  "Coups de main",
  "Alimentation & fait-maison",
  "Jeux & Jouets enfant",
  "Collections & passions",
  "Artisanat & création",
  "Compétences numériques",
  "Hébergement & accueil",
] as const;

const CATEGORIES_DATA: Record<string, string[]> = {
  "Vêtements": [
    "Femme - Hauts", "Femme - Bas", "Femme - Robes & jupes", "Femme - Vestes & manteaux",
    "Femme - Chaussures", "Femme - Accessoires", "Femme - Maillots de bain",
    "Femme - Lingerie", "Femme - Sport",
    "Homme - Hauts", "Homme - Bas", "Homme - Vestes & manteaux",
    "Homme - Chaussures", "Homme - Accessoires", "Homme - Maillots de bain", "Homme - Sport",
    "Enfant - Hauts", "Enfant - Bas", "Enfant - Robes & jupes", "Enfant - Vestes & manteaux",
    "Enfant - Chaussures", "Enfant - Accessoires", "Enfant - Sport",
    "Bébé - Hauts", "Bébé - Bas", "Bébé - Combinaisons", "Bébé - Chaussures", "Bébé - Accessoires",
    "Unisexe - Hauts", "Unisexe - Bas", "Unisexe - Vestes & manteaux",
    "Unisexe - Chaussures", "Unisexe - Accessoires", "Unisexe - Sport",
  ],
  "Objets & matériel": [
    "Maison & déco", "Électronique", "Électroménager", "Sport & loisirs",
    "Livres, BD & magazines", "Jeux & jouets", "Jardin & bricolage",
    "Bateaux & nautisme", "Véhicules & accessoires", "Musique",
    "Bébé & puériculture", "Divers objets",
  ],
  "Services": [
    "Bricolage & réparation", "Jardinage & espaces verts", "Déménagement & transport",
    "Soin & bien-être", "Garde enfants, animaux, plantes",
    "Cours & transmission présentiel", "Cours & transmission distanciel", "Divers services",
  ],
  "Coups de main": [
    "Rangement & vide", "Nettoyage", "Aide maison", "Courses & commissions",
    "Déchetterie & encombrants", "Jardinage ponctuel", "Aide administrative",
    "Compagnie & sorties", "Divers coups de main",
  ],
  "Alimentation & fait-maison": [
    "Cuisine & pâtisserie", "Du jardin & de la nature", "Boissons artisanales",
    "Régimes & spécialités", "Divers alimentation",
  ],
  "Jeux & Jouets enfant": [
    "Lego & briques", "Playmobil", "Figurines & poupées", "Jeux de société enfant",
    "Jeux vidéo enfant", "Peluches & doudous", "Divers jouets",
  ],
  "Collections & passions": [
    "Lego vintage & sets rares", "Figurines de collection", "Cartes à collectionner",
    "Jeux vidéo rétro", "Jeux de rôle", "Timbres & philatélie",
    "Cartes postales anciennes", "Montres & horlogerie", "Vinyles & musique",
    "Tarots & oracles", "Modélisme & miniatures", "Affiches & posters vintage",
    "Divers collections",
  ],
  "Artisanat & création": [
    "Bijoux & accessoires faits main", "Textile & couture", "Bois & menuiserie",
    "Métal & ferronnerie", "Céramique & poterie", "Peinture, dessin & illustration",
    "Impression 3D", "Bougies, savons & cosmétiques naturels", "Divers artisanat",
  ],
  "Compétences numériques": [
    "Graphisme & design", "Développement & code", "Rédaction & traduction",
    "Photo & vidéo", "Musique & son", "Réseaux sociaux & communication",
    "Divers compétences numériques",
  ],
  "Hébergement & accueil": [
    "Chambre contre services",
    "Logement contre travaux",
    "Séjour contre compétences",
    "Colocation troc",
    "Accueil temporaire",
    "Maison contre garde",
    "Studio contre aide",
    "Divers hébergement",
  ],
};

function FavorisButton({ annonceId, favorisSet, onToggle }: {
  annonceId: number;
  favorisSet: Set<number>;
  onToggle: (id: number, e: React.MouseEvent) => void;
}) {
  const isFav = favorisSet.has(annonceId);
  return (
    <button onClick={(e) => onToggle(annonceId, e)}
      style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.2)", zIndex: 10 }}
      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}>
      {isFav ? "❤️" : "🤍"}
    </button>
  );
}

export default function HomeClient({ annonces }: { annonces: Annonce[] }) {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("Tout");
  const [activeSousCategorie, setActiveSousCategorie] = useState<string>("");
  const [favorisSet, setFavorisSet] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [mapKey, setMapKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [ftsActive, setFtsActive] = useState(false);
  const [ftsAnnonces, setFtsAnnonces] = useState<Annonce[]>([]);
  const [annonceActiveId, setAnnonceActiveId] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuCompteOpen, setMenuCompteOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ratingsByUserId, setRatingsByUserId] = useState<Record<string, { avg: number; count: number }>>({});
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuCompteRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async (uid: string) => {
    const { count, error } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("destinataire_id", uid)
      .eq("lu", false);
    if (error) {
      setUnreadCount(0);
      return;
    }
    setUnreadCount(count ?? 0);
  }, []);

  // Chargement initial de l'auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserId(data.user.id);
        void fetchUnreadCount(data.user.id);
        supabase.from("favoris").select("annonce_id").eq("user_id", data.user.id)
          .then(({ data: favs }) => {
            if (favs) setFavorisSet(new Set(favs.map((f: any) => f.annonce_id)));
          });
      }
    });
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
      },
      () => {}
    );
  }, []);

  // Rechargement auth + carte au retour navigateur
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      setMapKey(k => k + 1);
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUserId(data.user.id);
          void fetchUnreadCount(data.user.id);
          supabase.from("favoris").select("annonce_id").eq("user_id", data.user.id)
            .then(({ data: favs }) => {
              if (favs) setFavorisSet(new Set(favs.map((f: any) => f.annonce_id)));
            });
        } else {
          setUserId(null);
          setFavorisSet(new Set());
          setUnreadCount(0);
        }
      });
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
      if (menuCompteRef.current && !menuCompteRef.current.contains(e.target as Node)) {
        setMenuCompteOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const scrollToAnnonce = (id: number) => {
    const el = document.getElementById(`annonce-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const searchCategorySuggestions = useMemo(() => {
    if (!searchInput.trim() || searchInput.trim().length < 2) return [];
    const lower = searchInput.toLowerCase();
    const results: { categorie: string; sous_categorie: string }[] = [];
    const seen = new Set<string>();
    for (const [cat, sousCats] of Object.entries(CATEGORIES_DATA)) {
      for (const sc of sousCats) {
        if (sc.toLowerCase().includes(lower) || cat.toLowerCase().includes(lower)) {
          const key = `${cat}||${sc}`;
          if (!seen.has(key)) {
            seen.add(key);
            results.push({ categorie: cat, sous_categorie: sc });
          }
        }
      }
    }
    return results.slice(0, 6);
  }, [searchInput]);

  const handleToggleFavori = async (annonceId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) { window.location.href = "/connexion"; return; }
    const isFav = favorisSet.has(annonceId);
    if (isFav) {
      await supabase.from("favoris").delete().eq("user_id", userId).eq("annonce_id", annonceId);
      setFavorisSet((prev) => { const next = new Set(prev); next.delete(annonceId); return next; });
    } else {
      await supabase.from("favoris").insert({ user_id: userId, annonce_id: annonceId });
      setFavorisSet((prev) => new Set(prev).add(annonceId));
    }
  };

  const handleSearch = async () => {
    const trimmed = searchInput.trim();
    setSearchQuery(trimmed);
    setShowSearchSuggestions(false);

    if (!trimmed) {
      setFtsActive(false);
      setFtsAnnonces([]);
      setSearchLoading(false);
      return;
    }

    if (trimmed.length < 2) {
      setFtsActive(false);
      setFtsAnnonces([]);
      setSearchLoading(false);
      setActiveCategory("Tout");
      setActiveSousCategorie("");
      return;
    }

    setActiveCategory("Tout");
    setActiveSousCategorie("");
    setFtsActive(true);
    setFtsAnnonces([]);
    setSearchLoading(true);

    try {
      const params = new URLSearchParams({ q: trimmed, limit: "50" });
      const res = await fetch(`/api/search?${params.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFtsAnnonces([]);
        return;
      }
      setFtsAnnonces(Array.isArray(json.annonces) ? json.annonces : []);
    } catch {
      setFtsAnnonces([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const applyCategorySuggestion = (cat: string, sc: string) => {
    setActiveCategory(cat as any);
    setActiveSousCategorie(sc);
    setSearchInput(`${cat} › ${sc}`);
    setSearchQuery("");
    setFtsActive(false);
    setFtsAnnonces([]);
    setShowSearchSuggestions(false);
  };

  const filteredAnnonces = useMemo(() => {
    let result = ftsActive ? ftsAnnonces : annonces;
    if (activeCategory !== "Tout") result = result.filter((a) => a?.categorie === activeCategory);
    if (activeSousCategorie) result = result.filter((a) => a?.sous_categorie === activeSousCategorie);
    if (!ftsActive && searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter((a) =>
        a?.titre?.toLowerCase().includes(lower) ||
        a?.categorie?.toLowerCase().includes(lower) ||
        a?.sous_categorie?.toLowerCase().includes(lower) ||
        a?.localisation?.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [ftsActive, ftsAnnonces, activeCategory, activeSousCategorie, searchQuery, annonces]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!filteredAnnonces.length) {
        if (!cancelled) setRatingsByUserId({});
        return;
      }
      const annonceIds = filteredAnnonces.map((a) => a.id);
      const { data: evalRows, error } = await supabase
        .from("evaluations")
        .select("annonce_id, note")
        .in("annonce_id", annonceIds);
      if (cancelled || error) {
        if (!cancelled && error) setRatingsByUserId({});
        return;
      }
      const idToOwner = new Map<number, string>();
      for (const a of filteredAnnonces) {
        if (a.user_id) idToOwner.set(a.id, a.user_id);
      }
      const sums = new Map<string, { sum: number; count: number }>();
      for (const row of evalRows || []) {
        const aid = row.annonce_id as number;
        const uid = idToOwner.get(aid);
        if (!uid) continue;
        const n = Number(row.note);
        if (!Number.isFinite(n)) continue;
        const cur = sums.get(uid) || { sum: 0, count: 0 };
        cur.sum += n;
        cur.count += 1;
        sums.set(uid, cur);
      }
      const out: Record<string, { avg: number; count: number }> = {};
      sums.forEach((v, uid) => {
        out[uid] = { avg: v.sum / v.count, count: v.count };
      });
      if (!cancelled) setRatingsByUserId(out);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [filteredAnnonces]);

  const sousCategoriesDisponibles = activeCategory !== "Tout" ? CATEGORIES_DATA[activeCategory] || [] : [];

  const handleCategoryClick = (cat: (typeof CATEGORIES)[number]) => {
    setActiveCategory(cat);
    setActiveSousCategorie("");
    setSearchInput("");
    setSearchQuery("");
    setFtsActive(false);
    setFtsAnnonces([]);
    setAnnonceActiveId(null);
  };

  return (
    <div className="homeRoot" style={{ fontFamily: "sans-serif" }}>

      {/* NAVBAR STICKY */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 1000, background: "white",
        borderBottom: "1px solid #eee",
        boxShadow: scrolled ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
        transition: "box-shadow 0.2s ease",
      }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
          <div className="navRow" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>

            {/* GAUCHE : logo + état compte */}
            <div className="navLeft" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <a href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "inherit" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#1D9E75" }} />
                <span style={{ fontWeight: "600", fontSize: "18px" }}>Troc-Service</span>
              </a>

              {/* NON CONNECTÉ */}
              {!userId && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <a href="/connexion" style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: "8px", textDecoration: "none", color: "#333", fontSize: "13px", fontWeight: "500" }}>
                    Connexion
                  </a>
                  <a href="/abonnement" className="navBtnOrangeDesktop" style={{ padding: "6px 14px", border: "none", borderRadius: "8px", background: "#E8622A", color: "white", textDecoration: "none", fontSize: "13px", fontWeight: "500" }}>
                    Rejoindre — 1€/mois
                  </a>
                </div>
              )}

              {/* CONNECTÉ : menu déroulant Mon compte */}
              {!!userId && (
                <div ref={menuCompteRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => setMenuCompteOpen((v) => !v)}
                    className="navCompteBtn"
                    style={{ padding: "6px 14px", border: "1px solid #ddd", borderRadius: "8px", background: "white", cursor: "pointer", fontSize: "13px", fontWeight: "500", color: "#333", display: "flex", alignItems: "center", gap: "6px" }}
                    aria-label="Mon compte">
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
                        <a key={item.href + item.label} href={item.href}
                          style={{ display: "block", padding: "10px 16px", textDecoration: "none", color: "#333", fontSize: "13px", borderBottom: "1px solid #f5f5f5" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#E1F5EE")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                          {item.label}
                        </a>
                      ))}
                      <button onClick={handleDeconnexion}
                        style={{ display: "block", width: "100%", padding: "10px 16px", textAlign: "left", background: "white", border: "none", cursor: "pointer", color: "#E8622A", fontSize: "13px" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff3ee")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                        🚪 Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* DROITE : icônes + Déposer */}
            <div className="navRight" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {!!userId && (
                <>
                  <a href="/decouvrir" title="Découvrir" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: "#E1F5EE", textDecoration: "none", fontSize: "18px", lineHeight: "1", color: "#0F6E56" }}>🔍</a>
                  <a href="/mes-matches" title="Mes matches" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: "white", textDecoration: "none", fontSize: "18px", lineHeight: "1" }}>🔄</a>
                  <div style={{ position: "relative", display: "inline-flex" }}>
                    <a href="/messages" title="Mes messages" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: "white", textDecoration: "none", fontSize: "18px", lineHeight: "1" }}>✉️</a>
                    {unreadCount > 0 && (
                      <span
                        aria-label={`${unreadCount} message${unreadCount > 1 ? "s" : ""} non lu${unreadCount > 1 ? "s" : ""}`}
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          background: "#E8622A",
                          color: "white",
                          fontSize: "10px",
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          lineHeight: 1,
                          pointerEvents: "none",
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <a href="/favoris" title="Mes favoris" style={{ padding: "8px 12px", border: "1px solid #ddd", borderRadius: "8px", background: "white", textDecoration: "none", fontSize: "18px", lineHeight: "1" }}>❤️</a>
                </>
              )}
              <a href="/creer-annonce" style={{ padding: "8px 16px", border: "none", borderRadius: "8px", background: "#1D9E75", color: "white", textDecoration: "none", fontSize: "14px", fontWeight: "500", whiteSpace: "nowrap" }}>+ Déposer</a>
            </div>
          </div>
        </div>
      </nav>

      {/* CONTENU */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 20px" }}>
        <div style={{ padding: "40px 0 30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "500", marginBottom: "10px" }}>Plus besoin d'argent, faites-vous plaisir en échangeant</h1>
          <p style={{ color: "#666", marginBottom: "20px" }}>Objets, services, savoir-faire, trouvez votre troc idéal.</p>
          <div ref={searchRef} style={{ position: "relative" }}>
            <div className="searchRow" style={{ display: "flex", gap: "10px" }}>
              <input value={searchInput}
                placeholder="Rechercher une annonce, une catégorie..."
                style={{ flex: 1, padding: "10px 16px", border: "1px solid #ddd", borderRadius: "8px", fontSize: "15px" }}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSearchSuggestions(true);
                  if (!e.target.value.trim()) {
                    setSearchQuery("");
                    setActiveCategory("Tout");
                    setActiveSousCategorie("");
                    setFtsActive(false);
                    setFtsAnnonces([]);
                  }
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleSearch(); }} />
              <button
                type="button"
                className="searchButton"
                onClick={() => void handleSearch()}
                disabled={searchLoading}
                style={{
                  padding: "10px 20px",
                  background: "#1D9E75",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: searchLoading ? "wait" : "pointer",
                  opacity: searchLoading ? 0.75 : 1,
                }}
              >
                Rechercher
              </button>
            </div>
            {showSearchSuggestions && searchCategorySuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 200, background: "white", border: "1px solid #ddd", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", marginTop: "4px", overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", fontSize: "11px", color: "#999", borderBottom: "1px solid #f0f0f0" }}>CATÉGORIES SUGGÉRÉES</div>
                {searchCategorySuggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => applyCategorySuggestion(s.categorie, s.sous_categorie)}
                    style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: "white", border: "none", borderBottom: "1px solid #f0f0f0", cursor: "pointer", fontSize: "13px" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#E1F5EE")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}>
                    <span style={{ marginRight: "8px" }}>🏷️</span>
                    <span style={{ color: "#0F6E56", fontWeight: "500" }}>{s.categorie}</span>
                    <span style={{ color: "#666" }}> › {s.sous_categorie}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ height: "400px", borderRadius: "12px", overflow: "hidden", marginBottom: "30px", border: "1px solid #eee" }}>
          <MapComponent
            key={mapKey}
            annonces={filteredAnnonces as any[]}
            annonceActiveId={annonceActiveId}
            onAnnonceSelect={setAnnonceActiveId}
            userLat={userLat}
            userLng={userLng}
            fitBounds={searchQuery.trim() !== ""}
          />
        </div>

        <div className="categoryRow" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
          {CATEGORIES.map((cat) => {
            const isActive = cat === activeCategory;
            return (
              <button className="categoryChip" key={cat} onClick={() => handleCategoryClick(cat)}
                style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${isActive ? "#1D9E75" : "#ddd"}`, background: isActive ? "#E1F5EE" : "white", color: isActive ? "#0F6E56" : "#666", cursor: "pointer", fontSize: "13px", fontWeight: isActive ? "500" : "400" }}>
                {cat}
              </button>
            );
          })}
        </div>

        {sousCategoriesDisponibles.length > 0 && (
          <div className="sousCategoryRow" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "20px", paddingLeft: "4px" }}>
            <button onClick={() => setActiveSousCategorie("")}
              style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", border: `1px solid ${!activeSousCategorie ? "#1D9E75" : "#eee"}`, background: !activeSousCategorie ? "#E1F5EE" : "#fafafa", color: !activeSousCategorie ? "#0F6E56" : "#999", cursor: "pointer" }}>
              Tout
            </button>
            {sousCategoriesDisponibles.map((sc) => {
              const isActive = sc === activeSousCategorie;
              return (
                <button key={sc} onClick={() => setActiveSousCategorie(isActive ? "" : sc)}
                  style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "12px", border: `1px solid ${isActive ? "#1D9E75" : "#eee"}`, background: isActive ? "#E1F5EE" : "#fafafa", color: isActive ? "#0F6E56" : "#666", cursor: "pointer" }}>
                  {sc}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "500", margin: 0 }}>
            {filteredAnnonces.length} annonce{filteredAnnonces.length > 1 ? "s" : ""} disponible{filteredAnnonces.length > 1 ? "s" : ""}
          </h2>
          {activeSousCategorie && (
            <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#E1F5EE", color: "#0F6E56", display: "flex", alignItems: "center", gap: "6px" }}>
              {activeSousCategorie}
              <button onClick={() => setActiveSousCategorie("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#0F6E56", padding: 0, fontSize: "14px" }}>×</button>
            </span>
          )}
          {searchQuery && (
            <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#fff3ee", color: "#E8622A", display: "flex", alignItems: "center", gap: "6px" }}>
              « {searchQuery} »
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchInput("");
                  setFtsActive(false);
                  setFtsAnnonces([]);
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#E8622A", padding: 0, fontSize: "14px" }}
              >
                ×
              </button>
            </span>
          )}
          {searchLoading && (
            <span style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#E1F5EE", color: "#0F6E56", display: "flex", alignItems: "center", gap: "6px" }}>
              <span aria-hidden>⏳</span>
              Recherche…
            </span>
          )}
        </div>

        <div className="annoncesGrid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {filteredAnnonces.map((annonce) => {
            const isActive = annonceActiveId === annonce.id;
            return (
              <a
                key={annonce.id}
                href={`/annonce/${annonce.id}`}
                id={`annonce-${annonce.id}`}
                className="annonceCard"
                onMouseEnter={() => { setAnnonceActiveId(annonce.id); scrollToAnnonce(annonce.id); }}
                onMouseLeave={() => setAnnonceActiveId(null)}
                style={{
                  border: `2px solid ${isActive ? "#1D9E75" : "#eee"}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  position: "relative",
                  boxShadow: isActive ? "0 0 0 3px #E1F5EE" : "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "box-shadow 0.2s, border-color 0.2s",
                  transform: isActive ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{ position: "relative" }}>
                  <FavorisButton annonceId={annonce.id} favorisSet={favorisSet} onToggle={handleToggleFavori} />
                  {annonce?.photos?.[0] ? (
                    <div className="annoncePhotoWrap">
                      <img className="annoncePhoto" src={annonce.photos[0]} alt={annonce.titre || "Photo annonce"} />
                    </div>
                  ) : (
                    <div className="annoncePhotoPlaceholder">📷</div>
                  )}
                </div>
                <div className="annonceBody" style={{ padding: "14px", textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", gap: "4px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <span className="annonceCategory" style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "#E1F5EE", color: "#0F6E56" }}>{annonce.categorie}</span>
                    {annonce.sous_categorie && (
                      <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "20px", background: "#f0faf5", color: "#0F6E56", border: "1px solid #9FE1CB" }}>{annonce.sous_categorie}</span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px" }}>
                    {annonce.mode === "cherche" ? (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#fff3ee", color: "#E8622A", fontWeight: 600 }}>🔍 Cherche</span>
                    ) : (
                      <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: "#E1F5EE", color: "#0F6E56", fontWeight: 600 }}>🎁 Propose</span>
                    )}
                  </div>
                  <div className="annonceTitle" style={{ fontWeight: "600", fontSize: "15px", margin: "4px 0 5px" }}>{annonce.titre}</div>
                  {!!annonce.echange_souhaite && (
                    <div className="annonceEchange" style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
                      Échange contre : <span style={{ color: "#1D9E75", fontWeight: "500" }}>{annonce.echange_souhaite}</span>
                    </div>
                  )}
                  {!!annonce.ouvert_propositions && (
                    <div style={{ fontSize: "12px", color: "#0F6E56", marginBottom: "6px" }}>✅ Ouvert à toute autre proposition</div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (annonce.user_id) window.location.href = `/membre/${annonce.user_id}`;
                        }}
                        title="Voir le profil du membre"
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: annonce.user_id ? "pointer" : "default",
                          textDecoration: annonce.user_id ? "underline" : "none",
                        }}
                      >
                        {annonce.membre_nom}
                      </button>
                      <span className="annonceLocation" style={{ fontSize: "11px", padding: "2px 8px", background: "#E1F5EE", color: "#0F6E56", borderRadius: "20px" }}>{annonce.localisation}</span>
                    </div>
                    {annonce.user_id &&
                      ratingsByUserId[annonce.user_id] &&
                      ratingsByUserId[annonce.user_id].count > 0 && (
                        <span style={{ fontSize: "11px", color: "#FFD700", fontWeight: 600 }}>
                          ⭐ {ratingsByUserId[annonce.user_id].avg.toFixed(1)}
                        </span>
                      )}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid #eee", padding: "20px 0", marginTop: "40px", fontSize: "11px", color: "#999" }}>
          Troc-Service — Plateforme d'échange entre particuliers · <a href="#" style={{ color: "#1D9E75" }}>CGU</a> · <a href="#" style={{ color: "#1D9E75" }}>Mentions légales</a> · <a href="#" style={{ color: "#1D9E75" }}>RGPD</a>
        </div>
      </main>

      <style jsx>{`
        .annoncePhotoWrap { width: 100%; aspect-ratio: 1 / 1; overflow: hidden; background: #f5f5f5; }
        .annoncePhoto { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s ease; }
        .annonceCard:hover .annoncePhoto { transform: scale(1.04); }
        .annoncePhotoPlaceholder { width: 100%; aspect-ratio: 1 / 1; background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 32px; }
        @media (max-width: 1024px) {
          .annoncesGrid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
        }
        @media (max-width: 768px) {
          .homeRoot { padding-left: 0 !important; padding-right: 0 !important; }
          .navBtnOrangeDesktop { display: none !important; }
          .navRow { flex-wrap: nowrap !important; }
          .navLeft { flex-wrap: nowrap !important; min-width: 0 !important; gap: 10px !important; }
          .navRight { flex-shrink: 0 !important; }
          .navCompteBtn { padding: 8px 10px !important; gap: 0 !important; }
          .navCompteText, .navCompteCaret { display: none !important; }
          .searchRow { flex-direction: column; }
          .searchButton { width: 100%; }
          .categoryRow { flex-wrap: nowrap !important; overflow-x: auto; padding-bottom: 6px; }
          .sousCategoryRow { flex-wrap: nowrap !important; overflow-x: auto; padding-bottom: 6px; }
          .categoryChip { flex: 0 0 auto; white-space: nowrap; }
          .annoncesGrid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .annonceCard { border-radius: 8px !important; }
          .annonceBody { padding: 8px !important; }
          .annonceCategory { font-size: 11px !important; }
          .annonceTitle { font-size: 13px !important; }
          .annonceEchange { font-size: 11px !important; margin-bottom: 3px !important; }
          .annonceLocation { font-size: 10px !important; }
        }
      `}</style>
    </div>
  );
}