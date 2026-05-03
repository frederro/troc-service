'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Messages() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<any[]>([])
  const [convActive, setConvActive] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [nouveau, setNouveau] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) {
        window.location.href = '/connexion'
        return
      }
      setUser(data.user)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (user) chargerConversations()
  }, [user])

  useEffect(() => {
    if (convActive && user) chargerMessages()
  }, [convActive])

  const chargerConversations = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, annonces(titre)')
      .or(`expediteur_id.eq.${user.id},destinataire_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    const convMap: any = {}
    data?.forEach((m: any) => {
      const autreId = m.expediteur_id === user.id ? m.destinataire_id : m.expediteur_id
      const autreNom = m.expediteur_id === user.id ? m.destinataire_nom : m.expediteur_nom
      const key = `${autreId}`
      if (!convMap[key]) convMap[key] = { ...m, key, autreId, autreNom }
    })
    setConversations(Object.values(convMap))
  }

  const chargerMessages = async () => {
    const { data: data1 } = await supabase
      .from('messages')
      .select('*')
      .eq('expediteur_id', user.id)
      .eq('destinataire_id', convActive.autreId)

    const { data: data2 } = await supabase
      .from('messages')
      .select('*')
      .eq('expediteur_id', convActive.autreId)
      .eq('destinataire_id', user.id)

    const tous = [...(data1 || []), ...(data2 || [])]
    tous.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    setMessages(tous)
  }

  const envoyer = async () => {
    if (!nouveau.trim()) return
    await supabase.from('messages').insert([{
      expediteur_id: user.id,
      expediteur_nom: user.email,
      destinataire_id: convActive.autreId,
      destinataire_nom: convActive.autreNom,
      contenu: nouveau
    }])
    setNouveau('')
    chargerMessages()
  }

  if (loading) return <p style={{ padding: '40px', fontFamily: 'sans-serif' }}>Chargement...</p>

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1D9E75' }}></div>
          <a href="/" style={{ fontWeight: '500', fontSize: '18px', textDecoration: 'none', color: 'black' }}>Troc-Service</a>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#666' }}>{user?.email}</span>
          <a href="/" style={{ fontSize: '13px', color: '#666', textDecoration: 'none' }}>← Retour</a>
        </div>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: '600px' }}>

        <div style={{ border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: '500', fontSize: '14px' }}>Conversations</div>
          {conversations.length === 0 && (
            <div style={{ padding: '20px', fontSize: '13px', color: '#999', textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              Aucune conversation
            </div>
          )}
          {conversations.map(conv => (
            <div key={conv.key} onClick={() => setConvActive(conv)} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', background: convActive?.key === conv.key ? '#f0faf5' : 'white' }}>
              <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '3px' }}>{conv.autreNom}</div>
              {conv.annonces?.titre && (
                <div style={{ fontSize: '11px', color: '#1D9E75', marginBottom: '2px' }}>{conv.annonces.titre}</div>
              )}
              <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{conv.contenu?.substring(0, 40)}...</div>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid #eee', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
          {!convActive ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '14px' }}>
              Sélectionnez une conversation
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontWeight: '500', fontSize: '14px' }}>
                {convActive.autreNom}
              </div>
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginTop: '20px' }}>Aucun message</div>
                )}
                {messages.map((m: any) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: m.expediteur_id === user.id ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: '12px', background: m.expediteur_id === user.id ? '#1D9E75' : '#f5f5f5', color: m.expediteur_id === user.id ? 'white' : 'black', fontSize: '13px' }}>
                      {m.contenu}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
                <input
                  value={nouveau}
                  onChange={e => setNouveau(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && envoyer()}
                  placeholder="Votre message..."
                  style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '20px', fontSize: '13px' }}
                />
                <button onClick={envoyer} style={{ padding: '8px 16px', background: '#1D9E75', color: 'white', border: 'none', borderRadius: '20px', fontSize: '13px', cursor: 'pointer' }}>Envoyer</button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}