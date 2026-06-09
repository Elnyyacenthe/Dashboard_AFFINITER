import Link from "next/link";
import { Eye } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatXAF, timeAgo } from "@/lib/utils";
import { AdTierSelector, AdBanButton } from "./_components/ad-actions";

const PER_PAGE = 25;

export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const status = (sp.status ?? "") as
    | ""
    | "ACTIVE"
    | "PENDING"
    | "PAUSED"
    | "REJECTED"
    | "BANNED"
    | "EXPIRED";
  const page = Math.max(1, Number(sp.page ?? "1"));

  const where: Prisma.AdWhereInput = {
    ...(status && { status }),
    ...(q && {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { owner: { email: { contains: q, mode: "insensitive" } } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: {
        city: { select: { name: true } },
        owner: { select: { email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.ad.count({ where }),
  ]);

  const pages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Toutes les annonces</h1>
          <p className="text-muted-foreground">{total} annonce{total > 1 ? "s" : ""}</p>
        </div>
      </div>

      <form className="flex gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par titre, email…"
          className="max-w-md"
        />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="ACTIVE">Actives</option>
          <option value="PENDING">En modération</option>
          <option value="PAUSED">En pause</option>
          <option value="REJECTED">Refusées</option>
          <option value="BANNED">Bannies</option>
          <option value="EXPIRED">Expirées</option>
        </select>
        <Button type="submit">Filtrer</Button>
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Annonce</th>
                <th className="p-3">Propriétaire</th>
                <th className="p-3">Ville</th>
                <th className="p-3">Prix</th>
                <th className="p-3">Statut</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Stats</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ad) => (
                <tr key={ad.id} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="p-3 max-w-xs">
                    <Link href={`/annonce/${ad.slug}`} target="_blank" className="line-clamp-2 hover:text-primary">
                      {ad.title}
                    </Link>
                  </td>
                  <td className="p-3 text-xs">{ad.owner.email}</td>
                  <td className="p-3">{ad.city.name}</td>
                  <td className="p-3">{formatXAF(ad.price)}</td>
                  <td className="p-3"><Badge variant="outline">{ad.status}</Badge></td>
                  <td className="p-3"><AdTierSelector adId={ad.id} current={ad.tier} /></td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {ad.views}👁 / {ad.whatsappClicks}💬
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{timeAgo(ad.createdAt)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/annonce/${ad.slug}`} target="_blank">
                          <Eye className="h-3 w-3" />
                        </Link>
                      </Button>
                      <AdBanButton adId={ad.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/annonces?page=${page - 1}&q=${q}&status=${status ?? ""}`}>
                ← Précédent
              </Link>
            </Button>
          )}
          <span className="text-sm">
            Page {page} / {pages}
          </span>
          {page < pages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/annonces?page=${page + 1}&q=${q}&status=${status ?? ""}`}>
                Suivant →
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
