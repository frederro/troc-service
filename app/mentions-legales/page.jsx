export default function MentionsLegales() {
  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '40px 20px'}}>
      <div style={{marginBottom: '30px'}}>
        <a href="/" style={{color: '#1D9E75', textDecoration: 'none', fontSize: '14px'}}>← Retour à l'accueil</a>
      </div>
      <h1 style={{fontSize: '28px', fontWeight: '500', marginBottom: '8px'}}>Mentions légales</h1>
      <p style={{color: '#999', fontSize: '13px', marginBottom: '40px'}}>Dernière mise à jour : avril 2025</p>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>Éditeur de la plateforme</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>
          Nom : Troc-Service<br/>
          Statut : [À compléter — auto-entrepreneur / SASU / SAS]<br/>
          Adresse : [À compléter]<br/>
          Email : contact@troc-service.fr<br/>
          SIRET : [À compléter après immatriculation]
        </p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>Hébergement</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>
          La plateforme est hébergée par :<br/>
          <strong>Vercel Inc.</strong><br/>
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br/>
          <a href="https://vercel.com" style={{color: '#1D9E75'}}>vercel.com</a>
        </p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>Base de données</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>
          Les données sont stockées par :<br/>
          <strong>Supabase Inc.</strong><br/>
          Serveurs localisés en Europe (Irlande — AWS eu-central-1)<br/>
          <a href="https://supabase.com" style={{color: '#1D9E75'}}>supabase.com</a>
        </p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>Paiement</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>
          Les paiements sont traités par :<br/>
          <strong>Stripe Inc.</strong><br/>
          354 Oyster Point Blvd, South San Francisco, CA 94080, États-Unis<br/>
          <a href="https://stripe.com" style={{color: '#1D9E75'}}>stripe.com</a>
        </p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>Propriété intellectuelle</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>L'ensemble des éléments constituant la plateforme Troc-Service (logo, design, code, textes) sont la propriété exclusive de Troc-Service. Toute reproduction sans autorisation est interdite.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>Responsabilité</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Troc-Service agit en tant qu'hébergeur de contenu au sens de la loi pour la Confiance dans l'Économie Numérique (LCEN). À ce titre, la plateforme ne peut être tenue responsable des contenus publiés par les membres.</p>
      </section>

      <div style={{borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '12px', color: '#999'}}>
        Troc-Service · <a href="/cgu" style={{color: '#1D9E75'}}>CGU</a> · <a href="/rgpd" style={{color: '#1D9E75'}}>RGPD</a>
      </div>
    </main>
  )
}