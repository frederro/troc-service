'use client'
import { useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function CreerAnnonce() {
  const router = useRouter()
  const [form, setForm] = useState({
    titre: '',
    description: '',
    categorie: '',
    echange_souhaite: '',
    localisation: '',
    portee: 'local',
    membre_nom: '',
    ouvert_propositions: true
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    const { error } = await supabase.from('annonces').insert([form])
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      alert('Annonce publiée avec succès !')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '700px', margin: '0 auto', padding: '20px'}}>
      
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: '30px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc & Service</a>
        </div>
      </nav>

      <h1 style={{fontSize: '24px', fontWeight: '500', marginBottom: '6px'}}>Déposer une annonce</h1>
      <p style={{color: '#666', marginBottom: '30px', fontSize: '14px'}}>Décrivez ce que vous proposez et ce que vous cherchez en échange.</p>

      <div style={{marginBottom: '16px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Titre de l'annonce *</label>
        <input 
          value={form.titre}
          onChange={e => setForm({...form, titre: e.target.value})}
          placeholder="Ex : Vélo de ville, tarte maison, cours de piano..."
          style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
        />
      </div>

      <div style={{marginBottom: '16px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Description *</label>
        <textarea 
          value={form.description}
          onChange={e => setForm({...form, description: e.target.value})}
          placeholder="Décrivez votre bien ou service en détail..."
          rows={4}
          style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical'}}
        />
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Catégorie *</label>
          <select 
            value={form.categorie}
            onChange={e => setForm({...form, categorie: e.target.value})}
            style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
          >
            <option value="">Choisir...</option>
            <option>Vêtements</option>
            <option>Objets</option>
            <option>Services</option>
            <option>Coups de main</option>
            <option>Alimentation</option>
            <option>Artisanat</option>
            <option>Compétences</option>
            <option>Enfance & collection</option>
          </select>
        </div>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Portée</label>
          <select 
            value={form.portee}
            onChange={e => setForm({...form, portee: e.target.value})}
            style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
          >
            <option value="local">Local (ma ville)</option>
            <option value="national">National (envoi postal)</option>
            <option value="international">International</option>
          </select>
        </div>
      </div>

      <div style={{marginBottom: '16px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Ce que je cherche en échange</label>
        <input 
          value={form.echange_souhaite}
          onChange={e => setForm({...form, echange_souhaite: e.target.value})}
          placeholder="Ex : cours de couture, aide jardinage... (optionnel)"
          style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
        />
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
          <input 
            type="checkbox" 
            checked={form.ouvert_propositions}
            onChange={e => setForm({...form, ouvert_propositions: e.target.checked})}
            id="ouvert"
          />
          <label htmlFor="ouvert" style={{fontSize: '13px', color: '#1D9E75', cursor: 'pointer'}}>Ouvert à toute proposition</label>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Ville / Localisation *</label>
          <input 
            value={form.localisation}
            onChange={e => setForm({...form, localisation: e.target.value})}
            placeholder="Ex : Paris 11e, Lyon, Bordeaux..."
            style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
          />
        </div>
        <div>
          <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Votre prénom *</label>
          <input 
            value={form.membre_nom}
            onChange={e => setForm({...form, membre_nom: e.target.value})}
            placeholder="Ex : Jean-Marc, Louise..."
            style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
          />
        </div>
      </div>

      <div style={{background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '12px', color: '#666'}}>
        En publiant cette annonce, vous confirmez agir en tant que particulier et acceptez les conditions d'utilisation. Les échanges se font sous votre responsabilité.
      </div>

      <button 
        onClick={handleSubmit}
        disabled={loading}
        style={{width: '100%', padding: '14px', background: loading ? '#ccc' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'}}
      >
        {loading ? 'Publication en cours...' : 'Publier mon annonce'}
      </button>

    </main>
  )
}