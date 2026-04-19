'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Messages() {
  const [nom, setNom] = useState('')
  const [nomSaisi, setNomSaisi] = useState(false)
  const [conversations, setConversations] = useState([])
  const [convActive, setConvActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [nouveau, setNouveau] = useState('')

  useEffect(() => {
    if (nomSaisi) chargerConversations()
  }, [nomSaisi])

  useEffect(() => {
    if (convActive) chargerMessages()
  }, [convActive])

  const chargerConversations = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, annonces(titre)')
      .or(`expediteur_nom.eq.${nom},destinataire_nom.eq.${nom}`)
      .order('created_at', { ascending: false })
    
    const convMap = {}
    data?.forEach(m => {
      const key = `${m.annonce_id}-${[m.expediteur_nom, m.destinataire_nom].sort().join('-')}`
      if (!convMap[key]) convMap[key] = { ...m, key }
    })
    setConversations(Object.values(convMap))
  }

  const chargerMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('annonce_id', convActive.annonce_id)
      .or(`and(expediteur_nom.eq.${convActive.expediteur_nom},destinataire_nom.eq.${convActive.destinataire_nom}),and(expediteur_nom.eq.${convActive.destinataire_nom},destinataire_nom.eq.${convActive.expediteur_nom})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  const envoyer = async () => {
    if (!nouveau.trim()) return
    const destinataire = convActive.expediteur_nom === nom ? convActive.destinataire_nom : convActive.expediteur_nom
    await supabase.from('messages').insert([{
      annonce_id: convActive.annonce_id,
      expediteur_nom: nom,
      destinataire_nom: destinataire,
      contenu: nouveau
    }])
    setNouveau('')
    chargerMessages()
  }

  if (!nomSaisi) return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '400px', margin: '100px auto', padding: '20px', textAlign: 'center'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '30px'}}>
        <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
        <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc & Service</a>
      </div>
      <h1 style={{fontSize: '22px', fontWeight: '500', marginBottom: '8px'}}>Mes messages</h1>
      <p style={{color: '#666', fontSize: '14px', marginBottom: '20px'}}>Entrez votre prénom pour accéder à vos conversations</p>
      <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Votre prénom..." style={{width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px'}} />
      <button onClick={() => nom && setNomSaisi(true)} style={{width: '100%', padding: '12px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer'}}>Accéder à mes messages</button>
    </main>
  )

  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '20px'}}>
      <nav style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: '20px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75'}}></div>
          <a href="/" style={{fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black'}}>Troc & Service</a>
        </div>
        <span style={{fontSize: '13px', color: '#666'}}>Bonjour {nom} !</span>
      </nav>

      <div style={{display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: '600px'}}>
        
        <div style={{border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden'}}>
          <div style={{padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: '500', fontSize: '14px'}}>Conversations</div>
          {conversations.length === 0 && <div style={{padding: '20px', fontSize: '13px', color: '#999', textAlign: 'center'}}>Aucune conversation</div>}
          {conversations.map(conv => (
            <div key={conv.key} onClick={() => setConvActive(conv)} style={{padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: convActive?.key === conv.key ? '#f0faf5' : 'white'}}>
              <div style={{fontSize: '13px', fontWeight: '500', marginBottom: '3px'}}>{conv.annonces?.titre}</div>
              <div style={{fontSize: '12px', color: '#666'}}>{conv.expediteur_nom === nom ? conv.destinataire_nom : conv.expediteur_nom}</div>
              <div style={{fontSize: '11px', color: '#999', marginTop: '2px'}}>{conv.contenu?.substring(0, 40)}...</div>
            </div>
          ))}
        </div>

        <div style={{border: '1px solid #eee', borderRadius: '12px', display: 'flex', flexDirection: 'column'}}>
          {!convActive ? (
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px'}}>
              Sélectionnez une conversation
            </div>
          ) : (
            <>
              <div style={{padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: '500', fontSize: '14px'}}>
                {convActive.annonces?.titre}
              </div>
              <div style={{flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px'}}>
                {messages.map(m => (
                  <div key={m.id} style={{display: 'flex', justifyContent: m.expediteur_nom === nom ? 'flex-end' : 'flex-start'}}>
                    <div style={{maxWidth: '70%', padding: '8px 12px', borderRadius: '12px', background: m.expediteur_nom === nom ? '#1D9E75' : '#f5f5f5', color: m.expediteur_nom === nom ? 'white' : 'black', fontSize: '13px'}}>
                      {m.contenu}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: '8px'}}>
                <input value={nouveau} onChange={e => setNouveau(e.target.value)} onKeyDown={e => e.key === 'Enter' && envoyer()} placeholder="Votre message..." style={{flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '20px', fontSize: '13px'}} />
                <button onClick={envoyer} style={{padding: '8px 16px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', cursor: 'pointer'}}>Envoyer</button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}