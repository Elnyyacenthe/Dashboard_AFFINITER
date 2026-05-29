import Link from "next/link";
import Image from "next/image";

const FALLBACK_GRADIENTS = [
  "from-pink-500 to-rose-700",
  "from-purple-500 to-indigo-700",
  "from-amber-500 to-orange-700",
  "from-cyan-500 to-blue-700",
  "from-emerald-500 to-teal-700",
];

export interface CityCardData {
  name: string;
  slug: string;
  imageUrl?: string | null;
  adCount?: number;
}

export function CityCard({ city, index = 0 }: { city: CityCardData; index?: number }) {
  const gradient = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];

  return (
    <Link
      href={`/ville/${city.slug}`}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-border/60 hover:border-primary/60 transition-all hover:-translate-y-1"
    >
      {city.imageUrl ? (
        <Image
          src={city.imageUrl}
          alt={city.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="font-display text-2xl font-bold">{city.name}</h3>
        {city.adCount !== undefined && (
          <p className="mt-1 text-xs text-white/80">
            {city.adCount} annonce{city.adCount > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
