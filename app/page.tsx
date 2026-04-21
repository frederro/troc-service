import { supabase } from './supabase'

export default async function Home() {
  const { data: annonces } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto', padding: '0 20px'}}>
      
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <span style={{fontWeight: '500', fontSize: '18px'}}>Troc-Service</span>
        </div>
        <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
          <a href="/messages" style={{padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', textDecoration: 'none', color: 'black', fontSize: '14px'}}>Mes messages</a>
          <a href="/connexion" style={{padding: '8px 16px', border: '1px solid #ddd', borderRadius: '8px', background: 'white', cursor: 'pointer', textDecoration: 'none', color: 'black', fontSize: '14px'}}>Se connecter</a>
          <a href="/creer-annonce" style={{padding: '8px 16px', border: 'none', borderRadius: '8px', background: '#1D9E75', color: 'white', cursor: 'pointer', textDecoration: 'none', fontSize: '14px'}}>+ Déposer une annonce</a>
        </div>
      </nav>

      <div style={{padding: '40px 0 30px'}}>
        <h1 style={{fontSize: '32px', fontWeight: '500', marginBottom: '10px'}}>Échangez sans argent, près de chez vous</h1>
        <p style={{color: '#666', marginBottom: '20px'}}>Objets, services, savoir-faire, tarte de mamy... trouvez votre voisin idéal.</p>
        <div style={{display: 'flex', gap: '10px'}}>
          <input placeholder="Rechercher une annonce..." style={{flex: 1, padding: '10px 16px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px'}} />
          <button style={{padding: '10px 20px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer'}}>Rechercher</button>
        </div>
      </div>

      <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '30px'}}>
        {['Tout', 'Vêtements', 'Objets', 'Services', 'Coups de main', 'Alimentation', 'Artisanat', 'Compétences'].map(cat => (
          <button key={cat} style={{padding: '6px 14px', borderRadius: '20px', border: '1px solid #ddd', background: cat === 'Tout' ? '#E1F5EE' : 'white', color: cat === 'Tout' ? '#0F6E56' : '#666', cursor: 'pointer'}}>{cat}</button>
        ))}
      </div>

      <h2 style={{fontSize: '16px', fontWeight: '500', marginBottom: '16px'}}>
        {annonces?.length || 0} annonces près de chez vous
      </h2>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'}}>
        {annonces?.map((annonce) => (
          <a key={annonce.id} href={`/annonce/${annonce.id}`} style={{border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', textDecoration: 'none', color: 'inherit', display: 'block'}}>
            <div style={{height: '80px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc'}}>Photo</div>
            <div style={{padding: '12px'}}>
              <span style={{fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#E1F5EE', color: '#0F6E56'}}>{annonce.categorie}</span>
              <div style={{fontWeight: '500', fontSize: '13px', margin: '6px 0 4px'}}>{annonce.titre}</div>
              <div style={{fontSize: '12px', color: '#666', marginBottom: '8px'}}>
                Idéalement : <span style={{color: '#1D9E75'}}>{annonce.echange_souhaite}</span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span style={{fontSize: '11px', color: '#999'}}>{annonce.membre_nom}</span>
                <span style={{fontSize: '10px', padding: '2px 8px', background: '#E1F5EE', color: '#0F6E56', borderRadius: '20px'}}>{annonce.localisation}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div style={{borderTop: '1px solid #eee', padding: '20px 0', marginTop: '40px', fontSize: '11px', color: '#999'}}>
        Troc-Service — Plateforme d'échange entre particuliers · <a href="#" style={{color: '#1D9E75'}}>CGU</a> · <a href="#" style={{color: '#1D9E75'}}>Mentions légales</a> · <a href="#" style={{color: '#1D9E75'}}>RGPD</a>
      </div>

    </main>
  )
}