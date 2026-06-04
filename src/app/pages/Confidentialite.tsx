import { LegalLayout, LegalSection } from './LegalLayout';

export function Confidentialite() {
  return (
    <LegalLayout
      title="Politique de confidentialité"
      subtitle="Dernière mise à jour : juin 2026. La présente politique décrit comment Espace Ködörö traite vos données personnelles conformément au Règlement général sur la protection des données (RGPD)."
    >
      <LegalSection heading="1. Responsable du traitement">
        <p style={{ margin: 0 }}>
          Les données collectées via ce site sont traitées par <strong>Espace Ködörö</strong>, 25 boulevard
          Didier Rey, 82300 Caussade, France — contact :{' '}
          <a href="mailto:espacekodoro@gmail.com" style={{ color: '#C06040' }}>espacekodoro@gmail.com</a>.
        </p>
      </LegalSection>

      <LegalSection heading="2. Données collectées">
        <p style={{ margin: 0 }}>
          Nous collectons uniquement les données que vous nous transmettez volontairement via le{' '}
          <strong>formulaire de contact</strong> :
        </p>
        <ul style={{ marginTop: '0.75rem', marginBottom: 0, paddingLeft: '1.25rem' }}>
          <li>votre nom complet ;</li>
          <li>votre adresse email ;</li>
          <li>le sujet et le contenu de votre message.</li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          Aucune donnée n'est collectée à votre insu, et le site n'utilise pas d'outil de profilage publicitaire.
        </p>
      </LegalSection>

      <LegalSection heading="3. Finalité et base légale">
        <p style={{ margin: 0 }}>
          Ces données sont utilisées dans le seul but de <strong>traiter votre demande et d'y répondre</strong>.
          La base légale du traitement est votre <strong>consentement</strong>, donné lors de l'envoi du
          formulaire, ainsi que l'intérêt légitime d'Espace Ködörö à répondre à ses contacts.
        </p>
      </LegalSection>

      <LegalSection heading="4. Destinataires et sous-traitants">
        <p style={{ margin: 0 }}>
          Les messages envoyés via le formulaire sont acheminés par notre prestataire <strong>Formspree</strong>{' '}
          (Formspree, Inc.), qui transmet le contenu à notre boîte email. À ce titre, vos données peuvent être
          traitées sur des serveurs situés <strong>aux États-Unis</strong>, dans le cadre des garanties prévues
          par la réglementation (clauses contractuelles types). Vos données ne sont ni vendues, ni cédées à des
          tiers à des fins commerciales.
        </p>
      </LegalSection>

      <LegalSection heading="5. Durée de conservation">
        <p style={{ margin: 0 }}>
          Vos données sont conservées le temps nécessaire au traitement de votre demande, puis archivées ou
          supprimées au maximum 3 ans après notre dernier échange.
        </p>
      </LegalSection>

      <LegalSection heading="6. Vos droits">
        <p style={{ margin: 0 }}>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation,
          d'opposition et de portabilité de vos données. Vous pouvez exercer ces droits à tout moment en nous
          écrivant à{' '}
          <a href="mailto:espacekodoro@gmail.com" style={{ color: '#C06040' }}>espacekodoro@gmail.com</a>.
          Vous avez également le droit d'introduire une réclamation auprès de la CNIL (
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: '#C06040' }}>www.cnil.fr</a>).
        </p>
      </LegalSection>

      <LegalSection heading="7. Cookies et mesure d'audience">
        <p style={{ margin: 0 }}>
          Ce site <strong>n'utilise pas de cookies de suivi ni d'outil de mesure d'audience publicitaire</strong>.
          La carte de localisation est affichée via OpenStreetMap ; selon votre navigateur, ce service peut
          déposer des données techniques nécessaires à son affichage.
        </p>
      </LegalSection>

      <LegalSection heading="8. Contact">
        <p style={{ margin: 0 }}>
          Pour toute question concernant vos données personnelles :{' '}
          <a href="mailto:espacekodoro@gmail.com" style={{ color: '#C06040' }}>espacekodoro@gmail.com</a>.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
