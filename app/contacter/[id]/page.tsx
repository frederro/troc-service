'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ContacterForm({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destinataire = searchParams.get('destinataire')
  const titre = searchParams.get('titre')
  const destinataire_id = searchParams.get('destinataire_id')
  const destinataire_email = searchParams.get('destinataire_email')

  const [user, setUser] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [expediteurNom, setExpediteurNom] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        window.location.href = '/connexion'
        return
      }
      setUser(data.user)
    })
  }, [])

  useEffect(() => {
    if (!user?.id) return

    // On utilise le dernier "membre_nom" de ses annonces comme nom affiché (fallback: email)
    supabase
      .from('annonces')
      .select('membre_nom')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        const nom = (data as any)?.membre_nom ? String((data as any).membre_nom) : ''
        setExpediteurNom(nom || String(user.email || ''))
      })
  }, [user?.id])

  const envoyer = async () => {
    if (!message.trim()) {
      alert('Merci d\'écrire un message !')
      return
    }
    if (!user) return
    setLoading(true)
    const { error } = await supabase.from('messages').insert([{
      annonce_id: parseInt(id),
      expediteur_id: user.id,
      expediteur_nom: expediteurNom || user.email,
      destinataire_id: destinataire_id || null,
      destinataire_nom: destinataire,
      contenu: message
    }])
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      // Email Brevo (si l’email du destinataire est fourni dans l’URL)
      if (destinataire_email && destinataire_email.includes('@')) {
        try {
          await fetch('/api/email/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              destinataire_email: destinataire_email,
              destinataire_nom: destinataire,
              expediteur_nom: expediteurNom || user.email,
              annonce_titre: titre,
              contenu: message
            })
          })
        } catch {
          // ne bloque pas l’envoi du message
        }
      }

      alert('Message envoyé ! ' + destinataire + ' vous répondra bientôt.')
      router.push('/')
    }
    setLoading(false)
  }

  if (!user) return <p style={{padding: '40px', fontFamily: 'sans-serif'}}>Chargement...</p>

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: '30px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc-Service</a>
        </div>
        <a href={`/annonce/${id}`} style={{fontSize: '13px', color: '#666', textDecoration: 'none'}}>← Retour à l'annonce</a>
      </nav>

      <div style={{background: '#f0faf5', border: '1px solid #9FE1CB', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px'}}>
        <div style={{fontSize: '12px', color: '#666', marginBottom: '4px'}}>Vous contactez</div>
        <div style={{fontSize: '15px', fontWeight: '500', color: '#0F6E56'}}>{destinataire}</div>
        <div style={{fontSize: '13px', color: '#666', marginTop: '2px'}}>À propos de : {titre}</div>
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

export default function Contacter({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ContacterForm id={params.id} />
    </Suspense>
  )
}