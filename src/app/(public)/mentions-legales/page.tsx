import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/utils";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalPage() {
  return (
    <div className="container py-12">
      <article className="prose prose-invert mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold">Mentions légales</h1>

        <h2>1. Éditeur du site</h2>
        <p>
          Le site <strong>{SITE_NAME}</strong> est édité par [Nom de la société], [forme juridique], au capital
          de [X] FCFA, immatriculée au RCCM de Douala sous le numéro [X], dont le siège social est situé à [adresse], Cameroun.
        </p>
        <p>Directeur de la publication : [Nom du responsable].</p>
        <p>Email : contact@{SITE_NAME.toLowerCase()}.cm</p>

        <h2>2. Hébergement</h2>
        <p>Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.</p>

        <h2>3. Public visé — Restriction d'âge</h2>
        <p>
          <strong>{SITE_NAME} est strictement réservé aux personnes majeures (18 ans et plus).</strong> Toute
          consultation par un mineur est interdite et constitue une infraction. Le site met en œuvre un mur d'âge
          (age-gate) et invite chaque visiteur à confirmer sa majorité avant accès.
        </p>

        <h2>4. Nature des annonces</h2>
        <p>
          {SITE_NAME} est une plateforme de mise en relation entre adultes consentants. Les annonceurs sont seuls
          responsables du contenu de leurs annonces et certifient sur l'honneur être majeurs et consentants.
          {SITE_NAME} agit en qualité d'hébergeur au sens de la LCEN.
        </p>

        <h2>5. Modération et signalement</h2>
        <p>
          Toute annonce signalée pour contenu illégal, traite des personnes, mineur ou contrainte est immédiatement
          examinée et, si fondée, supprimée. Les autorités compétentes sont saisies en cas d'infraction.
        </p>

        <h2>6. Propriété intellectuelle</h2>
        <p>
          L'ensemble du site, sa structure, son design, ses textes sont la propriété exclusive de {SITE_NAME}. Toute
          reproduction est interdite sans autorisation préalable écrite.
        </p>

        <h2>7. Contact</h2>
        <p>Pour toute question : contact@{SITE_NAME.toLowerCase()}.cm</p>
      </article>
    </div>
  );
}
