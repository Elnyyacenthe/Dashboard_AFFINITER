import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert, FileText, Scale, AlertTriangle, Info, CheckCircle2, XCircle } from "lucide-react";

import { SITE_NAME } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description: `Conditions Générales d'Utilisation de la plateforme ${SITE_NAME}.`,
};

const LAST_UPDATE = "29 mai 2026";

// =====================================================================
// PRIMITIVES UI
// =====================================================================

type SectionTone = "default" | "danger" | "warning" | "info";

function Section({
  num,
  id,
  title,
  tone = "default",
  children,
}: {
  num: string;
  id: string;
  title: string;
  tone?: SectionTone;
  children: React.ReactNode;
}) {
  const palette = {
    default: { ring: "ring-primary/20", badgeBg: "bg-primary/15", badgeText: "text-primary", bar: "bg-primary" },
    danger:  { ring: "ring-destructive/30", badgeBg: "bg-destructive/20", badgeText: "text-destructive", bar: "bg-destructive" },
    warning: { ring: "ring-amber-500/30", badgeBg: "bg-amber-500/20", badgeText: "text-amber-300", bar: "bg-amber-500" },
    info:    { ring: "ring-sky-500/30", badgeBg: "bg-sky-500/20", badgeText: "text-sky-300", bar: "bg-sky-500" },
  }[tone];

  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold ring-1 ${palette.ring} ${palette.badgeBg} ${palette.badgeText}`}
        >
          {num}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-bold leading-tight md:text-3xl">{title}</h2>
          <div className={`mt-2 h-0.5 w-12 rounded-full ${palette.bar}`} />
        </div>
      </div>
      <div className="ml-0 mt-5 space-y-4 text-[15px] leading-relaxed text-foreground/85 md:ml-16">
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mt-6 flex items-center gap-2 text-base font-bold text-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-pretty">{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-2.5 text-foreground/85">
      {Array.isArray(children) ? children : [children]}
    </ul>
  );
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
      <span className="flex-1">{children}</span>
    </li>
  );
}

function Callout({
  variant,
  title,
  children,
}: {
  variant: "danger" | "warning" | "info" | "success";
  title?: string;
  children: React.ReactNode;
}) {
  const config = {
    danger: {
      Icon: ShieldAlert,
      cls: "border-destructive/40 bg-destructive/10 text-foreground",
      iconCls: "text-destructive",
      titleCls: "text-destructive",
    },
    warning: {
      Icon: AlertTriangle,
      cls: "border-amber-500/40 bg-amber-500/10 text-foreground",
      iconCls: "text-amber-400",
      titleCls: "text-amber-300",
    },
    info: {
      Icon: Info,
      cls: "border-sky-500/40 bg-sky-500/10 text-foreground",
      iconCls: "text-sky-400",
      titleCls: "text-sky-300",
    },
    success: {
      Icon: CheckCircle2,
      cls: "border-emerald-500/40 bg-emerald-500/10 text-foreground",
      iconCls: "text-emerald-400",
      titleCls: "text-emerald-300",
    },
  }[variant];

  const { Icon } = config;

  return (
    <div className={`my-4 rounded-xl border p-4 ${config.cls}`}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${config.iconCls}`} />
        <div className="space-y-1 text-sm leading-relaxed">
          {title && <p className={`font-semibold ${config.titleCls}`}>{title}</p>}
          <div className="text-foreground/90">{children}</div>
        </div>
      </div>
    </div>
  );
}

