import { NextRequest, NextResponse } from 'next/server';

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
};

export async function POST(req: NextRequest) {
  const { texte } = await req.json();
  if (!texte || texte.trim().length < 3) {
    return NextResponse.json({ error: 'Texte trop court' }, { status: 400 });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: `Tu es un assistant de classification pour une plateforme de troc française.
Déduis la catégorie et sous-catégorie la plus probable pour l'objet ou service décrit.
Catégories disponibles : ${JSON.stringify(CATEGORIES_DATA)}
Réponds UNIQUEMENT en JSON valide sans markdown : {"categorie": "...", "sous_categorie": "..."}`,
      messages: [{ role: 'user', content: texte }],
    }),
  });

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (parsed.categorie && CATEGORIES_DATA[parsed.categorie]) {
      return NextResponse.json(parsed);
    }
    return NextResponse.json({ error: 'Catégorie invalide' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Parse error' }, { status: 500 });
  }
}