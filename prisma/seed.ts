import { PrismaClient, Role, AdStatus, AdTier, Gender } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Bypass du URL-parser Prisma (cassé sur les passwords avec `@`) — on délègue
// au driver `pg` qui gère correctement les caractères URL-encodés.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Images thématiques Unsplash (paramètres ?w=800&auto=format = optim auto)
const IMG = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&auto=format&q=80`;

const CITIES = [
  {
    name: "Douala", slug: "douala", region: "Littoral", isPopular: true, order: 1, population: 3000000,
    // Skyline / port moderne
    imageUrl: IMG("1564507592333-c60657eea523"),
    description: "Capitale économique du Cameroun, ville cosmopolite et port animé sur l'Atlantique.",
  },
  {
    name: "Yaoundé", slug: "yaounde", region: "Centre", isPopular: true, order: 2, population: 2800000,
    // Ville sur les collines
    imageUrl: IMG("1580060839134-75a5edca2e99"),
    description: "La capitale politique, perchée sur sept collines verdoyantes.",
  },
  {
    name: "Bafoussam", slug: "bafoussam", region: "Ouest", isPopular: true, order: 3, population: 350000,
    // Highlands / paysage vert
    imageUrl: IMG("1551803091-e20673f15770"),
    description: "Cœur des Grassfields Bamileke, traditions et marchés vibrants.",
  },
  {
    name: "Bamenda", slug: "bamenda", region: "Nord-Ouest", isPopular: true, order: 4, population: 500000,
    // Mountainous landscape
    imageUrl: IMG("1486325212027-8081e485255e"),
    description: "Métropole anglophone des hautes terres du Nord-Ouest.",
  },
  {
    name: "Garoua", slug: "garoua", region: "Nord", isPopular: true, order: 5, population: 600000,
    // Sahel / river
    imageUrl: IMG("1503614472-8c93d56e92ce"),
    description: "Carrefour culturel du Grand Nord, sur les rives de la Bénoué.",
  },
  {
    name: "Maroua", slug: "maroua", region: "Extrême-Nord", isPopular: false, order: 6, population: 320000,
    imageUrl: IMG("1473773508845-188df298d2d1"),
    description: "Porte d'entrée vers le parc de Waza et les paysages sahéliens.",
  },
  {
    name: "Ngaoundéré", slug: "ngaoundere", region: "Adamaoua", isPopular: false, order: 7, population: 250000,
    // Plateau / hills
    imageUrl: IMG("1448375240586-882707db888b"),
    description: "Le château d'eau du Cameroun, plateau de l'Adamaoua à 1100m.",
  },
  {
    name: "Bertoua", slug: "bertoua", region: "Est", isPopular: false, order: 8, population: 200000,
    // Forest / green
    imageUrl: IMG("1448375240586-882707db888b"),
    description: "Capitale de l'Est, aux portes de la grande forêt équatoriale.",
  },
  {
    name: "Ebolowa", slug: "ebolowa", region: "Sud", isPopular: false, order: 9, population: 90000,
    imageUrl: IMG("1567527044066-bdba2f6c1e2c"),
    description: "Cité du cacao, ville-jardin du Sud-Cameroun.",
  },
  {
    name: "Kribi", slug: "kribi", region: "Sud", isPopular: true, order: 10, population: 80000,
    // Tropical beach
    imageUrl: IMG("1507525428034-b723cf961d3e"),
    description: "Plages de sable fin et chutes de la Lobé — la perle balnéaire du Cameroun.",
  },
  {
    name: "Limbé", slug: "limbe", region: "Sud-Ouest", isPopular: true, order: 11, population: 120000,
    // Beach + volcano
    imageUrl: IMG("1519046904884-53103b34b206"),
    description: "Plages noires volcaniques au pied du Mont Cameroun.",
  },
  {
    name: "Buea", slug: "buea", region: "Sud-Ouest", isPopular: false, order: 12, population: 200000,
    // Mountain town
    imageUrl: IMG("1502082553048-f009c37129b9"),
    description: "Cité universitaire au pied du Mont Cameroun (4040m).",
  },
  {
    name: "Edéa", slug: "edea", region: "Littoral", isPopular: false, order: 13, population: 120000,
    // Waterfalls / river
    imageUrl: IMG("1472213984618-c79aaec7fef0"),
    description: "Ville industrielle, célèbre pour son barrage hydroélectrique.",
  },
  {
    name: "Kumba", slug: "kumba", region: "Sud-Ouest", isPopular: false, order: 14, population: 150000,
    imageUrl: IMG("1494522358652-f30e61a60313"),
    description: "Carrefour commercial du Sud-Ouest, surnommée \"K-Town\".",
  },
  {
    name: "Dschang", slug: "dschang", region: "Ouest", isPopular: false, order: 15, population: 100000,
    // Cool highlands
    imageUrl: IMG("1568234928966-359c35dd8327"),
    description: "Ville universitaire fraîche, perchée à 1400m d'altitude.",
  },
];

const SAMPLE_SERVICES = [
  "Massage", "Striptease", "GFE", "Sortie accompagnement", "Soirée",
  "Couple", "Domination soft", "Massage tantrique",
];

async function main() {
  console.log("🌱 Seeding database…");

  // --------- Villes ----------
  for (const c of CITIES) {
    await prisma.city.upsert({
      where: { slug: c.slug },
      update: c,
      create: c,
    });
  }
  console.log(`✓ ${CITIES.length} villes insérées`);

  // --------- Admin ----------
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@yamo.cm";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const hashed = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      password: hashed,
      name: "Administrateur",
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log(`✓ Admin: ${adminEmail} / ${adminPassword}`);

  // --------- Escort de démo ----------
  const escortEmail = "escort@yamo.cm";
  const escortPwd = await bcrypt.hash("Demo1234!", 10);

  const escortUser = await prisma.user.upsert({
    where: { email: escortEmail },
    update: {},
    create: {
      email: escortEmail,
      password: escortPwd,
      name: "Sandra Demo",
      role: Role.ESCORT,
      phone: "+237600000001",
      emailVerified: new Date(),
    },
  });

  const profile = await prisma.escortProfile.upsert({
    where: { userId: escortUser.id },
    update: {},
    create: {
      userId: escortUser.id,
      displayName: "Sandra",
      slug: "sandra-demo",
      bio: "Charmante, douce et professionnelle. Disponible pour des moments inoubliables.",
      age: 24,
      gender: Gender.FEMALE,
      height: 170,
      weight: 60,
      ethnicity: "Camerounaise",
      languages: ["Français", "Anglais"],
      isVerified: true,
      verifiedAt: new Date(),
    },
  });

  // --------- Annonces de démo ----------
  const douala = await prisma.city.findUnique({ where: { slug: "douala" } });
  const yaounde = await prisma.city.findUnique({ where: { slug: "yaounde" } });

  if (douala) {
    await prisma.ad.upsert({
      where: { slug: "sandra-massage-douala" },
      update: {},
      create: {
        ownerId: escortUser.id,
        profileId: profile.id,
        cityId: douala.id,
        title: "Sandra, massage et plus à Douala Bonapriso",
        slug: "sandra-massage-douala",
        description:
          "Bonjour messieurs, je suis Sandra, 24 ans, je vous propose un moment de détente totale dans un cadre discret et confortable à Bonapriso.",
        price: 25000,
        priceNight: 100000,
        whatsappPhone: "+237600000001",
        callPhone: "+237600000001",
        neighborhood: "Bonapriso",
        services: SAMPLE_SERVICES.slice(0, 4),
        status: AdStatus.ACTIVE,
        tier: AdTier.VIP,
        publishedAt: new Date(),
        promotedUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        incall: true,
        outcall: true,
        media: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
              isPrimary: true,
              isApproved: true,
              position: 0,
            },
            {
              url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
              isApproved: true,
              position: 1,
            },
          ],
        },
      },
    });
  }

  if (yaounde) {
    await prisma.ad.upsert({
      where: { slug: "demo-yaounde-bastos" },
      update: {},
      create: {
        ownerId: escortUser.id,
        profileId: profile.id,
        cityId: yaounde.id,
        title: "Soirée VIP à Bastos – Yaoundé",
        slug: "demo-yaounde-bastos",
        description: "Pour les hommes d'affaires de passage. Discrétion garantie.",
        price: 30000,
        whatsappPhone: "+237600000001",
        neighborhood: "Bastos",
        services: SAMPLE_SERVICES.slice(2, 6),
        status: AdStatus.ACTIVE,
        tier: AdTier.PREMIUM,
        publishedAt: new Date(),
        media: {
          create: [
            {
              url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800",
              isPrimary: true,
              isApproved: true,
            },
          ],
        },
      },
    });
  }

  // --------- Réglages du site ----------
  await prisma.siteSetting.upsert({
    where: { key: "tarifs.premium" },
    update: { value: "5000" },
    create: { key: "tarifs.premium", value: "5000" },
  });
  await prisma.siteSetting.upsert({
    where: { key: "tarifs.vip" },
    update: { value: "15000" },
    create: { key: "tarifs.vip", value: "15000" },
  });

  console.log("✅ Seed terminé");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
