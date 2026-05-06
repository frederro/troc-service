"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/app/supabase';
import { useRouter } from 'next/navigation';

type SelectedPhoto = {
  id: string;
  file: File;
  previewUrl: string;
};

function buildGeocodeAddress(localisation: string, codePostal: string, pays: string): string {
  return [localisation.trim(), codePostal.trim(), pays.trim()].filter(Boolean).join(', ');
}

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

const CATEGORIES = Object.keys(CATEGORIES_DATA);

type Suggestion = { categorie: string; sous_categorie: string };

const KEYWORDS_MAP: { keywords: string[]; categorie: string; sous_categorie: string }[] = [
  { keywords: ["robe", "jupe", "minijupe"], categorie: "Vêtements", sous_categorie: "Femme - Robes & jupes" },
  { keywords: ["soutien-gorge", "lingerie", "bralette", "culotte", "slip femme"], categorie: "Vêtements", sous_categorie: "Femme - Lingerie" },
  { keywords: ["bikini", "maillot de bain femme", "tankini"], categorie: "Vêtements", sous_categorie: "Femme - Maillots de bain" },
  { keywords: ["blouse", "top femme", "chemise femme", "tunique", "débardeur femme"], categorie: "Vêtements", sous_categorie: "Femme - Hauts" },
  { keywords: ["pantalon femme", "jean femme", "legging", "jegging"], categorie: "Vêtements", sous_categorie: "Femme - Bas" },
  { keywords: ["manteau femme", "veste femme", "parka femme", "imperméable femme", "trench"], categorie: "Vêtements", sous_categorie: "Femme - Vestes & manteaux" },
  { keywords: ["escarpins", "talons", "bottines femme", "ballerines", "sandales femme", "bottes femme"], categorie: "Vêtements", sous_categorie: "Femme - Chaussures" },
  { keywords: ["sac à main", "sac femme", "pochette", "bandoulière", "foulard", "ceinture femme"], categorie: "Vêtements", sous_categorie: "Femme - Accessoires" },
  { keywords: ["legging sport femme", "brassière", "tenue sport femme"], categorie: "Vêtements", sous_categorie: "Femme - Sport" },
  { keywords: ["chemise homme", "polo", "sweat homme", "t-shirt homme", "pull homme"], categorie: "Vêtements", sous_categorie: "Homme - Hauts" },
  { keywords: ["pantalon homme", "jean homme", "bermuda", "short homme", "chino"], categorie: "Vêtements", sous_categorie: "Homme - Bas" },
  { keywords: ["manteau homme", "veste homme", "doudoune", "blouson", "parka homme", "imperméable homme"], categorie: "Vêtements", sous_categorie: "Homme - Vestes & manteaux" },
  { keywords: ["baskets homme", "mocassins", "bottines homme", "derby", "chaussures homme", "boots homme"], categorie: "Vêtements", sous_categorie: "Homme - Chaussures" },
  { keywords: ["ceinture homme", "cravate", "chapeau homme", "bonnet", "écharpe", "sac homme"], categorie: "Vêtements", sous_categorie: "Homme - Accessoires" },
  { keywords: ["jogging homme", "survêtement", "maillot sport homme"], categorie: "Vêtements", sous_categorie: "Homme - Sport" },
  { keywords: ["vêtement enfant", "pull enfant", "t-shirt enfant", "sweat enfant"], categorie: "Vêtements", sous_categorie: "Enfant - Hauts" },
  { keywords: ["pantalon enfant", "jean enfant", "short enfant", "legging enfant"], categorie: "Vêtements", sous_categorie: "Enfant - Bas" },
  { keywords: ["manteau enfant", "anorak", "doudoune enfant", "veste enfant"], categorie: "Vêtements", sous_categorie: "Enfant - Vestes & manteaux" },
  { keywords: ["chaussures enfant", "baskets enfant", "sandales enfant", "bottes enfant"], categorie: "Vêtements", sous_categorie: "Enfant - Chaussures" },
  { keywords: ["body bébé", "grenouillère", "pyjama bébé", "combinaison bébé"], categorie: "Vêtements", sous_categorie: "Bébé - Combinaisons" },
  { keywords: ["chaussons bébé", "chaussures bébé"], categorie: "Vêtements", sous_categorie: "Bébé - Chaussures" },
  { keywords: ["pantalon bébé", "short bébé"], categorie: "Vêtements", sous_categorie: "Bébé - Bas" },
  { keywords: ["gilet bébé", "pull bébé", "t-shirt bébé"], categorie: "Vêtements", sous_categorie: "Bébé - Hauts" },
  { keywords: ["canapé", "sofa", "fauteuil", "meuble", "déco", "lampe", "tapis", "table", "chaise", "bureau", "étagère", "armoire", "commode", "buffet", "miroir", "tableau", "vase", "bougie déco", "coussin", "rideau"], categorie: "Objets & matériel", sous_categorie: "Maison & déco" },
  { keywords: ["téléphone", "smartphone", "iphone", "samsung", "huawei", "pixel", "ordinateur", "laptop", "pc portable", "macbook", "imac", "tablette", "ipad", "tv", "télévision", "écran", "moniteur", "console", "playstation", "xbox", "nintendo", "switch", "casque audio", "enceinte", "airpods", "montre connectée", "gopro", "drone", "appareil photo", "reflex", "objectif", "câble", "chargeur", "souris", "clavier"], categorie: "Objets & matériel", sous_categorie: "Électronique" },
  { keywords: ["lave-linge", "machine à laver", "réfrigérateur", "frigo", "congélateur", "aspirateur", "four", "micro-onde", "cafetière", "expresso", "robot cuisine", "thermomix", "blender", "mixeur", "grille-pain", "bouilloire", "sèche-linge", "lave-vaisselle", "climatiseur", "radiateur", "ventilateur", "fer à repasser"], categorie: "Objets & matériel", sous_categorie: "Électroménager" },
  { keywords: ["vélo", "vtt", "vélo route", "trottinette", "ski", "snowboard", "surf", "planche", "tente", "sac de couchage", "randonnée", "fitness", "musculation", "haltères", "vélo elliptique", "tapis de course", "pêche", "canne à pêche", "kayak", "paddle", "rollers", "skate", "golf", "tennis", "raquette", "football", "ballon", "rugby", "basket", "natation", "boxe", "yoga", "tapis yoga"], categorie: "Objets & matériel", sous_categorie: "Sport & loisirs" },
  { keywords: ["livre", "roman", "bd", "bande dessinée", "manga", "magazine", "revue", "comic", "atlas", "dictionnaire", "encyclopédie", "guide", "cuisine livre", "autobiographie", "biographie"], categorie: "Objets & matériel", sous_categorie: "Livres, BD & magazines" },
  { keywords: ["tondeuse", "perceuse", "visseuse", "scie", "ponceuse", "meuleuse", "outil", "jardinière", "pot de fleur", "arrosoir", "tuyau arrosage", "brouette", "pelle", "râteau", "taille-haie", "débroussailleuse", "souffleur", "composteur", "abri jardin", "barbecue", "plancha", "parasol", "salon de jardin", "hamac"], categorie: "Objets & matériel", sous_categorie: "Jardin & bricolage" },
  { keywords: ["voiture", "auto", "porsche", "ferrari", "bmw", "mercedes", "audi", "renault", "peugeot", "citroën", "volkswagen", "ford", "toyota", "honda", "nissan", "hyundai", "kia", "fiat", "seat", "opel", "moto", "scooter", "mobylette", "quad", "camping-car", "caravane", "remorque", "vélo électrique", "trottinette électrique", "voiture électrique", "pièces auto", "jantes", "pneus"], categorie: "Objets & matériel", sous_categorie: "Véhicules & accessoires" },
  { keywords: ["guitare", "guitare électrique", "guitare acoustique", "basse", "piano", "clavier", "violon", "violoncelle", "trompette", "saxophone", "flûte", "batterie", "ampli", "pédale effet", "microphone", "table de mixage", "synthétiseur", "ukulélé", "harmonica", "accordéon", "instrument"], categorie: "Objets & matériel", sous_categorie: "Musique" },
  { keywords: ["poussette", "lit bébé", "siège auto", "chaise haute", "transat", "baby phone", "parc bébé", "tapis éveil", "porteur", "rehausseur", "couffin", "landau", "porte-bébé", "mouche-bébé", "baignoire bébé"], categorie: "Objets & matériel", sous_categorie: "Bébé & puériculture" },
  { keywords: ["bateau", "voilier", "jet-ski", "moteur bateau", "annexe", "kayak mer", "zodiac", "catamaran"], categorie: "Objets & matériel", sous_categorie: "Bateaux & nautisme" },
  { keywords: ["bricolage", "plomberie", "électricité", "carrelage", "peinture maison", "menuiserie", "serrurerie", "réparation", "dépannage", "installation"], categorie: "Services", sous_categorie: "Bricolage & réparation" },
  { keywords: ["jardinage", "tonte", "taille", "haie", "pelouse", "élagage", "désherbage", "plantation", "arrosage"], categorie: "Services", sous_categorie: "Jardinage & espaces verts" },
  { keywords: ["déménagement", "transport", "livraison", "camion", "débarras"], categorie: "Services", sous_categorie: "Déménagement & transport" },
  { keywords: ["massage", "coiffure", "coupe cheveux", "soin visage", "manucure", "pédicure", "yoga", "méditation", "ostéopathie", "naturopathie", "esthétique", "maquillage"], categorie: "Services", sous_categorie: "Soin & bien-être" },
  { keywords: ["garde enfant", "baby-sitting", "babysitter", "garde animaux", "pet-sitting", "promenade chien", "garde plantes"], categorie: "Services", sous_categorie: "Garde enfants, animaux, plantes" },
  { keywords: ["cours", "soutien scolaire", "tutorat", "formation", "leçon", "coaching", "apprentissage"], categorie: "Services", sous_categorie: "Cours & transmission présentiel" },
  { keywords: ["cours en ligne", "visio", "e-learning", "formation distanciel", "coaching en ligne"], categorie: "Services", sous_categorie: "Cours & transmission distanciel" },
  { keywords: ["rangement", "débarras", "vider cave", "vider grenier", "tri"], categorie: "Coups de main", sous_categorie: "Rangement & vide" },
  { keywords: ["nettoyage", "ménage", "vitres", "nettoyage voiture", "lavage"], categorie: "Coups de main", sous_categorie: "Nettoyage" },
  { keywords: ["monter meuble", "accrocher", "ampoule", "petite réparation", "aide maison"], categorie: "Coups de main", sous_categorie: "Aide maison" },
  { keywords: ["courses", "supermarché", "pharmacie", "commissions"], categorie: "Coups de main", sous_categorie: "Courses & commissions" },
  { keywords: ["déchetterie", "encombrants", "gravats"], categorie: "Coups de main", sous_categorie: "Déchetterie & encombrants" },
  { keywords: ["formulaire", "administratif", "imprimer", "papiers", "déclaration"], categorie: "Coups de main", sous_categorie: "Aide administrative" },
  { keywords: ["accompagner", "médecin", "promenade", "compagnie", "sortie"], categorie: "Coups de main", sous_categorie: "Compagnie & sorties" },
  { keywords: ["gâteau", "tarte", "confiture", "miel", "pâtisserie", "pain", "brioche", "cookie", "cake", "brownie", "macarons", "crêpe", "quiche"], categorie: "Alimentation & fait-maison", sous_categorie: "Cuisine & pâtisserie" },
  { keywords: ["légumes", "fruits", "herbes", "œufs", "graines", "plantes aromatiques", "tomates", "courgettes", "salade", "pommes", "fraises", "noix"], categorie: "Alimentation & fait-maison", sous_categorie: "Du jardin & de la nature" },
  { keywords: ["bière", "cidre", "limonade", "kombucha", "sirop", "jus", "vin maison", "eau de vie", "liqueur"], categorie: "Alimentation & fait-maison", sous_categorie: "Boissons artisanales" },
  { keywords: ["bio", "vegan", "végétarien", "sans gluten", "sans lactose", "halal", "casher", "cru", "fermenté"], categorie: "Alimentation & fait-maison", sous_categorie: "Régimes & spécialités" },
  { keywords: ["duplo", "briques lego", "lego city", "lego technic", "lego star wars"], categorie: "Jeux & Jouets enfant", sous_categorie: "Lego & briques" },
  { keywords: ["playmobil"], categorie: "Jeux & Jouets enfant", sous_categorie: "Playmobil" },
  { keywords: ["poupée", "barbie", "figurine enfant", "action figure"], categorie: "Jeux & Jouets enfant", sous_categorie: "Figurines & poupées" },
  { keywords: ["monopoly", "puzzle enfant", "jeu société enfant", "uno", "memory", "trivial pursuit junior"], categorie: "Jeux & Jouets enfant", sous_categorie: "Jeux de société enfant" },
  { keywords: ["jeu vidéo enfant", "nintendo junior", "tablette enfant", "leapfrog"], categorie: "Jeux & Jouets enfant", sous_categorie: "Jeux vidéo enfant" },
  { keywords: ["peluche", "doudou", "nounours", "lapin peluche", "ours peluche"], categorie: "Jeux & Jouets enfant", sous_categorie: "Peluches & doudous" },
  { keywords: ["lego vintage", "lego ancien", "lego rare", "lego 80s", "lego 90s"], categorie: "Collections & passions", sous_categorie: "Lego vintage & sets rares" },
  { keywords: ["funko pop", "funko", "marvel figurine", "star wars figurine", "dragon ball figurine", "one piece figurine", "naruto figurine", "disney figurine"], categorie: "Collections & passions", sous_categorie: "Figurines de collection" },
  { keywords: ["pokémon", "carte pokemon", "magic the gathering", "yu-gi-oh", "one piece carte", "dragon ball carte"], categorie: "Collections & passions", sous_categorie: "Cartes à collectionner" },
  { keywords: ["super nintendo", "snes", "megadrive", "gameboy", "ps1", "playstation 1", "ps2", "n64", "nintendo 64", "atari", "dreamcast", "game gear"], categorie: "Collections & passions", sous_categorie: "Jeux vidéo rétro" },
  { keywords: ["dnd", "donjons dragons", "pathfinder", "jeu de rôle", "warhammer", "jdr"], categorie: "Collections & passions", sous_categorie: "Jeux de rôle" },
  { keywords: ["timbre", "philatélie", "collection timbre"], categorie: "Collections & passions", sous_categorie: "Timbres & philatélie" },
  { keywords: ["montre", "montre ancienne", "horlogerie", "rolex", "seiko", "omega", "casio vintage"], categorie: "Collections & passions", sous_categorie: "Montres & horlogerie" },
  { keywords: ["vinyle", "disque vinyle", "33 tours", "45 tours", "platine vinyle", "album vinyle"], categorie: "Collections & passions", sous_categorie: "Vinyles & musique" },
  { keywords: ["tarot", "oracle", "carte oracle", "tarot marseille"], categorie: "Collections & passions", sous_categorie: "Tarots & oracles" },
  { keywords: ["maquette", "miniature", "modélisme", "train miniature", "voiture miniature", "figurine militaire"], categorie: "Collections & passions", sous_categorie: "Modélisme & miniatures" },
  { keywords: ["affiche vintage", "poster vintage", "affiche ancienne", "publicité ancienne"], categorie: "Collections & passions", sous_categorie: "Affiches & posters vintage" },
  { keywords: ["carte postale", "carte postale ancienne", "cpa"], categorie: "Collections & passions", sous_categorie: "Cartes postales anciennes" },
  { keywords: ["bijou fait main", "bracelet fait main", "collier fait main", "bague fait main", "boucles oreilles"], categorie: "Artisanat & création", sous_categorie: "Bijoux & accessoires faits main" },
  { keywords: ["couture", "tissu", "tricot", "broderie", "crochet", "patron couture", "laine", "mercerie"], categorie: "Artisanat & création", sous_categorie: "Textile & couture" },
  { keywords: ["bois", "menuiserie", "sculpture bois", "objet bois", "planche bois"], categorie: "Artisanat & création", sous_categorie: "Bois & menuiserie" },
  { keywords: ["métal", "ferronnerie", "soudure", "forge", "objet métal"], categorie: "Artisanat & création", sous_categorie: "Métal & ferronnerie" },
  { keywords: ["céramique", "poterie", "argile", "faïence", "grès", "porcelaine"], categorie: "Artisanat & création", sous_categorie: "Céramique & poterie" },
  { keywords: ["peinture", "aquarelle", "illustration", "dessin", "tableau peint", "acrylique", "huile", "gouache", "pastel"], categorie: "Artisanat & création", sous_categorie: "Peinture, dessin & illustration" },
  { keywords: ["impression 3d", "imprimante 3d", "filament 3d", "objet imprimé 3d"], categorie: "Artisanat & création", sous_categorie: "Impression 3D" },
  { keywords: ["bougie", "savon fait main", "cosmétique naturel", "baume", "huile essentielle", "lotion"], categorie: "Artisanat & création", sous_categorie: "Bougies, savons & cosmétiques naturels" },
  { keywords: ["logo", "graphisme", "design graphique", "charte graphique", "identité visuelle", "affiche", "flyer", "infographie"], categorie: "Compétences numériques", sous_categorie: "Graphisme & design" },
  { keywords: ["développement", "site web", "application", "programmation", "code", "javascript", "python", "react", "wordpress", "shopify", "application mobile"], categorie: "Compétences numériques", sous_categorie: "Développement & code" },
  { keywords: ["rédaction", "traduction", "copywriting", "article", "blog", "seo", "texte", "contenu"], categorie: "Compétences numériques", sous_categorie: "Rédaction & traduction" },
  { keywords: ["montage vidéo", "photographie", "retouche photo", "lightroom", "photoshop", "vidéo", "clip", "reportage", "shooting"], categorie: "Compétences numériques", sous_categorie: "Photo & vidéo" },
  { keywords: ["mixage", "mastering", "composition musicale", "son", "podcast", "enregistrement", "studio", "beat"], categorie: "Compétences numériques", sous_categorie: "Musique & son" },
  { keywords: ["réseaux sociaux", "instagram", "tiktok", "community manager", "facebook", "linkedin", "youtube", "communication digitale"], categorie: "Compétences numériques", sous_categorie: "Réseaux sociaux & communication" },
  { keywords: ["chambre", "logement", "hébergement", "loger", "dormir", "séjour", "coloc", "maison contre", "studio contre", "accueil"], categorie: "Hébergement & accueil", sous_categorie: "Chambre contre services" },
  { keywords: ["travaux contre", "rénover", "rénovation contre", "peinture contre"], categorie: "Hébergement & accueil", sous_categorie: "Logement contre travaux" },
  { keywords: ["nourri logé", "nourri hébergé", "logé nourri"], categorie: "Hébergement & accueil", sous_categorie: "Séjour contre compétences" },
];

