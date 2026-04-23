'use client'
import { useState } from 'react'
import { supabase } from '../../supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function EvaluerForm({ id }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const evalue = searchParams.get('membre')
  const titre = searchParams.get('titre')

  const [note, setNote] = useState(0)
  const [commentaire, setCommentaire] = useState('')
  const [evaluateur, setEvaluateur] = useState('')
  const [loading, setLoading] = useState(false)
  const [survol, setSurvol] = useState(0)

  const envoyer = async () => {
    if (!note || !evaluateur.trim()) {
      alert('Merci de donner une note et votre prénom !')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('evaluations').insert([{
      annonce_id: parseInt(id),
      evaluateur_nom: evaluateur,
      evalue_nom: evalue,
      note: note,
      commentaire: commentaire
    }])
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      alert('Merci pour votre évaluation !')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', padding: '20px'}}>
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: '30px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc-Service</a>
        </div>
      </nav>

      <h1 style={{fontSize: '22px', fontWeight: '500', marginBottom: '6px'}}>Évaluer cet échange</h1>
      <p style={{fontSize: '14px', color: '#666', marginBottom: '24px'}}>À propos de : {titre}</p>

      <div style={{background: '#f0faf5', border: '1px solid #9FE1CB', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px'}}>
        <div style={{fontSize: '13px', color: '#666'}}>Vous évaluez</div>
        <div style={{fontSize: '16px', fontWeight: '500', color: '#0F6E56'}}>{evalue}</div>
      </div>

      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Votre prénom *</label>
        <input
          value={evaluateur}
          onChange={e => setEvaluateur(e.target.value)}
          placeholder="Votre prénom..."
          style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}}
        />
      </div>

      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '12px', color: '#444'}}>Note *</label>
        <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
          {[1,2,3,4,5].map(i => (
            <div
              key={i}
              onClick={() => setNote(i)}
              onMouseEnter={() => setSurvol(i)}
              onMouseLeave={() => setSurvol(0)}
              style={{
                fontSize: '36px',
                cursor: 'pointer',
                color: i <= (survol || note) ? '#F59E0B' : '#ddd',
                transition: 'color 0.1s'
              }}
            >★</div>
          ))}
        </div>
        {note > 0 && (
          <div style={{textAlign: 'center', fontSize: '13px', color: '#666', marginTop: '8px'}}>
            {['', 'Très mauvais', 'Mauvais', 'Correct', 'Bien', 'Excellent !'][note]}
          </div>
        )}
      </div>

      <div style={{marginBottom: '24px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Commentaire (optionnel)</label>
        <textarea
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          placeholder="Décrivez votre expérience d'échange..."
          rows={4}
          style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical'}}
        />
      </div>

      <button
        onClick={envoyer}
        disabled={loading}
        style={{width: '100%', padding: '13px', background: loading ? '#ccc' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer'}}
      >
        {loading ? 'Envoi...' : 'Publier mon évaluation'}
      </button>
    </main>
  )
}

export default function Evaluer({ params }) {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <EvaluerForm id={params.id} />
    </Suspense>
  )
}