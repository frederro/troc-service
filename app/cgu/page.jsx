export default function CGU() {
  return (
    <main style={{fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', padding: '40px 20px'}}>
      <div style={{marginBottom: '30px'}}>
        <a href="/" style={{color: '#1D9E75', textDecoration: 'none', fontSize: '14px'}}>← Retour à l'accueil</a>
      </div>
      <h1 style={{fontSize: '28px', fontWeight: '500', marginBottom: '8px'}}>Conditions Générales d'Utilisation</h1>
      <p style={{color: '#999', fontSize: '13px', marginBottom: '40px'}}>Dernière mise à jour : avril 2025</p>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>1. Présentation de la plateforme</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Troc-Service est une plateforme de mise en relation entre particuliers pour l'échange de biens, services, savoir-faire et créations. La plateforme agit exclusivement en tant qu'intermédiaire et n'est partie à aucun échange entre membres.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>2. Accès et inscription</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>L'accès complet à la plateforme est réservé aux membres abonnés (1€/mois ou 10€/an). L'inscription implique la création d'un compte avec une adresse email valide. L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>3. Responsabilité des échanges</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Les échanges se réalisent directement entre particuliers, sous leur entière responsabilité. Troc-Service ne garantit pas la qualité, la conformité ou la sécurité des biens et services échangés. La plateforme ne peut être tenue responsable des litiges survenant entre membres.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>4. Contenu des annonces</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Les membres s'engagent à ne publier que des annonces légales, conformes aux lois françaises en vigueur. Sont notamment interdits : les armes illégales, les substances illicites, les contenus pornographiques impliquant des mineurs, les produits contrefaits. Troc-Service se réserve le droit de supprimer tout contenu non conforme.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>5. Alimentation et boissons artisanales</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>L'échange de denrées alimentaires et de boissons artisanales (y compris les boissons alcoolisées) entre particuliers se fait sous la responsabilité exclusive des membres concernés, dans le cadre d'un usage personnel. Troc-Service ne peut être tenu responsable de tout incident lié à la consommation de ces produits.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>6. Abonnement et résiliation</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>L'abonnement est mensuel (1€/mois) ou annuel (10€/an), renouvelable automatiquement. La résiliation peut être effectuée à tout moment depuis l'espace membre, sans frais ni préavis. Elle prend effet à la fin de la période en cours.</p>
      </section>

      <section style={{marginBottom: '32px'}}>
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '12px'}}>7. Droit applicable</h2>
        <p style={{fontSize: '14px', color: '#444', lineHeight: '1.8'}}>Les présentes CGU sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
      </section>

      <div style={{borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '12px', color: '#999'}}>
        Troc-Service · <a href="/mentions-legales" style={{color: '#1D9E75'}}>Mentions légales</a> · <a href="/rgpd" style={{color: '#1D9E75'}}>RGPD</a>
      </div>
    </main>
  )
}