function getSuggestions(titre: string): Suggestion[] {
  if (!titre || titre.trim().length < 3) return [];
  const lower = titre.toLowerCase();
  const results: Suggestion[] = [];
  const seen = new Set<string>();
  for (const entry of KEYWORDS_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        const key = `${entry.categorie}||${entry.sous_categorie}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ categorie: entry.categorie, sous_categorie: entry.sous_categorie });
        }
        break;
      }
    }
  }
  return results.slice(0, 4);
}

export default function CreerAnnonce() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);
  const [profileVille, setProfileVille] = useState("");
  const [profileCodePostal, setProfileCodePostal] = useState("");
  const [profilePays, setProfilePays] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [latitude, setLatitude] = useState(48.8566);
  const [longitude, setLongitude] = useState(2.3522);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const selectedPhotosRef = useRef<SelectedPhoto[]>([]);
  const [mode, setMode] = useState<'propose' | 'cherche'>('propose');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [tailleAnnonce, setTailleAnnonce] = useState<string>("");

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: CATEGORIES[0],
    sous_categorie: '',
    echange_souhaite: '',
    categorie_souhaitee: '',
    sous_categorie_souhaitee: '',
    membre_nom: '',
    ouvert_propositions: false,
  });

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const [suggestionsEchange, setSuggestionsEchange] = useState<Suggestion[]>([]);
  const [suggestionEchangeDismissed, setSuggestionEchangeDismissed] = useState(false);

  const sousCategoriesDisponibles = CATEGORIES_DATA[formData.categorie] || [];
  const sousCategoriesSouhaitees = CATEGORIES_DATA[formData.categorie_souhaitee] || [];

  const photoFiles = useMemo(() => selectedPhotos.map((p) => p.file), [selectedPhotos]);

  const tailleKind = useMemo(() => {
    const s = `${formData.categorie} ${formData.sous_categorie}`.toLowerCase();
    const keywords = ["vêtement", "vêtements", "mode", "haut", "bas", "chaussure", "chaussures", "accessoire", "accessoires"];
    const isRelevant = keywords.some((k) => s.includes(k));
    if (!isRelevant) return null as null | "haut" | "bas" | "chaussure" | "accessoire";
    if (s.includes("chaussure")) return "chaussure";
    if (s.includes("haut")) return "haut";
    if (s.includes("bas")) return "bas";
    if (s.includes("accessoire")) return "accessoire";
    if (s.includes("vêtement") || s.includes("mode")) {
      // fallback for vêtements/mode without explicit sous-type
      return "haut";
    }
    return null;
  }, [formData.categorie, formData.sous_categorie]);

  const tailleOptions = useMemo(() => {
    if (!tailleKind) return null as null | { label: string; groups?: { label: string; options: string[] }[]; options?: string[] };

    if (tailleKind === "haut") {
      return { label: "Taille (haut)", options: ["XS", "S", "M", "L", "XL", "XXL", "3XL"] };
    }

    if (tailleKind === "bas") {
      const fr = ["34", "36", "38", "40", "42", "44", "46", "48"].map((v) => `FR ${v}`);
      const us = ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "36", "38"].map((v) => `US ${v}`);
      return {
        label: "Taille (bas)",
        groups: [
          { label: "Tailles FR", options: fr },
          { label: "Tailles US", options: us },
        ],
      };
    }

    if (tailleKind === "chaussure") {
      const eu: string[] = [];
      for (let x = 36; x <= 46 + 1e-9; x += 0.5) eu.push(`EU ${Number.isInteger(x) ? String(x) : x.toFixed(1)}`);
      const us: string[] = [];
      for (let x = 4; x <= 13 + 1e-9; x += 0.5) us.push(`US ${Number.isInteger(x) ? String(x) : x.toFixed(1)}`);
      return {
        label: "Pointure",
        groups: [
          { label: "Pointures EU", options: eu },
          { label: "Pointures US", options: us },
        ],
      };
    }

    return { label: "Taille", options: ["Unique"] };
  }, [tailleKind]);

  useEffect(() => {
    if (!tailleKind && tailleAnnonce) setTailleAnnonce("");
  }, [tailleKind, tailleAnnonce]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setGeoLoading(true);
      const { data } = await supabase.auth.getUser();
      const user = data?.user ?? null;
      if (!user) {
        router.replace('/connexion');
        return;
      }

      const prenom = (user.user_metadata?.prenom as string | undefined) || "";
      const ville = (user.user_metadata?.ville as string | undefined)?.trim() || "";
      const code_postal = (user.user_metadata?.code_postal as string | undefined)?.trim() || "";
      const pays = (user.user_metadata?.pays as string | undefined)?.trim() || "France";

      const loc = [ville, code_postal].filter(Boolean).join(" ");
      if (!cancelled) {
        setFormData((prev) => ({ ...prev, membre_nom: prenom }));
        setProfileVille(ville);
        setProfileCodePostal(code_postal);
        setProfilePays(pays);
        setLocalisation(loc);
      }

      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const addressQuery = buildGeocodeAddress(ville, code_postal, pays);
      const defaultLat = 48.8566;
      const defaultLng = 2.3522;
      if (key && addressQuery.replace(/[,\s]/g, "").length > 0) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const geoRes = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressQuery)}&key=${key}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);
          const geoData = await geoRes.json();
          const loc0 = geoData.results?.[0]?.geometry?.location;
          if (!cancelled && loc0?.lat != null && loc0?.lng != null) {
            setLatitude(loc0.lat);
            setLongitude(loc0.lng);
          } else if (!cancelled) {
            setLatitude(defaultLat);
            setLongitude(defaultLng);
          }
        } catch {
          if (!cancelled) {
            setLatitude(defaultLat);
            setLongitude(defaultLng);
          }
        } finally {
          clearTimeout(timeoutId);
        }
      }
      if (!cancelled) setGeoLoading(false);
    })();

    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => { selectedPhotosRef.current = selectedPhotos; }, [selectedPhotos]);
  useEffect(() => {
    return () => { for (const p of selectedPhotosRef.current) URL.revokeObjectURL(p.previewUrl); };
  }, []);

  useEffect(() => {
    setSuggestionDismissed(false);
    const timer = setTimeout(() => { setSuggestions(getSuggestions(formData.titre)); }, 400);
    return () => clearTimeout(timer);
  }, [formData.titre]);

  useEffect(() => {
    setSuggestionEchangeDismissed(false);
    const timer = setTimeout(() => { setSuggestionsEchange(getSuggestions(formData.echange_souhaite)); }, 400);
    return () => clearTimeout(timer);
  }, [formData.echange_souhaite]);

  const applySuggestion = (s: Suggestion) => {
    setFormData((prev) => ({ ...prev, categorie: s.categorie, sous_categorie: s.sous_categorie }));
    setSuggestionDismissed(true);
  };

  const applySuggestionEchange = (s: Suggestion) => {
    setFormData((prev) => ({ ...prev, categorie_souhaitee: s.categorie, sous_categorie_souhaitee: s.sous_categorie }));
    setSuggestionEchangeDismissed(true);
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files || []);
    if (incoming.length === 0) return;
    setSelectedPhotos((prev) => {
      const remaining = Math.max(0, 3 - prev.length);
      const next = incoming.slice(0, remaining).map((file) => ({
        id: `${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...next].slice(0, 3);
    });
    e.currentTarget.value = '';
  };

  const removePhoto = (id: string) => {
    setSelectedPhotos((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (toRemove) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploadError(null);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user ?? null;
      if (!user) {
        router.replace('/connexion');
        return;
      }
      const user_id = user.id;

      // Test accès bucket
      try {
        const { error: bucketAccessError } = await supabase.storage.from('annonces-photos').list('', { limit: 1 });
        if (bucketAccessError) {
          const msg = `Bucket inaccessible: ${bucketAccessError.message} | code: ${(bucketAccessError as any).statusCode} | details: ${JSON.stringify(bucketAccessError)}`;
          console.error('STORAGE BUCKET ERROR:', msg);
          setUploadError(msg);
          alert(`Erreur bucket: ${msg}`);
          setLoading(false);
          return;
        }
      } catch (bucketErr: any) {
        const msg = `Bucket exception: ${bucketErr?.message || JSON.stringify(bucketErr)}`;
        console.error('STORAGE BUCKET EXCEPTION:', msg);
        setUploadError(msg);
        alert(msg);
        setLoading(false);
        return;
      }

      const paysValue = profilePays.trim() || "France";
      const codePostalValue = profileCodePostal.trim() || null;
      const localisationValue = localisation.trim() || [profileVille, profileCodePostal].filter(Boolean).join(" ");

      const { data: inserted, error: insertError } = await supabase
        .from('annonces')
        .insert([{
          titre: formData.titre,
          description: formData.description,
          categorie: formData.categorie,
          sous_categorie: formData.sous_categorie,
          localisation: localisationValue,
          pays: paysValue,
          code_postal: codePostalValue,
          echange_souhaite: formData.echange_souhaite,
          categorie_souhaitee: formData.categorie_souhaitee || null,
          sous_categorie_souhaitee: formData.sous_categorie_souhaitee || null,
          membre_nom: formData.membre_nom,
          ouvert_propositions: formData.ouvert_propositions,
          latitude,
          longitude,
          photos: [],
          taille: tailleAnnonce && tailleAnnonce.trim() ? tailleAnnonce.trim() : null,
          user_id,
          mode,
        }])
        .select('id')
        .single();

      if (insertError) {
        const msg = `Insert failed: ${insertError.message} | code: ${(insertError as any).code} | details: ${JSON.stringify(insertError)}`;
        console.error('INSERT ERROR:', msg);
        alert(`Erreur création annonce: ${msg}`);
        setLoading(false);
        return;
      }

      const annonceId = inserted?.id;
      const photoUrls: string[] = [];

      if (annonceId && photoFiles.length > 0) {
        for (const file of photoFiles) {
          const safeName = file.name.replace(/[^\w.\-]+/g, '_');
          const path = `${annonceId}/${Date.now()}-${safeName}`;

          try {
            console.log(`Uploading: ${path}, size: ${file.size}, type: ${file.type}`);
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('annonces-photos')
              .upload(path, file, { upsert: false });

            if (uploadError) {
              const errMsg = `Upload failed for ${file.name}: ${uploadError.message} | statusCode: ${(uploadError as any).statusCode} | error: ${(uploadError as any).error} | details: ${JSON.stringify(uploadError)}`;
              console.error('STORAGE ERROR:', errMsg);
              setUploadError(errMsg);
              alert(`Erreur upload photo: ${errMsg}`);
              setLoading(false);
              return;
            }

            console.log('Upload success:', uploadData);
            const { data: publicUrlData } = supabase.storage.from('annonces-photos').getPublicUrl(path);
            if (publicUrlData?.publicUrl) photoUrls.push(publicUrlData.publicUrl);

          } catch (uploadException: any) {
            const errMsg = `Upload exception for ${file.name}: ${uploadException?.message || JSON.stringify(uploadException)}`;
            console.error('STORAGE EXCEPTION:', errMsg);
            setUploadError(errMsg);
            alert(`Exception upload: ${errMsg}`);
            setLoading(false);
            return;
          }
        }

        try {
          const { error: updateError } = await supabase
            .from('annonces')
            .update({ photos: photoUrls })
            .eq('id', annonceId);

          if (updateError) {
            const errMsg = `Update photos failed: ${updateError.message} | ${JSON.stringify(updateError)}`;
            console.error('UPDATE PHOTOS ERROR:', errMsg);
            alert(`Erreur mise à jour photos: ${errMsg}`);
            setLoading(false);
            return;
          }
        } catch (updateException: any) {
          const errMsg = `Update exception: ${updateException?.message || JSON.stringify(updateException)}`;
          console.error('UPDATE EXCEPTION:', errMsg);
          alert(errMsg);
          setLoading(false);
          return;
        }
      }

      router.push('/');

    } catch (err: any) {
      const errMsg = `Erreur générale: ${err?.message || JSON.stringify(err)}`;
      console.error('GENERAL ERROR:', errMsg);
      setUploadError(errMsg);
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = suggestions.length > 0 && !suggestionDismissed && formData.titre.length >= 3;
  const showSuggestionsEchange = suggestionsEchange.length > 0 && !suggestionEchangeDismissed && formData.echange_souhaite.length >= 3;
  const locationDisplayPays = profilePays || "—";
  const locationDisplayVille = profileVille || "—";

  return (
    <main className="createRoot" style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: '26px', color: '#1D9E75', marginBottom: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>Déposer une annonce</h1>

      {uploadError && (
        <div style={{ marginBottom: '20px', padding: '14px 16px', background: '#fff3ee', border: '1px solid #E8622A', borderRadius: '10px', fontSize: '13px', color: '#c0392b', wordBreak: 'break-all' }}>
          <strong>Erreur détectée :</strong> {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

        {/* MODE */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <button type="button" onClick={() => setMode('propose')}
              style={{ padding: '16px 14px', borderRadius: '12px', border: `1px solid ${mode === 'propose' ? '#1D9E75' : '#ddd'}`, background: mode === 'propose' ? '#1D9E75' : 'white', color: mode === 'propose' ? 'white' : '#333', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>
              🎁 Je propose
            </button>
            <button type="button" onClick={() => setMode('cherche')}
              style={{ padding: '16px 14px', borderRadius: '12px', border: `1px solid ${mode === 'cherche' ? '#1D9E75' : '#ddd'}`, background: mode === 'cherche' ? '#1D9E75' : 'white', color: mode === 'cherche' ? 'white' : '#333', cursor: 'pointer', fontSize: '16px', fontWeight: 700 }}>
              🔍 Je cherche
            </button>
          </div>
          <div style={{ marginTop: '14px', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>
            {mode === 'propose'
              ? "Votre annonce décrit ce que vous proposez et ce que vous souhaitez en retour."
              : "Votre annonce décrit ce que vous cherchez et ce que vous pouvez offrir en échange."}
          </div>
        </div>

        {/* TITRE */}
        <div>
          <input
            required
            value={formData.titre}
            aria-label={mode === 'propose' ? "Titre — qu'est-ce que vous proposez ?" : "Titre — que cherchez-vous ?"}
            placeholder={mode === 'propose' ? "Qu'est-ce que vous proposez ?" : "Que cherchez-vous ?"}
            style={{ width: '100%', padding: '16px 16px', borderRadius: '12px', border: '1px solid #e0e0e0', boxSizing: 'border-box', fontSize: '16px', background: '#fafafa' }}
            onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          />
          {showSuggestions && (
            <div style={{ marginTop: '10px', padding: '12px', background: '#E1F5EE', borderRadius: '8px', border: '1px solid #9FE1CB' }}>
              <div style={{ fontSize: '13px', color: '#0F6E56', fontWeight: '500', marginBottom: '8px' }}>💡 Catégorie suggérée :</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => applySuggestion(s)}
                    style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #1D9E75', background: 'white', color: '#0F6E56', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                    {s.categorie} › {s.sous_categorie}
                  </button>
                ))}
                <button type="button" onClick={() => setSuggestionDismissed(true)}
                  style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #ccc', background: 'white', color: '#999', cursor: 'pointer', fontSize: '12px' }}>
                  ✕ Ignorer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CATÉGORIE */}
        <div>
          <div className="rowTwoCols" style={{ display: 'flex', gap: '14px' }}>
            <div style={{ flex: 1 }}>
              <select value={formData.categorie} aria-label="Catégorie"
                style={{ width: '100%', padding: '14px 12px', borderRadius: '12px', border: '1px solid #e0e0e0', background: 'white', fontSize: '14px' }}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value, sous_categorie: '' })}>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <select value={formData.sous_categorie} aria-label="Sous-catégorie"
                style={{ width: '100%', padding: '14px 12px', borderRadius: '12px', border: '1px solid #e0e0e0', background: 'white', fontSize: '14px' }}
                onChange={(e) => setFormData({ ...formData, sous_categorie: e.target.value })}>
                <option value="">Sous-catégorie</option>
                {sousCategoriesDisponibles.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
          </div>
          {formData.sous_categorie && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#0F6E56' }}>
              ✓ <strong>{formData.categorie}</strong> › {formData.sous_categorie}
            </div>
          )}
        </div>

        {/* TAILLE (optionnel) */}
        {tailleOptions && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#444' }}>
              Taille <span style={{ fontSize: '12px', fontWeight: 700, color: '#999' }}>(optionnel)</span>
            </label>
            <select
              value={tailleAnnonce}
              aria-label="Taille (optionnel)"
              onChange={(e) => setTailleAnnonce(e.target.value)}
              style={{ width: '100%', padding: '14px 12px', borderRadius: '12px', border: '1px solid #e0e0e0', background: 'white', fontSize: '14px' }}
            >
              <option value="">—</option>
              {tailleOptions.groups
                ? tailleOptions.groups.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </optgroup>
                  ))
                : (tailleOptions.options || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
            </select>
          </div>
        )}

        {/* LOCALISATION */}
        <div style={{ padding: '18px 20px', borderRadius: '14px', border: '1px solid #cdeee3', background: '#f8fcfa' }}>
          <div style={{ fontSize: '14px', color: '#333', lineHeight: 1.5 }}>
            {geoLoading ? (
              <span style={{ color: '#666' }}>Chargement de votre localisation…</span>
            ) : (
              <>📍 Votre localisation : <strong>{locationDisplayVille}</strong>, <strong>{locationDisplayPays}</strong></>
            )}
          </div>
          <div style={{ marginTop: '10px', fontSize: '13px' }}>
            <a href="/profil" style={{ color: '#1D9E75', fontWeight: 600, textDecoration: 'none' }}>(modifier dans mon profil)</a>
          </div>
          {!geoLoading && (!profileVille || !profilePays) && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#b45309', lineHeight: 1.45 }}>
              Complétez votre ville et votre pays dans votre profil pour un meilleur positionnement sur la carte.
            </div>
          )}
        </div>

        {/* DESCRIPTION */}
        <div>
          <textarea
            aria-label="Description de l'annonce"
            placeholder="Décrivez l'annonce : état, dimensions, disponibilité…"
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid #e0e0e0', minHeight: '120px', boxSizing: 'border-box', fontSize: '15px', lineHeight: 1.55, resize: 'vertical' }}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        {/* ÉCHANGE SOUHAITÉ */}
        <div style={{ background: '#f7faf9', borderRadius: '16px', padding: '22px 22px 20px', border: '1px solid #e8efec' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: '#0F6E56', letterSpacing: '-0.01em' }}>
            🔄 {mode === 'propose' ? 'Ce que je souhaite en échange' : "Ce que j'ai à offrir en échange"}
          </div>

          <div style={{ marginBottom: '22px' }}>
            <input
              value={formData.echange_souhaite}
              aria-label={mode === 'propose' ? "Contre quoi souhaitez-vous échanger ?" : "Qu'avez-vous à offrir en échange ?"}
              placeholder={mode === 'propose' ? "Contre quoi souhaitez-vous l'échanger ?" : "Qu'avez-vous à offrir en échange ?"}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e0e0e0', boxSizing: 'border-box', fontSize: '15px', background: '#fff' }}
              onChange={(e) => setFormData({ ...formData, echange_souhaite: e.target.value })}
            />
            {showSuggestionsEchange && (
              <div style={{ marginTop: '10px', padding: '12px', background: '#E1F5EE', borderRadius: '8px', border: '1px solid #9FE1CB' }}>
                <div style={{ fontSize: '13px', color: '#0F6E56', fontWeight: '500', marginBottom: '8px' }}>💡 Catégorie suggérée :</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {suggestionsEchange.map((s, i) => (
                    <button key={i} type="button" onClick={() => applySuggestionEchange(s)}
                      style={{ padding: '5px 12px', borderRadius: '20px', border: '1px solid #1D9E75', background: 'white', color: '#0F6E56', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>
                      {s.categorie} › {s.sous_categorie}
                    </button>
                  ))}
                  <button type="button" onClick={() => setSuggestionEchangeDismissed(true)}
                    style={{ padding: '5px 10px', borderRadius: '20px', border: '1px solid #ccc', background: 'white', color: '#999', cursor: 'pointer', fontSize: '12px' }}>
                    ✕ Ignorer
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rowTwoCols" style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
            <div style={{ flex: 1 }}>
              <select value={formData.categorie_souhaitee}
                aria-label={mode === 'propose' ? 'Catégorie souhaitée (matching)' : 'Catégorie offerte (matching)'}
                style={{ width: '100%', padding: '14px 12px', borderRadius: '12px', border: '1px solid #e0e0e0', background: 'white', fontSize: '14px' }}
                onChange={(e) => setFormData({ ...formData, categorie_souhaitee: e.target.value, sous_categorie_souhaitee: '' })}>
                <option value="">{mode === 'propose' ? 'Catégorie souhaitée' : 'Catégorie offerte'}</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <select value={formData.sous_categorie_souhaitee}
                aria-label={mode === 'propose' ? 'Sous-catégorie souhaitée' : 'Sous-catégorie offerte'}
                style={{ width: '100%', padding: '14px 12px', borderRadius: '12px', border: '1px solid #e0e0e0', background: 'white', fontSize: '14px' }}
                onChange={(e) => setFormData({ ...formData, sous_categorie_souhaitee: e.target.value })}
                disabled={!formData.categorie_souhaitee}>
                <option value="">Sous-catégorie</option>
                {sousCategoriesSouhaitees.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
              </select>
            </div>
          </div>
          {formData.categorie_souhaitee && (
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#0F6E56' }}>
              ✓ <strong>{formData.categorie_souhaitee}</strong>{formData.sous_categorie_souhaitee ? ` › ${formData.sous_categorie_souhaitee}` : ''}
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '22px', cursor: 'pointer' }}>
            <input type="checkbox" checked={formData.ouvert_propositions}
              onChange={(e) => setFormData({ ...formData, ouvert_propositions: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: '#1D9E75', cursor: 'pointer' }} />
            <span style={{ fontSize: '14px', color: '#444' }}>Ouvert à toute autre proposition</span>
          </label>
        </div>

        {/* PHOTOS */}
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleAddPhotos}
            aria-label="Ajouter des photos d'annonce, maximum 3" style={{ display: 'none' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
            {selectedPhotos.map((p) => (
              <div key={p.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', background: '#fafafa', height: '110px' }}>
                <img src={p.previewUrl} alt="Prévisualisation" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <button type="button" onClick={() => removePhoto(p.id)}
                  style={{ position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.55)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  ×
                </button>
              </div>
            ))}
            {selectedPhotos.length < 3 && (
              <button type="button" onClick={() => fileInputRef.current?.click()}
                style={{ height: '110px', borderRadius: '12px', border: '1px dashed #1D9E75', background: '#E1F5EE', color: '#0F6E56', cursor: 'pointer', fontSize: '28px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                +
              </button>
            )}
          </div>
          <div style={{ marginTop: '14px', fontSize: '13px', color: '#888' }}>
            {selectedPhotos.length === 0 ? 'Photos optionnelles — jusqu\'à 3 images.' : `${selectedPhotos.length} / 3 photo(s).`}
          </div>
        </div>

        <button disabled={loading} type="submit"
          style={{ marginTop: '8px', padding: '16px 20px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 2px 12px rgba(29, 158, 117, 0.25)' }}>
          {loading ? 'Publication...' : 'Publier mon annonce'}
        </button>
      </form>

      <style jsx>{`
        @media (max-width: 768px) {
          .createRoot { padding: 24px 16px !important; }
          .rowTwoCols { flex-direction: column; gap: 8px !important; }
        }
      `}</style>
    </main>
  );
}