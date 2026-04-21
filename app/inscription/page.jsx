'use client'
import { useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function Inscription() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', prenom: '', ville: '' })
  const [loading, setLoading] = useState(false)
  const [etape, setEtape] = useState('inscription')

  const inscrire = async () => {
    if (!form.email || !form.password || !form.prenom) {
      alert('Merci de remplir tous les champs obligatoires !')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { prenom: form.prenom, ville: form.ville } }
    })
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      setEtape('confirmation')
    }
    setLoading(false)
  }

  if (etape === 'confirmation') return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '400px', margin: '100px auto', padding: '20px', textAlign: 'center'}}>
      <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px'}}>✓</div>
      <h1 style={{fontSize: '22px', fontWeight: '500', marginBottom: '10px'}}>Vérifiez vos emails !</h1>
      <p style={{color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px'}}>Un email de confirmation a été envoyé à <strong>{form.email}</strong>. Cliquez sur le lien pour activer votre compte.</p>
      <a href="/connexion" style={{display: 'block', padding: '12px', background: '#1D9E75', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500'}}>Aller à la connexion</a>
    </main>
  )

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '440px', margin: '60px auto', padding: '20px'}}>
      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc - Service</a>
        </div>
        <h1 style={{fontSize: '22px', fontWeight: '500', marginBottom: '6px'}}>Créer mon compte</h1>
        <p style={{color: '#666', fontSize: '13px'}}>1€/mois — identité vérifiée — échanges assurés</p>
      </div>

      <div style={{marginBottom: '14px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Prénom *</label>
        <input value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} placeholder="Votre prénom" style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}} />
      </div>

      <div style={{marginBottom: '14px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Email *</label>
        <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="votre@email.com" style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}} />
      </div>

      <div style={{marginBottom: '14px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Mot de passe *</label>
        <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" placeholder="Min. 6 caractères" style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}} />
      </div>

      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Ville</label>
        <input value={form.ville} onChange={e => setForm({...form, ville: e.target.value})} placeholder="Ex : Paris, Lyon..." style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}} />
      </div>

      <div style={{background: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '12px', color: '#666'}}>
        En créant un compte vous acceptez nos <a href="#" style={{color: '#1D9E75'}}>CGU</a> et notre <a href="#" style={{color: '#1D9E75'}}>politique de confidentialité</a>.
      </div>

      <button onClick={inscrire} disabled={loading} style={{width: '100%', padding: '13px', background: loading ? '#ccc' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px'}}>
        {loading ? 'Création en cours...' : 'Créer mon compte'}
      </button>

      <p style={{textAlign: 'center', fontSize: '13px', color: '#666'}}>
        Déjà membre ? <a href="/connexion" style={{color: '#1D9E75'}}>Se connecter</a>
      </p>
    </main>
  )
}