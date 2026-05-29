import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/utils";

export const metadata: Metadata = { title: "RGPD" };

export default function RgpdPage() {
  return (
    <div className="container py-12">
      <article className="prose prose-invert mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold">Conformité RGPD</h1>
        <p>
          Bien que situé au Cameroun, {SITE_NAME} respecte les principes du Règlement Général sur la Protection des
          Données (UE 2016/679) pour ses utilisateurs européens éventuels.
        </p>

        <h2>Vos droits</h2>
        <ul>
          <li>
            <strong>Accès</strong> : recevoir une copie de vos données personnelles
          </li>
          <li>
            <strong>Rectification</strong> : corriger des données inexactes
          </li>
          <li>
            <strong>Suppression</strong> ("droit à l'oubli") : effacer votre compte et vos données
          </li>
          <li>
            <strong>Portabilité</strong> : exporter vos données dans un format lisible
          </li>
          <li>
            <strong>Opposition</strong> : refuser certains traitements
          </li>
          <li>
            <strong>Limitation</strong> : geler un traitement
          </li>
        </ul>

        <h2>Comment exercer ces droits ?</h2>
        <p>
          Écrivez à <strong>privacy@{SITE_NAME.toLowerCase()}.cm</strong> en précisant votre demande et en joignant
          une preuve d'identité. Délai de réponse maximum : 30 jours.
        </p>

        <h2>Base légale du traitement</h2>
        <ul>
          <li>Exécution du contrat (publication d'annonce)</li>
          <li>Intérêt légitime (sécurité, anti-fraude)</li>
          <li>Obligation légale (lutte contre la traite, signalement)</li>
          <li>Consentement (cookies non essentiels, marketing)</li>
        </ul>

        <h2>Transferts hors UE</h2>
        <p>
          Vos données peuvent être stockées sur des serveurs situés hors de l'UE (États-Unis). Ces transferts sont
          encadrés par des clauses contractuelles types.
        </p>

        <h2>Délégué à la protection des données</h2>
        <p>
          DPO : dpo@{SITE_NAME.toLowerCase()}.cm
        </p>
      </article>
    </div>
  );
}
