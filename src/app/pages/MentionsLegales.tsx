import { LegalLayout, LegalSection, ToComplete } from './LegalLayout';

export function MentionsLegales() {
  return (
    <LegalLayout
      title="Mentions légales"
      subtitle="Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN)."
    >
      <LegalSection heading="1. Éditeur du site">
        <p style={{ margin: 0 }}>
          Le présent site est édité par <strong>Espace Ködörö</strong>.<br />
          Forme juridique : Association régie par la loi du 1<sup>er</sup> juillet 1901<br />
          Adresse : 25 boulevard Didier Rey, 82300 Caussade, France<br />
          Email : <a href="mailto:espacekodoro@gmail.com" style={{ color: '#C9A700' }}>espacekodoro@gmail.com</a><br />
          Numéro SIREN : 848 786 265
        </p>
      </LegalSection>

      <LegalSection heading="2. Responsable de la publication">
        <p style={{ margin: 0 }}>
          Christelle Mettetal, en qualité de représentante légale d'Espace Ködörö.<br />
          Contact : <a href="mailto:espacekodoro@gmail.com" style={{ color: '#C9A700' }}>espacekodoro@gmail.com</a>
        </p>
      </LegalSection>

      <LegalSection heading="3. Hébergement">
        <p style={{ margin: 0 }}>
          Le site est hébergé par : <strong>Cloudflare, Inc.</strong><br />
          Adresse : 101 Townsend St, San Francisco, CA 94107, États-Unis<br />
          Site web : <a href="https://www.cloudflare.com" style={{ color: '#C9A700' }}>www.cloudflare.com</a>
        </p>
      </LegalSection>

      <LegalSection heading="4. Propriété intellectuelle">
        <p style={{ margin: 0 }}>
          L'ensemble des éléments du site (textes, logo, photographies, graphismes, mise en page) est, sauf
          mention contraire, la propriété d'Espace Ködörö ou utilisé avec l'autorisation de leurs ayants droit.
          Toute reproduction, représentation, modification ou exploitation, totale ou partielle, sans
          autorisation écrite préalable est interdite et constituerait une contrefaçon sanctionnée par le Code
          de la propriété intellectuelle.
        </p>
      </LegalSection>

      <LegalSection heading="5. Cartographie et services tiers">
        <p style={{ margin: 0 }}>
          La carte de localisation est fournie par <strong>OpenStreetMap</strong> (© les contributeurs
          OpenStreetMap). Le formulaire de contact est traité par le service <strong>Formspree</strong>
          (voir notre <a href="/politique-de-confidentialite" style={{ color: '#C9A700' }}>politique de confidentialité</a>).
        </p>
      </LegalSection>

      <LegalSection heading="6. Responsabilité">
        <p style={{ margin: 0 }}>
          Espace Ködörö s'efforce d'assurer l'exactitude des informations diffusées sur ce site mais ne saurait
          être tenu responsable des erreurs, omissions ou d'une indisponibilité temporaire du site. Les
          informations (tarifs, horaires, événements) sont données à titre indicatif et susceptibles d'évoluer.
        </p>
      </LegalSection>

      <LegalSection heading="7. Contact">
        <p style={{ margin: 0 }}>
          Pour toute question relative au site ou à ces mentions légales :{' '}
          <a href="mailto:espacekodoro@gmail.com" style={{ color: '#C9A700' }}>espacekodoro@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
