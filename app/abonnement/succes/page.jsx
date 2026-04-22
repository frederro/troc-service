export default function Succes() {
  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '400px', margin: '100px auto', padding: '20px', textAlign: 'center'}}>
      <div style={{width: '70px', height: '70px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '30px'}}>✓</div>
      <h1 style={{fontSize: '24px', fontWeight: '500', marginBottom: '10px'}}>Bienvenue sur Troc-Service !</h1>
      <p style={{color: '#666', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px'}}>Votre abonnement est actif. Vous pouvez maintenant publier des annonces et échanger avec la communauté !</p>
      <a href="/" style={{display: 'block', padding: '13px', background: '#1D9E75', color: 'white', borderRadius: '8px', textDecoration: 'none', fontWeight: '500', fontSize: '15px'}}>
        Découvrir les annonces
      </a>
    </main>
  )
}