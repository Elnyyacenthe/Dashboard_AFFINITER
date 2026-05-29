import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const settings = await prisma.siteSetting.findMany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Réglages du site</h1>
        <p className="text-muted-foreground">Configuration globale</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-3 font-display text-xl font-bold">Variables actuelles</h2>
          <div className="space-y-2">
            {settings.map((s) => (
              <div key={s.key} className="flex justify-between border-b border-border/30 py-2 text-sm">
                <span className="font-mono">{s.key}</span>
                <span className="text-muted-foreground">{s.value}</span>
              </div>
            ))}
            {settings.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun réglage défini</p>
            )}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            UI d'édition à venir. En attendant, modifier directement via{" "}
            <code className="rounded bg-secondary px-1 py-0.5">prisma studio</code>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
