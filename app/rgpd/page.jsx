export default function RGPD() {
  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '40px 20px'}}>
      <div style={{marginBottom: '30px'}}>
        <a href="/" style={{color: '#1D9E75', textDecoration: 'none', fontSize: '14px'}}>← Retour à l'accueil</a>
      </div>
      <h1 style={{fontSize: '28px', fontWeight: '500', marginBottom: '8px'}}>Politique de confidentialité</h1>
      <p style={{color: '#999', fontSize: '13px', marginBottom: '40px'}}>Dernière mise à jour : avril 2025</p>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>1. Données collectées</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Nous collectons les données suivantes lors de votre inscription et utilisation de la plateforme : nom/prénom, adresse email, ville, contenu des annonces publiées, messages échangés entre membres, données de paiement (traitées par Stripe — nous ne stockons pas vos coordonnées bancaires).</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>2. Utilisation des données</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Vos données sont utilisées exclusivement pour : le fonctionnement de la plateforme, la mise en relation entre membres, la gestion des abonnements, l'envoi d'emails transactionnels (confirmation d'inscription, notifications). Nous ne vendons jamais vos données à des tiers.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>3. Durée de conservation</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Vos données sont conservées pendant la durée de votre abonnement et 3 ans après la résiliation, conformément aux obligations légales françaises.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>4. Vos droits</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Conformément au RGPD, vous disposez des droits suivants : droit d'accès, de rectification, d'effacement, de portabilité et d'opposition. Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@troc-service.fr" style={{color: '#1D9E75'}}>contact@troc-service.fr</a></p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>5. Cookies</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>La plateforme utilise uniquement des cookies techniques nécessaires au fonctionnement (session utilisateur, préférences). Aucun cookie publicitaire ou de tracking n'est utilisé.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>6. Sous-traitants</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Nous faisons appel aux sous-traitants suivants, tous conformes au RGPD : Supabase (stockage des données — serveurs en Europe), Stripe (paiement), Vercel (hébergement).</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>7. Contact & réclamations</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Pour toute question relative à vos données personnelles : <a href="mailto:contact@troc-service.fr" style={{color: '#1D9E75'}}>contact@troc-service.fr</a><br/>Vous pouvez également introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" style={{color: '#1D9E75'}}>cnil.fr</a></p>
      </section>

      <div style={{borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '12px', color: '#999'}}>
        Troc-Service · <a href="/cgu" style={{color: '#1D9E75'}}>CGU</a> · <a href="/mentions-legales" style={{color: '#1D9E75'}}>Mentions légales</a>
      </div>
    </main>
  )
}