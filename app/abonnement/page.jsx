'use client'
import { useState } from 'react'

export default function Abonnement() {
  const [loading, setLoading] = useState(null)

  const sAbonner = async (type) => {
    setLoading(type)
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      alert('Erreur : ' + error.message)
      setLoading(null)
    }
  }

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px'}}>
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: '40px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc-Service</a>
        </div>
      </nav>

      <div style={{textAlign: 'center', marginBottom: '40px'}}>
        <h1 style={{fontSize: '26px', fontWeight: '500', marginBottom: '10px'}}>Choisissez votre formule</h1>
        <p style={{color: '#666', fontSize: '14px'}}>Accès complet — identité vérifiée — échanges assurés — résiliable à tout moment</p>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px'}}>
        <div style={{border: '1px solid #eee', borderRadius: '16px', padding: '24px', textAlign: 'center'}}>
          <div style={{fontSize: '13px', color: '#666', marginBottom: '8px'}}>Mensuel</div>
          <div style={{fontSize: '36px', fontWeight: '500', marginBottom: '4px'}}>1€</div>
          <div style={{fontSize: '13px', color: '#999', marginBottom: '20px'}}>par mois</div>
          <ul style={{listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left'}}>
            {['Annonces illimitées', 'Messagerie incluse', 'Identité vérifiée', 'Résiliable à tout moment'].map(f => (
              <li key={f} style={{fontSize: '13px', color: '#444', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{color: '#1D9E75'}}>✓</span> {f}
              </li>
            ))}
          </ul>
          <button onClick={() => sAbonner('mensuel')} disabled={loading === 'mensuel'} style={{width: '100%', padding: '12px', background: loading === 'mensuel' ? '#ccc' : 'white', color: '#1D9E75', border: '2px solid #1D9E75', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'}}>
            {loading === 'mensuel' ? 'Chargement...' : 'Choisir mensuel'}
          </button>
        </div>

        <div style={{border: '2px solid #1D9E75', borderRadius: '16px', padding: '24px', textAlign: 'center', position: 'relative'}}>
<div style={{position: 'relative', marginBottom: '8px', background: '#1D9E75', color: 'white', fontSize: '11px', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', display: 'inline-block'}}>Meilleure offre</div>
          <div style={{fontSize: '36px', fontWeight: '500', marginBottom: '4px'}}>10€</div>
          <div style={{fontSize: '13px', color: '#999', marginBottom: '4px'}}>par an</div>
          <div style={{fontSize: '12px', color: '#1D9E75', marginBottom: '16px'}}>soit 0,83€/mois — 2 mois offerts !</div>
          <ul style={{listStyle: 'none', padding: 0, marginBottom: '24px', textAlign: 'left'}}>
            {['Annonces illimitées', 'Messagerie incluse', 'Identité vérifiée', 'Résiliable à tout moment'].map(f => (
              <li key={f} style={{fontSize: '13px', color: '#444', padding: '4px 0', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{color: '#1D9E75'}}>✓</span> {f}
              </li>
            ))}
          </ul>
          <button onClick={() => sAbonner('annuel')} disabled={loading === 'annuel'} style={{width: '100%', padding: '12px', background: loading === 'annuel' ? '#ccc' : '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer'}}>
            {loading === 'annuel' ? 'Chargement...' : 'Choisir annuel'}
          </button>
        </div>
      </div>

      <div style={{textAlign: 'center', fontSize: '12px', color: '#999', lineHeight: '1.6'}}>
        Paiement sécurisé par Stripe · Résiliation possible à tout moment · Sans engagement
      </div>
    </main>
  )
}