Je développe Troc-Service, une app Next.js + TypeScript + Supabase + Google Maps.
Règle absolue : toujours générer le fichier complet, jamais des corrections partielles.

STACK : Next.js 16, TypeScript, Supabase, Google Maps API, Stripe
DÉPLOIEMENT : local npm run dev, PowerShell Windows
COULEURS : vert #1D9E75, vert foncé #0F6E56, vert clair #E1F5EE, orange #E8622A

TABLES SUPABASE :
- annonces : id, titre, description, categorie, sous_categorie, localisation, 
  echange_souhaite, ouvert_propositions, membre_nom, photos (text[]), 
  latitude, longitude, user_id (UUID), created_at, 
  categorie_souhaitee, sous_categorie_souhaitee, mode ('propose' ou 'cherche')
- favoris : id, user_id, annonce_id, created_at
- messages : id, expediteur_id, expediteur_nom, destinataire_id, 
  destinataire_nom, annonce_id, contenu, lu, created_at
- swipes : id, swiper_id, annonce_id, direction ('like' ou 'pass'), created_at

FICHIERS PRINCIPAUX :
- app/page.tsx : page serveur (export const revalidate = 0)
- app/HomeClient.tsx : page client principale avec navbar, carte, grille annonces
- components/MapComponent.tsx : carte Google Maps avec épingles spirale
- app/creer-annonce/page.tsx : formulaire avec boutons Je propose/Je cherche, 
  suggestion catégorie par mots-clés, upload 3 photos, géocodage Google Maps
- app/annonce/[id]/page.jsx : page détail annonce
- app/profil/page.tsx : profil membre connecté
- app/favoris/page.tsx : mes favoris
- app/messages/page.tsx : messagerie
- app/mes-matches/page.tsx : algorithme de matching par score
- app/decouvrir/page.tsx : swipe style Tinder
- app/membre/[id]/page.tsx : profil public membre
- app/connexion/page.tsx : connexion
- app/inscription/page.tsx : inscription avec prénom/email/ville
- app/supabase.ts : client Supabase
- components/FavorisBouton.tsx : bouton cœur
- components/AnnoncePhotos.tsx : galerie photos
- app/api/suggest-category/route.ts : route API suggestion catégorie IA (désactivée)

CE QUI EST FAIT :
- Navbar sticky avec états connecté/non connecté, menu déroulant Mon compte,
  icônes ✉️ 🔄 ❤️ + Déposer, mobile responsive avec 👤 seul
- Formulaire création annonce : Je propose/Je cherche, suggestion catégorie 
  par KEYWORDS_MAP massif (voitures, sport, électronique...), 
  catégorie souhaitée pour le matching, upload photos, géocodage
- Carte Google Maps : épingles vertes/oranges, popup, fix superposition spirale
- Matching par score : catégorie +40, sous-cat +30, retour +40+30, 
  même ville +20, ouvert propositions +10, modes inversés +20
- Page /decouvrir style Tinder : swipe like/pass, détection match mutuel
- Page /membre/[id] : profil public avec toutes les annonces du membre
- Prénom figé à l'inscription, récupéré automatiquement sur les annonces
- Badges 🎁 Propose / 🔍 Cherche sur les cards

BUGS CONNUS (pas critiques en dev, disparaissent en prod) :
- "Router action dispatched before initialization" → bug Turbopack local
- Sur back navigateur : carte grise et icônes disparaissent 
  → visibilitychange + mapKey implémenté mais partiel

CE QUI RESTE À FAIRE (par priorité) :

🔴 URGENT :
- Fix page /decouvrir : après swipe ❌ ou ✅ l'annonce suivante 
  ne s'affiche pas correctement
- Fix retour navigateur : carte et icônes qui disparaissent

🟠 SPRINT 2 — SOCIAL :
- Évaluations membres : table evaluations (user_id, membre_evalue_id, 
  annonce_id, note 1-5, commentaire), affichage étoiles sur profils et cards
- Notifications in-app : badge rouge sur ✉️ si nouveaux messages non lus

🟠 SPRINT 3 — GÉO & RECHERCHE :
- Géolocalisation automatique au chargement de la carte
- Slider rayon de recherche en km
- Recherche full-text Supabase (pas juste filtre client)

🟡 SPRINT 4 — MONÉTISATION :
- Page /abonnement avec Stripe (clés déjà dans .env.local)
- Mise en avant d'annonce (featured, payant)
- Statistiques annonce : nombre de vues, contacts reçus

🟡 SPRINT 5 — TECHNIQUE :
- PWA : manifest.json + Service Worker
- SEO : métadonnées dynamiques par annonce
- Images optimisées : compression avant upload, WebP
- Déploiement Vercel

💡 IDÉES V3 :
- Échanges triangulaires : A veut le truc de B, B celui de C, C celui de A
- Alertes email : nouvelle annonce dans ma catégorie favorite
- Système de points : récompenser l'activité
- Annonces similaires en bas de page détail
- Partage natif mobile WhatsApp/SMS
- Mode sombre

POINT D'ATTENTION :
- "use client" doit toujours être la première ligne des fichiers client
- Le <a dans les .map() a tendance à disparaître au copier-coller — vérifier
- Remove-Item -Recurse -Force .next pour vider le cache Next.js
- La clé ANTHROPIC_API_KEY dans .env.local est un placeholder à remplacer

Commence par fixer le bug de /decouvrir : après swipe l'annonce suivante 
ne s'affiche pas. Génère le fichier app/decouvrir/page.tsx complet.