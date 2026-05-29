import { AdCard, type AdCardData } from "./ad-card";

export function AdGrid({ ads, priority = 4 }: { ads: AdCardData[]; priority?: number }) {
  if (ads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-12 text-center">
        <p className="text-muted-foreground">Aucune annonce trouvée.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-4">
      {ads.map((ad, idx) => (
        <AdCard key={ad.id} ad={ad} priority={idx < priority} />
      ))}
    </div>
  );
}
