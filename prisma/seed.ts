import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

  // NB : aucun compte n'est créé par le seed. Le dashboard ne contient que des
  // comptes réels ; l'admin est désigné manuellement parmi les utilisateurs existants.

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