function YesNo({ yes, no }: { yes: string[]; no: string[] }) {
  return (
    <div className="my-4 grid gap-3 md:grid-cols-2">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="mb-2 flex items-center gap-2 font-semibold text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Autorisé
        </p>
        <ul className="space-y-1.5 text-sm">
          {yes.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
              {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="mb-2 flex items-center gap-2 font-semibold text-destructive">
          <XCircle className="h-4 w-4" /> Interdit
        </p>
        <ul className="space-y-1.5 text-sm">
          {no.map((t) => (
            <li key={t} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-destructive" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// =====================================================================
// TABLE DES MATIÈRES
// =====================================================================

const TOC: Array<{ num: string; title: string; id: string; tone?: SectionTone }> = [
  { num: "01", title: "Préambule et acceptation", id: "preambule" },
  { num: "02", title: "Restriction 18+", id: "age", tone: "warning" },
  { num: "03", title: "Protection des mineurs", id: "mineurs", tone: "danger" },
  { num: "04", title: "Traite et exploitation", id: "traite", tone: "danger" },
  { num: "05", title: "Statut d'hébergeur", id: "hebergeur" },
  { num: "06", title: "Inscription et compte", id: "compte" },
  { num: "07", title: "Vérification d'identité (KYC)", id: "kyc", tone: "info" },
  { num: "08", title: "Contenu autorisé / interdit", id: "contenu", tone: "warning" },
  { num: "09", title: "Photos et vidéos", id: "media" },
  { num: "10", title: "Publication et modération", id: "publication" },
  { num: "11", title: "Engagements de l'Annonceur", id: "engagements" },
  { num: "12", title: "Rencontres physiques", id: "rencontres", tone: "warning" },
  { num: "13", title: "WhatsApp hors plateforme", id: "whatsapp" },
  { num: "14", title: "Wallet et Mobile Money", id: "wallet", tone: "info" },
  { num: "15", title: "Premium et VIP", id: "premium" },
  { num: "16", title: "Parrainage", id: "parrainage" },
  { num: "17", title: "Comportements interdits", id: "interdits", tone: "danger" },
  { num: "18", title: "Signalements et autorités", id: "signalement" },
  { num: "19", title: "Bannissement définitif", id: "ban", tone: "danger" },
  { num: "20", title: "Anti-fraude / blanchiment", id: "fraude", tone: "info" },
  { num: "21", title: "Sécurité", id: "securite" },
  { num: "22", title: "Géolocalisation", id: "geo" },
  { num: "23", title: "Propriété intellectuelle", id: "ip" },
  { num: "24", title: "Données et cookies", id: "donnees" },
  { num: "25", title: "Sous-traitants techniques", id: "soustraitants" },
  { num: "26", title: "Disponibilité et responsabilité", id: "service" },
  { num: "27", title: "Force majeure", id: "fm" },
  { num: "28", title: "Modifications", id: "modifs" },
  { num: "29", title: "Suppression du compte", id: "suppression" },
  { num: "30", title: "Droit et juridiction", id: "droit" },
];

// =====================================================================
// PAGE
// =====================================================================

export default function TermsPage() {
  return (
    <div className="relative">
      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />

      <div className="container py-12">
        {/* ============== HEADER ============== */}
        <header className="mx-auto mb-12 max-w-4xl space-y-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <FileText className="h-3.5 w-3.5" />
            Document légal contraignant
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight md:text-6xl">
            Conditions Générales <br className="hidden sm:block" />
            <span className="gradient-text">d'Utilisation</span>
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">
              Version {LAST_UPDATE}
            </span>
            <span className="rounded-full bg-secondary px-3 py-1 text-muted-foreground">
              30 articles
            </span>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-primary">
              {SITE_NAME} Cameroun
            </span>
          </div>
        </header>

        {/* ============== AVERTISSEMENT EN-TÊTE ============== */}
        <div className="mx-auto mb-10 max-w-4xl">
          <Callout variant="warning" title="Site exclusivement réservé aux personnes majeures (18 ans révolus)">
            Toute consultation par un mineur est strictement interdite et constitue une infraction
            pénale. {SITE_NAME} applique une <strong>tolérance zéro absolue</strong> contre toute
            infraction impliquant un mineur, la traite des êtres humains ou la contrainte. Tout
            signalement fondé fait l'objet d'une coopération immédiate avec les autorités camerounaises.
          </Callout>
        </div>

        {/* ============== LAYOUT 2 COLONNES ============== */}
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[280px_1fr]">

          {/* ====== SIDEBAR STICKY (DESKTOP) / DRAWER (MOBILE) ====== */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <nav className="rounded-2xl border border-border/60 bg-card/50 p-4 backdrop-blur">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sommaire
              </p>
              <ol className="max-h-[60vh] space-y-0.5 overflow-y-auto pr-1 text-[13px]">
                {TOC.map((item) => {
                  const colorCls =
                    item.tone === "danger"
                      ? "text-destructive/90 hover:bg-destructive/10"
                      : item.tone === "warning"
                        ? "text-amber-300 hover:bg-amber-500/10"
                        : item.tone === "info"
                          ? "text-sky-300 hover:bg-sky-500/10"
                          : "text-foreground/75 hover:bg-secondary";
                  return (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className={`flex items-baseline gap-2 rounded-md px-2 py-1.5 transition ${colorCls}`}
                      >
                        <span className="font-mono text-[10px] opacity-60">{item.num}</span>
                        <span className="line-clamp-1">{item.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          {/* ====== CONTENU PRINCIPAL ====== */}
          <main className="min-w-0 space-y-12">

            <Section num="01" id="preambule" title="Préambule, définitions et acceptation">
              <P>
                Les présentes Conditions Générales d'Utilisation (« CGU ») constituent un contrat
                juridiquement contraignant entre vous (« vous », « l'Utilisateur ») et la société
                éditrice de la plateforme {SITE_NAME} (« nous », « la Plateforme »), accessible à
                l'adresse <Link href="/" className="text-primary underline-offset-2 hover:underline">yamo.cm</Link>.
              </P>
              <P>
                En cochant la case « J'accepte les CGU » lors de l'inscription, en créant un compte
                ou en utilisant simplement le Site, vous reconnaissez sans réserve avoir lu, compris
                et accepté l'intégralité des présentes.{" "}
                <strong>Si vous n'acceptez pas une seule clause des CGU, vous devez immédiatement
                quitter le Site.</strong>
              </P>
              <SubTitle>Définitions clés</SubTitle>
              <UL>
                <LI><strong>Site / Plateforme</strong> : {SITE_NAME} et ses services associés.</LI>
                <LI><strong>Utilisateur</strong> : toute personne physique majeure utilisant le Site.</LI>
                <LI><strong>Visiteur</strong> : Utilisateur non connecté.</LI>
                <LI><strong>Client</strong> : Utilisateur n'ayant pas vocation à publier d'Annonce.</LI>
                <LI><strong>Annonceur / Escort</strong> : Utilisateur publiant des Annonces à titre personnel.</LI>
                <LI><strong>Modérateur</strong> : membre du staff chargé du contrôle des contenus.</LI>
                <LI><strong>Annonce</strong> : ensemble du contenu publié par un Annonceur.</LI>
                <LI><strong>Wallet</strong> : portefeuille électronique interne en FCFA.</LI>
                <LI><strong>Premium / VIP</strong> : abonnement payant de mise en avant.</LI>
                <LI><strong>K-Pay</strong> : prestataire technique de paiement Mobile Money.</LI>
              </UL>
            </Section>

            <Section num="02" id="age" tone="warning" title="Restriction d'âge — 18 ans et plus uniquement">
              <P>
                Le Site contient des contenus à caractère sexuel suggestif strictement destinés à un
                public adulte. L'accès est limité aux personnes ayant{" "}
                <strong>18 ans révolus</strong> dans leur pays de résidence.
              </P>
              <SubTitle>Mécanismes mis en place</SubTitle>
              <UL>
                <LI>Mur d'âge (« age-gate ») affiché lors de la première visite.</LI>
                <LI>Engagement contractuel sur l'honneur à l'inscription.</LI>
                <LI>Demande possible de pièce d'identité en cas de doute (article 7).</LI>
                <LI>Bannissement immédiat et définitif de tout mineur identifié.</LI>
              </UL>
              <Callout variant="danger">
                Toute fausse déclaration relative à l'âge peut faire l'objet de poursuites pénales
                pour corruption de mineurs (article 344 du Code pénal camerounais), faux et usage de
                faux, ou tentative de mise en relation à finalité sexuelle d'un mineur.
              </Callout>
              <P>
                Les parents et tuteurs sont expressément invités à utiliser des outils de contrôle
                parental sur tous les appareils accessibles à un mineur.
              </P>
            </Section>

            <Section num="03" id="mineurs" tone="danger" title="Protection des mineurs — tolérance zéro">
              <Callout variant="danger" title="Politique de tolérance zéro absolue">
                {SITE_NAME} ne tolère aucune annonce, photo, vidéo, message ou comportement
                impliquant, suggérant ou pouvant faire référence à un mineur (moins de 18 ans), même
                de manière indirecte ou implicite.
              </Callout>
              <SubTitle>Strictement et définitivement interdits</SubTitle>
              <UL>
                <LI>Toute représentation d'une personne mineure dans une Annonce.</LI>
                <LI>Toute suggestion d'âge inférieur à 18 ans dans le titre, la description, le pseudo, l'âge déclaré ou les hashtags.</LI>
                <LI>L'utilisation d'attributs visuels associés à l'enfance ou l'adolescence (uniformes scolaires, peluches, salons d'enfant, langage infantilisant…).</LI>
                <LI>Tout deepfake, retouche ou contenu généré par IA mettant en scène un mineur.</LI>
                <LI>Toute communication via WhatsApp / téléphone laissant supposer que la personne contactée serait mineure.</LI>
              </UL>
              <SubTitle>Conséquences immédiates</SubTitle>
              <UL>
                <LI>Bannissement définitif du compte, sans préavis ni remboursement.</LI>
                <LI><strong>Bannissement définitif de l'identité</strong> (article 19).</LI>
                <LI>Conservation des preuves (logs, IP, photos, échanges).</LI>
                <LI>Signalement immédiat à la <strong>Police judiciaire camerounaise</strong>, à INTERPOL (NCB Yaoundé) et coopération totale avec les enquêteurs.</LI>
                <LI>Saisie des fonds du Wallet à titre de réparation civile.</LI>
              </UL>
              <Callout variant="info" title="Vous avez un doute ?">
                Signalez immédiatement via le bouton « Signaler » ou par email à{" "}
                <strong>abuse@{SITE_NAME.toLowerCase()}.cm</strong>. Le signalement est anonyme,
                gratuit et traité en moins de 4 heures ouvrées.
              </Callout>
            </Section>

            <Section num="04" id="traite" tone="danger" title="Lutte contre la traite et l'exploitation">
              <P>
                {SITE_NAME} ne tolère aucune forme de <strong>traite des êtres humains</strong>, de{" "}
                <strong>proxénétisme</strong>, d'exploitation économique ou sexuelle, de contrainte
                physique ou psychologique, ni d'esclavage moderne, conformément à la{" "}
                <strong>loi camerounaise n°2011/024</strong> du 14 décembre 2011 relative à la lutte
                contre le trafic et la traite des personnes.
              </P>
              <SubTitle>Indicateurs surveillés par la modération</SubTitle>
              <UL>
                <LI>Plusieurs annonces gérées depuis une même IP / appareil pour des profils différents.</LI>
                <LI>Annonces dont le numéro WhatsApp ne correspond pas au profil.</LI>
                <LI>Signalements répétés de manipulation ou de contrainte par les clients.</LI>
                <LI>Descriptions stéréotypées identiques sur plusieurs annonces (réseau).</LI>
                <LI>Mention de « patron », « manager », « tiers à payer » dans les échanges.</LI>
              </UL>
              <Callout variant="info" title="Si vous êtes victime ou témoin">
                Appelez gratuitement le <strong>1500</strong> (numéro vert Cameroun), ou écrivez à{" "}
                abuse@{SITE_NAME.toLowerCase()}.cm. Votre démarche reste strictement anonyme.
              </Callout>
            </Section>

            <Section num="05" id="hebergeur" title="Nature du Site et qualité d'hébergeur">
              <P>
                {SITE_NAME} agit en qualité d'<strong>hébergeur technique</strong> au sens de la{" "}
                <strong>loi camerounaise n°2010/012</strong> du 21 décembre 2010 sur la cybersécurité
                et la cybercriminalité. La Plateforme se borne à fournir un espace de publication et
                de mise en relation, sans s'immiscer dans les transactions ou relations qui se nouent
                entre Utilisateurs.
              </P>
              <P>
                Les Annonces ne sont <strong>ni des offres d'emploi</strong>, <strong>ni des services
                rendus par {SITE_NAME}</strong>. Chaque Annonceur exerce à titre personnel, sous sa
                propre responsabilité fiscale et juridique. {SITE_NAME} ne perçoit aucune commission
                sur les prestations entre Utilisateurs.
              </P>
            </Section>

            <Section num="06" id="compte" title="Inscription, compte et identité">
              <P>L'inscription est gratuite. Elle requiert :</P>
              <UL>
                <LI>Une adresse email valide.</LI>
                <LI>Un numéro de téléphone camerounais (+237 6XX XX XX XX).</LI>
                <LI>Un mot de passe ≥ 8 caractères (haché bcrypt côté serveur, jamais stocké en clair).</LI>
                <LI>Le choix d'un rôle : Client ou Escort.</LI>
                <LI>L'acceptation expresse des présentes CGU et la confirmation d'âge.</LI>
              </UL>
              <SubTitle>Règles de compte</SubTitle>
              <UL>
                <LI><strong>Un seul compte par personne physique.</strong> Les comptes multiples sont détectés et bannis.</LI>
                <LI>Compte personnel, non transmissible, non revendable.</LI>
                <LI>Vous êtes seul responsable de vos identifiants. {SITE_NAME} ne pourra être tenu responsable des conséquences d'un partage volontaire ou d'un piratage dû à votre négligence.</LI>
                <LI>Toute connexion depuis votre compte est présumée être votre fait, sauf preuve contraire.</LI>
              </UL>
            </Section>

            <Section num="07" id="kyc" tone="info" title="Vérification d'identité (KYC) et badge Vérifié(e)">
              <P>
                Les Annonceurs peuvent (ou doivent en cas de doute) soumettre une vérification
                d'identité pour obtenir le badge <strong>Vérifié(e)</strong>.
              </P>
              <SubTitle>Pièces demandées</SubTitle>
              <UL>
                <LI>Recto de la CNI / passeport / permis (photo nette).</LI>
                <LI>Verso (CNI uniquement).</LI>
                <LI>Selfie tenant la pièce + une note datée du jour mentionnant « {SITE_NAME} ».</LI>
              </UL>
              <SubTitle>Traitement des documents</SubTitle>
              <UL>
                <LI>Documents chiffrés au repos et stockés sur un service partenaire conforme.</LI>
                <LI>Examen exclusif par l'équipe de modération sous 24-48h ouvrées.</LI>
                <LI>Le numéro de pièce <strong>n'est jamais stocké en clair</strong> — seul un hachage SHA-256 est conservé pour détecter des réinscriptions frauduleuses.</LI>
                <LI>Documents originaux supprimés après validation, sauf litige ou réquisition légale (conservation 5 ans max).</LI>
                <LI>Suppression à tout moment sur demande à privacy@{SITE_NAME.toLowerCase()}.cm.</LI>
              </UL>
              <Callout variant="danger">
                Toute pièce manifestement falsifiée, retouchée, prêtée ou ne correspondant pas au
                visage de l'Annonceur entraîne le bannissement immédiat et un signalement.
              </Callout>
            </Section>

            <Section num="08" id="contenu" tone="warning" title="Contenu autorisé et contenu interdit">
              <P>
                {SITE_NAME} autorise les Annonces de services d'accompagnement et de compagnie pour
                adultes consentants, dans le respect strict de la loi camerounaise.
              </P>
              <YesNo
                yes={[
                  "Photos de soi habillé(e) ou en tenue suggestive",
                  "Nudité partielle ou totale (Annonceur seul auteur)",
                  "Vidéos de présentation (≤ 60 secondes recommandées)",
                  "Description des services en termes non explicites",
                  "Tarifs et conditions clairs et non trompeurs",
                ]}
                no={[
                  "Représentation d'une personne mineure",
                  "Actes sexuels explicites en vidéo ou gros plan",
                  "Violence, viol, soumission non consentie, zoophilie",
                  "Contenu IA non déclaré comme tel",
                  "Photos volées d'autres profils, sites, réseaux sociaux",
                  "Promotion de drogues, armes, contrefaçons",
                  "Hyperliens externes vers des sites tiers",
                  "Informations bancaires complètes dans la description",
                ]}
              />
            </Section>

            <Section num="09" id="media" title="Droits sur les photos et vidéos publiées">
              <P>En publiant un contenu visuel, vous certifiez :</P>
              <UL>
                <LI>Être l'auteur(e) du contenu OU détenir une autorisation écrite du photographe/vidéaste.</LI>
                <LI>Avoir le consentement express de toute personne identifiable apparaissant sur le contenu.</LI>
                <LI>Ne porter atteinte à aucun droit d'auteur, marque ou droit à l'image.</LI>
              </UL>
              <SubTitle>Licence accordée à la Plateforme</SubTitle>
              <P>
                Vous accordez à {SITE_NAME} une licence non exclusive, gratuite, mondiale et limitée
                à la durée de publication de votre Annonce, aux seules fins d'hébergement,
                d'affichage, de redimensionnement, de mise en cache et de promotion interne du Site.
              </P>
              <P>
                <strong>Vous conservez la pleine propriété de vos contenus.</strong> Toute photo /
                vidéo est supprimée définitivement de nos serveurs sous 30 jours après suppression de
                l'Annonce ou du compte (sauf conservation légale obligatoire).
              </P>
              <Callout variant="danger" title="Revenge porn">
                La publication non consentie de contenus intimes est passible de poursuites pénales.
                Toute Annonce dont les photos auraient été publiées sans le consentement de la
                personne représentée sera retirée immédiatement et le compte signalé aux autorités.
              </Callout>
            </Section>

            <Section num="10" id="publication" title="Publication des annonces et modération">
              <UL>
                <LI>Toute Annonce nouvelle passe en statut <strong>« En modération »</strong> et est examinée sous 24h ouvrées.</LI>
                <LI>La modération peut <strong>approuver, refuser, demander des modifications ou bannir</strong> sans avoir à motiver sa décision.</LI>
                <LI>Une Annonce active peut être retirée à tout moment sur signalement fondé.</LI>
                <LI>Le tier (Standard / Premium / VIP) influe sur la visibilité mais <strong>jamais sur la rigueur de la modération</strong>.</LI>
                <LI>Annonce expirée (fin de période payée ou inactivité 60 jours) → désactivation automatique.</LI>
                <LI>{SITE_NAME} décline toute responsabilité quant aux délais de modération.</LI>
              </UL>
            </Section>

            <Section num="11" id="engagements" title="Engagements de l'Annonceur (déclaration sur l'honneur)">
              <P>À chaque publication d'Annonce, vous certifiez sur l'honneur :</P>
              <UL>
                <LI>Être <strong>majeur(e)</strong> au moment de la publication et le rester.</LI>
                <LI>Agir <strong>de votre plein gré</strong>, sans contrainte ni pression d'un tiers.</LI>
                <LI>Être seul(e) bénéficiaire des paiements perçus auprès des clients.</LI>
                <LI>Ne pas être sous l'influence d'un proxénète, « manager » ou réseau.</LI>
                <LI>Avoir le droit légal d'exercer cette activité dans le lieu indiqué.</LI>
                <LI>Détenir tous les droits sur les contenus publiés.</LI>
                <LI>Ne pas représenter ni évoquer un mineur, sous quelque forme que ce soit.</LI>
                <LI>Respecter la déontologie professionnelle (hygiène, sécurité sanitaire, consentement mutuel).</LI>
              </UL>
              <P>
                Toute fausse déclaration entraîne la résiliation immédiate du compte et expose son
                auteur à des poursuites pour faux et usage de faux.
              </P>
            </Section>

            <Section num="12" id="rencontres" tone="warning" title="Rencontres physiques — non-responsabilité">
              <Callout variant="danger" title="Important">
                {SITE_NAME} <strong>n'organise, ne facilite, ne supervise ni ne garantit aucune
                rencontre physique</strong> entre Utilisateurs. La mise en relation s'effectue
                exclusivement par WhatsApp ou téléphone, en dehors du Site.
              </Callout>
              <P>{SITE_NAME} ne saurait en aucun cas être tenu responsable :</P>
              <UL>
                <LI>Des prestations effectivement fournies (ou non) par un Annonceur.</LI>
                <LI>Du comportement d'un Utilisateur lors d'une rencontre physique.</LI>
                <LI>De tout préjudice physique, moral, financier ou sanitaire résultant d'une rencontre.</LI>
                <LI>De vols, agressions, escroqueries ou contaminations survenant hors du Site.</LI>
                <LI>Du non-respect des règles d'hygiène, de sécurité sanitaire ou de protection.</LI>
                <LI>De la véracité des informations affichées dans une Annonce.</LI>
              </UL>
              <P>
                Chaque Utilisateur est invité à exercer toutes les précautions d'usage : lieu public
                pour le premier contact, prévenir un proche, ne jamais payer à l'avance, utiliser des
                moyens de protection sanitaire.
              </P>
            </Section>

            <Section num="13" id="whatsapp" title="Communication WhatsApp / téléphone hors plateforme">
              <P>
                Les échanges entre Client et Annonceur s'effectuent <strong>directement</strong> via
                WhatsApp ou téléphone, après affichage du numéro masqué. {SITE_NAME} n'a aucun accès
                aux conversations privées et ne peut donc{" "}
                <strong>ni les modérer, ni les conserver, ni témoigner de leur contenu</strong>.
              </P>
              <SubTitle>Ce que cela implique pour vous</SubTitle>
              <UL>
                <LI>Tout échange explicite ou litigieux hors du Site est régi par les CGU de WhatsApp / votre opérateur, pas par les nôtres.</LI>
                <LI>{SITE_NAME} ne pourra produire aucune preuve de conversation en cas de litige hors plateforme.</LI>
                <LI>Vous êtes invité(e) à capturer vous-même les échanges importants (engagement, refus, abus).</LI>
              </UL>
            </Section>

            <Section num="14" id="wallet" tone="info" title="Wallet, dépôts et retraits Mobile Money">
              <P>
                Chaque compte dispose d'un <strong>Wallet</strong> interne libellé en FCFA,
                créditable et débitable via Mobile Money (MTN MoMo / Orange Money), traité par notre
                partenaire technique <strong>K-Pay</strong>.
              </P>
              <SubTitle>Règles applicables</SubTitle>
              <UL>
                <LI>Dépôt minimum : <strong>500 FCFA</strong> · maximum : 1 000 000 FCFA / transaction.</LI>
                <LI>Retrait minimum : <strong>5 000 FCFA</strong> · des frais peuvent s'appliquer.</LI>
                <LI>Frais de transaction K-Pay (2%) déduits du montant.</LI>
                <LI>Dépôts <strong>définitifs et non remboursables</strong> (sauf erreur technique prouvée).</LI>
                <LI>Retraits traités sous 24h ouvrées, sauf vérification anti-fraude.</LI>
                <LI>Le Wallet n'a pas vocation d'épargne : il sert à payer les options Yamo ou être retiré.</LI>
                <LI>Aucun intérêt n'est versé sur le solde du Wallet.</LI>
              </UL>
              <SubTitle>Wallet dormant</SubTitle>
              <P>
                Un Wallet inactif depuis plus de 12 mois pourra être suspendu. Le solde reste la
                propriété de l'Utilisateur et lui sera reversé sur demande, après vérification.
              </P>
            </Section>

            <Section num="15" id="premium" title="Options Premium et VIP — politique de paiement">
              <P>
                Les options <strong>Premium</strong> (5 000 FCFA / 30j) et <strong>VIP</strong>{" "}
                (15 000 FCFA / 30j) donnent accès à des avantages de visibilité décrits sur{" "}
                <Link href="/tarifs" className="text-primary underline-offset-2 hover:underline">
                  /tarifs
                </Link>. Les prix peuvent être actualisés à tout moment.
              </P>
              <SubTitle>Politique de remboursement</SubTitle>
              <UL>
                <LI><strong>Aucun remboursement</strong> dû en cas de violation des CGU, bannissement, retrait pour modération, suspension volontaire ou perte de mot de passe.</LI>
                <LI>En cas de bug technique de notre côté, un crédit Wallet équivalent peut être octroyé sur demande motivée.</LI>
                <LI>L'expiration du tier ramène automatiquement l'Annonce en Standard sans préavis.</LI>
                <LI>Le tier <strong>n'est pas renouvelé automatiquement</strong> : chaque période doit être souscrite à nouveau.</LI>
              </UL>
              <SubTitle>Fiscalité</SubTitle>
              <P>
                Les prix s'entendent toutes taxes comprises. Chaque Annonceur est responsable de ses
                obligations fiscales personnelles vis-à-vis de la Direction Générale des Impôts du
                Cameroun.
              </P>
            </Section>

            <Section num="16" id="parrainage" title="Parrainage et bonus">
              <UL>
                <LI>Chaque Utilisateur reçoit un code parrainage unique <code className="rounded bg-secondary px-1 font-mono">YAMO-XXXXXX</code>.</LI>
                <LI>L'inscription d'un filleul avec votre code octroie un bonus immédiat.</LI>
                <LI>Le premier paiement Premium ou VIP de votre filleul octroie un bonus supplémentaire.</LI>
                <LI>Un Utilisateur ne peut être parrainé qu'une seule fois.</LI>
                <LI><strong>Auto-parrainage et faux comptes strictement interdits</strong> — bannissement immédiat.</LI>
                <LI>{SITE_NAME} se réserve le droit d'annuler des bonus suspectés frauduleux.</LI>
              </UL>
            </Section>

            <Section num="17" id="interdits" tone="danger" title="Comportements strictement interdits">
              <P>Constituent des violations graves entraînant le bannissement définitif :</P>
              <UL>
                <LI>Toute infraction visant les articles 3 (mineurs) et 4 (traite).</LI>
                <LI>Faux profil, usurpation d'identité, vol de photos.</LI>
                <LI>Spam, harcèlement, menaces, chantage, diffamation.</LI>
                <LI>Arnaque financière (paiement avant rencontre, fausses cartes, ingénierie sociale).</LI>
                <LI>Mise en relation pour actes illégaux (drogues, armes, contrefaçon).</LI>
                <LI>Comptes multiples ou contournement d'un bannissement.</LI>
                <LI>Scraping, aspiration de données, automatisation non autorisée.</LI>
                <LI>Exploitation de failles de sécurité (à signaler à security@{SITE_NAME.toLowerCase()}.cm).</LI>
                <LI>Injection de scripts, XSS, élévation de privilèges.</LI>
                <LI>Publicité non autorisée pour un site tiers ou service concurrent.</LI>
                <LI>Violation des CGU de K-Pay, UploadThing ou de tout partenaire technique.</LI>
              </UL>
            </Section>

            <Section num="18" id="signalement" title="Signalements et coopération avec les autorités">
              <P>
                Tout Utilisateur peut signaler une Annonce ou un comportement abusif via le bouton
                « Signaler » présent sur chaque fiche, ou par email anonyme à{" "}
                <strong>abuse@{SITE_NAME.toLowerCase()}.cm</strong>.
              </P>
              <SubTitle>Procédure interne</SubTitle>
              <UL>
                <LI>Examen sous 24h ouvrées (4h pour les cas urgents : mineur, traite).</LI>
                <LI>Retrait conservatoire possible pendant l'investigation.</LI>
                <LI>Notification anonyme au reporter de l'issue.</LI>
                <LI>Conservation des éléments de preuve (logs, captures, IP) pour 12 mois minimum.</LI>
              </UL>
              <SubTitle>Coopération avec les autorités</SubTitle>
              <P>
                {SITE_NAME} coopère pleinement avec la Police Nationale, la Gendarmerie, le Parquet
                et les autorités judiciaires sur simple réquisition régulière. Les données suivantes
                peuvent être transmises : identifiants, IP, photos, paiements, logs de connexion.
              </P>
              <P>
                En cas de menace imminente pour la vie d'une personne, {SITE_NAME} peut alerter les
                autorités de sa propre initiative.
              </P>
            </Section>

            <Section num="19" id="ban" tone="danger" title="Suspension, bannissement et bannissement définitif d'identité">
              <SubTitle>Mesures graduées</SubTitle>
              <UL>
                <LI><strong>Avertissement</strong> : infraction mineure non récidivante.</LI>
                <LI><strong>Retrait d'Annonce</strong> : photo non conforme, description trompeuse.</LI>
                <LI><strong>Suspension temporaire</strong> (1 à 90 jours) : récidive, signalements répétés.</LI>
                <LI><strong>Bannissement définitif du compte</strong> : violation grave ou récidive de suspension.</LI>
                <LI><strong>Bannissement définitif de l'identité</strong> : crime, mineur, traite, fraude organisée.</LI>
              </UL>
              <SubTitle>Mécanisme technique du ban d'identité</SubTitle>
              <P>
                Lors d'une infraction extrêmement grave confirmée, {SITE_NAME} peut inscrire le
                hachage SHA-256 du numéro d'identification (CNI / passeport) dans une liste noire.
              </P>
              <Callout variant="warning">
                <strong>Toute tentative ultérieure de réinscription avec la même pièce d'identité
                sera automatiquement bloquée</strong>, même après suppression du compte d'origine, de
                manière définitive. Recours possible par lettre motivée à{" "}
                legal@{SITE_NAME.toLowerCase()}.cm.
              </Callout>
            </Section>

            <Section num="20" id="fraude" tone="info" title="Anti-fraude, anti-blanchiment et lutte contre le spam">
              <P>{SITE_NAME} met en œuvre des mesures techniques de prévention :</P>
              <UL>
                <LI>Rate limiting sur les inscriptions, connexions, signalements, créations d'Annonces.</LI>
                <LI>Détection des dépôts multiples suspects (split / structuring).</LI>
                <LI>Plafond de dépôt journalier indicatif : 100 000 FCFA.</LI>
                <LI>Plafond de retrait sans KYC : 25 000 FCFA / semaine.</LI>
                <LI>Vérification d'identité obligatoire au-delà.</LI>
                <LI>Gel temporaire possible d'un Wallet en cas de soupçon.</LI>
                <LI>Signalement à l'<strong>ANIF</strong> (Agence Nationale d'Investigation Financière) en cas de soupçon avéré.</LI>
              </UL>
            </Section>

            <Section num="21" id="securite" title="Sécurité de votre compte et de vos rencontres">
              <SubTitle>Pour la sécurité du compte</SubTitle>
              <UL>
                <LI>Mot de passe unique de 12+ caractères mixant lettres, chiffres et symboles.</LI>
                <LI>Ne réutilisez pas votre mot de passe Yamo ailleurs.</LI>
                <LI>Ne le partagez jamais, ni par email ni par téléphone.</LI>
                <LI>Vérifiez l'URL <strong>https://yamo.cm</strong> avant de saisir vos identifiants.</LI>
                <LI>Déconnectez-vous des appareils partagés.</LI>
              </UL>
              <SubTitle>Pour les rencontres physiques</SubTitle>
              <UL>
                <LI>Premier rendez-vous toujours dans un lieu public.</LI>
                <LI>Prévenez un proche du lieu, de l'horaire, de l'identité.</LI>
                <LI>Ne payez jamais d'avance ni par avance partielle.</LI>
                <LI>Utilisez systématiquement des moyens de protection sanitaire.</LI>
                <LI>Faites confiance à votre intuition — en cas de malaise, partez.</LI>
                <LI>En cas d'agression : <strong>117</strong> (Police) ou <strong>113</strong> (Gendarmerie).</LI>
              </UL>
            </Section>

            <Section num="22" id="geo" title="Géolocalisation et confidentialité du numéro">
              <UL>
                <LI>{SITE_NAME} <strong>n'utilise pas votre géolocalisation GPS</strong> en temps réel.</LI>
                <LI>Seules la ville et le quartier déclarés dans le profil sont publics.</LI>
                <LI>Le numéro WhatsApp est <strong>masqué partiellement</strong> par défaut (ex : 6XX XX •• 12) et révélé uniquement au clic explicite du Client.</LI>
                <LI>Les IP des Clients sont <strong>anonymisées par hachage SHA-256</strong> et utilisées uniquement pour la lutte contre la fraude.</LI>
                <LI>Aucune adresse postale précise n'est publiée ni stockée.</LI>
              </UL>
            </Section>

            <Section num="23" id="ip" title="Propriété intellectuelle de la plateforme">
              <P>
                Le Site, son architecture, design, logo, charte graphique, bases de données et code
                source sont la propriété exclusive de {SITE_NAME}. Ils sont protégés par les lois sur
                la propriété intellectuelle, le droit d'auteur, le droit des marques et le droit{" "}
                <em>sui generis</em> des bases de données.
              </P>
              <P>
                Toute reproduction, représentation, modification, publication, adaptation,
                traduction, extraction ou réutilisation, partielle ou totale, est strictement
                interdite sans autorisation écrite préalable. Tout contrevenant s'expose à des
                poursuites pour contrefaçon.
              </P>
            </Section>

            <Section num="24" id="donnees" title="Données personnelles, cookies et traceurs">
              <P>
                Le traitement des données personnelles est détaillé dans notre{" "}
                <Link href="/confidentialite" className="text-primary underline-offset-2 hover:underline">
                  Politique de confidentialité
                </Link>{" "}
                et notre{" "}
                <Link href="/rgpd" className="text-primary underline-offset-2 hover:underline">
                  page RGPD
                </Link>, partie intégrante des présentes CGU.
              </P>
              <SubTitle>Cookies utilisés</SubTitle>
              <UL>
                <LI><strong>Session</strong> : cookie d'authentification chiffré, essentiel.</LI>
                <LI><strong>Theme</strong> : mémorise votre thème (dark / light).</LI>
                <LI><strong>Age-gate</strong> : mémorise votre confirmation d'âge.</LI>
              </UL>
              <Callout variant="success" title="Engagement vie privée">
                Aucun cookie publicitaire, aucun tracker tiers, aucun pixel Facebook ou Google
                Analytics. Vos données ne sont jamais vendues ni partagées à des fins commerciales.
              </Callout>
            </Section>

            <Section num="25" id="soustraitants" title="Sous-traitants et partenaires techniques">
              <P>{SITE_NAME} utilise les prestataires suivants pour assurer son fonctionnement :</P>
              <UL>
                <LI><strong>Supabase / Vercel</strong> — hébergement de la base de données et de l'application.</LI>
                <LI><strong>UploadThing</strong> — stockage des photos et vidéos.</LI>
                <LI><strong>K-Pay</strong> — traitement des paiements Mobile Money (MTN MoMo, Orange Money).</LI>
                <LI><strong>Resend</strong> — envoi des emails transactionnels.</LI>
              </UL>
              <P>
                Chaque prestataire est lié à {SITE_NAME} par un contrat de sous-traitance comportant
                des engagements de confidentialité et de sécurité conformes au RGPD.
              </P>
            </Section>

            <Section num="26" id="service" title="Disponibilité, maintenance et limitation de responsabilité">
              <P>
                {SITE_NAME} s'efforce d'assurer la disponibilité du Site 24h/24 et 7j/7, sans toutefois
                y être tenu. Des interruptions pour maintenance peuvent intervenir, de préférence en
                dehors des heures de pointe.
              </P>
              <P>{SITE_NAME} ne saurait être tenu responsable :</P>
              <UL>
                <LI>D'une indisponibilité technique, panne d'hébergement ou bug.</LI>
                <LI>D'une perte de données ou d'un déréférencement d'Annonce.</LI>
                <LI>D'un retard de paiement imputable à K-Pay ou aux opérateurs Mobile Money.</LI>
                <LI>D'un préjudice indirect (manque à gagner, atteinte à la réputation, perte d'opportunité).</LI>
              </UL>
              <Callout variant="info" title="Plafond de responsabilité">
                La responsabilité maximale de {SITE_NAME} envers un Utilisateur, tous chefs de
                préjudice confondus, est plafonnée à <strong>100 000 FCFA</strong> ou à la somme
                effectivement versée par l'Utilisateur au cours des 12 derniers mois, le montant le
                plus bas étant retenu.
              </Callout>
            </Section>

            <Section num="27" id="fm" title="Force majeure">
              <P>
                {SITE_NAME} ne saurait être tenu responsable d'une inexécution ou d'un retard
                d'exécution dû à un cas de force majeure ou à un événement indépendant de sa volonté
                : panne nationale d'Internet, blocage administratif, catastrophe naturelle,
                défaillance d'un opérateur de télécommunications, cyberattaque massive, guerre,
                insurrection, etc.
              </P>
            </Section>

            <Section num="28" id="modifs" title="Modification du Site et des CGU">
              <P>{SITE_NAME} se réserve le droit de modifier à tout moment et sans préavis :</P>
              <UL>
                <LI>Les fonctionnalités, design, arborescence, conditions d'accès.</LI>
                <LI>Les tarifs, durées et avantages des options Premium / VIP.</LI>
                <LI>Les conditions de dépôt, retrait et de parrainage.</LI>
                <LI>Les présentes CGU.</LI>
              </UL>
              <P>
                Toute modification substantielle est notifiée par email ou notification interne. La
                poursuite de l'utilisation du Site après modification vaut acceptation tacite.
              </P>
            </Section>

            <Section num="29" id="suppression" title="Suppression du compte et durée de conservation">
              <SubTitle>Suppression à votre initiative</SubTitle>
              <UL>
                <LI>Depuis votre espace personnel, à tout moment, sans justification.</LI>
                <LI>Effet immédiat : déconnexion + masquage des Annonces.</LI>
                <LI>Suppression définitive des données sous 30 jours.</LI>
                <LI>Conservation légale : factures (10 ans), logs (12 mois), KYC (5 ans).</LI>
              </UL>
              <SubTitle>Solde du Wallet à la suppression</SubTitle>
              <P>
                Tout solde doit être retiré <strong>avant</strong> suppression. À défaut, le solde
                est conservé 90 jours puis transféré sur un compte de provision. Restitution possible
                pendant 5 ans, sur demande motivée et vérification d'identité.
              </P>
              <SubTitle>Suppression à notre initiative</SubTitle>
              <P>
                {SITE_NAME} peut supprimer un compte en cas de violation des CGU, signalement fondé,
                ou inactivité prolongée (24 mois consécutifs sans connexion).
              </P>
            </Section>

            <Section num="30" id="droit" title="Droit applicable, médiation et juridiction">
              <P>
                Les présentes CGU sont régies, interprétées et exécutées conformément au{" "}
                <strong>droit camerounais</strong>, et subsidiairement aux conventions internationales
                applicables.
              </P>
              <SubTitle>Règlement amiable</SubTitle>
              <P>
                Les Parties s'engagent à tenter de bonne foi un règlement amiable préalable, par
                échanges écrits, dans un délai de 30 jours. À défaut, le litige pourra être soumis à
                un médiateur indépendant.
              </P>
              <SubTitle>Juridiction compétente</SubTitle>
              <P>
                À défaut de règlement amiable, tout litige sera soumis à la compétence exclusive des{" "}
                <strong>tribunaux de Douala (Cameroun)</strong>, y compris en cas de pluralité de
                défendeurs ou d'appel en garantie.
              </P>
              <SubTitle>Divisibilité</SubTitle>
              <P>
                Si une clause des présentes CGU venait à être déclarée nulle ou inapplicable par une
                décision judiciaire, les autres clauses conserveraient l'intégralité de leur force
                obligatoire.
              </P>
            </Section>

            {/* Footer signature */}
            <div className="mt-12 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6">
              <div className="flex items-start gap-4">
                <Scale className="h-8 w-8 shrink-0 text-primary" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Document juridiquement contraignant</p>
                  <p className="text-muted-foreground">
                    Version applicable depuis le <strong>{LAST_UPDATE}</strong>. Les CGU précédentes
                    restent consultables sur demande motivée.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
