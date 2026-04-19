'use client'
import { useState } from 'react'
import { supabase } from '../../supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ContacterForm({ id }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destinataire = searchParams.get('destinataire')
  const titre = searchParams.get('titre')
  
  const [expediteur, setExpediteur] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const envoyer = async () => {
    if (!expediteur.trim() || !message.trim()) {
      alert('Merci de remplir tous les champs !')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('messages').insert([{
      annonce_id: parseInt(id),
      expediteur_nom: expediteur,
      destinataire_nom: destinataire,
      contenu: message
    }])
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      alert('Message envoyé ! ' + destinataire + ' vous répondra bientôt.')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: '30px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc & Service</a>
        </div>
        <a href={`/annonce/${id}`} style={{fontSize: '13px', color: '#666', textDecoration: 'none'}}>← Retour à l'annonce</a>
      </nav>

      <div style={{background: '#f0faf5', border: '1px solid #9FE1CB', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px'}}>
        <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Vous contactez</div>
        <div style={{fontSize: '15px', fontWeight: '500', color: '#0F6E56'}}>{destinataire}</div>
        <div style={{fontSize: '13px', color: '#666', marginTop: '2px'}}>À propos de : {titre}</div>
      </div>

      <div style={{marginBottom: '16px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Votre prénom *</label>
        <input
          value={expediteur}
          onChange={e => setExpediteur(e.target.value)}
          placeholder="Ex : Marie, Thomas..."
          style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
        />
      </div>

      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: '#444'}}>Votre message & proposition d'échange *</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Bonjour ! Je suis intéressé par votre annonce. En échange je pourrais vous proposer..."
          rows={5}
          style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical'}}
        />
      </div>

      <button
        onClick={envoyer}
        disabled={loading}
        style={{width: '100%', padding: '14px', background: loading ? '#ccc' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'}}
      >
        {loading ? 'Envoi en cours...' : 'Envoyer ma proposition'}
      </button>
    </main>
  )
}

export default function Contacter({ params }) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ContacterForm id={params.id} />
    </Suspense>
  )
}