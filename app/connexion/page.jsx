'use client'
import { useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function Connexion() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const connecter = async () => {
    if (!form.email || !form.password) {
      alert('Merci de remplir tous les champs !')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })
    if (error) {
      alert('Erreur : ' + error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '440px', margin: '100px auto', padding: '20px'}}>
      <div style={{textAlign: 'center', marginBottom: '30px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc - Service</a>
        </div>
        <h1 style={{fontSize: '22px', fontWeight: '500', marginBottom: '6px'}}>Se connecter</h1>
        <p style={{color: '#666', fontSize: '13px'}}>Bienvenue sur Troc - Service</p>
      </div>

      <div style={{marginBottom: '14px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Email</label>
        <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="votre@email.com" style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}} />
      </div>

      <div style={{marginBottom: '20px'}}>
        <label style={{display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '5px', color: '#444'}}>Mot de passe</label>
        <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} type="password" placeholder="Votre mot de passe" style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box'}} />
      </div>

      <button onClick={connecter} disabled={loading} style={{width: '100%', padding: '13px', background: loading ? '#ccc' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px'}}>
        {loading ? 'Connexion...' : 'Se connecter'}
      </button>

      <p style={{textAlign: 'center', fontSize: '13px', color: '#666'}}>
        Pas encore membre ? <a href="/inscription" style={{color: '#1D9E75'}}>Créer un compte</a>
      </p>
    </main>
  )
}