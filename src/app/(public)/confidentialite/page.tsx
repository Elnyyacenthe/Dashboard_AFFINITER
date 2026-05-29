import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/utils";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <div className="container py-12">
      <article className="prose prose-invert mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold">Politique de confidentialité</h1>

        <p>Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}</p>

        <h2>1. Données collectées</h2>
        <ul>
          <li>Email et téléphone à l'inscription</li>
          <li>Mot de passe (haché bcrypt — jamais stocké en clair)</li>
          <li>Photos et contenu d'annonces (uploadés volontairement)</li>
          <li>Données de session (cookies sécurisés)</li>
          <li>Adresse IP hachée (anonymisée SHA-256) pour la sécurité et anti-spam</li>
          <li>User-Agent et statistiques de consultation anonymes</li>
        </ul>

        <h2>2. Finalités</h2>
        <ul>
          <li>Fonctionnement de la plateforme (authentification, publication)</li>
          <li>Sécurité (anti-fraude, rate limiting)</li>
          <li>Statistiques agrégées (vues, clics)</li>
          <li>Communication transactionnelle</li>
        </ul>

        <h2>3. Conservation</h2>
        <p>
          Vos données sont conservées tant que votre compte est actif. À la suppression du compte, les données
          personnelles sont effacées sous 30 jours, sauf obligation légale de conservation.
        </p>

        <h2>4. Vos droits (RGPD)</h2>
        <p>
          Conformément au RGPD et à la loi camerounaise n°2010/012 sur la cybersécurité, vous disposez d'un droit
          d'accès, de rectification, de suppression, de portabilité et d'opposition. Exercez-les en écrivant à{" "}
          <strong>privacy@{SITE_NAME.toLowerCase()}.cm</strong>.
        </p>

        <h2>5. Cookies</h2>
        <p>
          {SITE_NAME} utilise uniquement des cookies techniques essentiels (session, authentification, préférence de
          thème). Aucun cookie publicitaire ou de pistage tiers.
        </p>

        <h2>6. Sécurité</h2>
        <p>
          Les mots de passe sont hachés (bcrypt), les communications chiffrées (HTTPS/TLS), et les uploads sont
          scannés. Aucun système n'est infaillible : signalez toute faille à <strong>security@{SITE_NAME.toLowerCase()}.cm</strong>.
        </p>

        <h2>7. Partage avec des tiers</h2>
        <p>
          Aucune donnée n'est vendue ni partagée à des fins commerciales. Les données peuvent être communiquées aux
          autorités judiciaires sur réquisition légale.
        </p>
      </article>
    </div>
  );
}
