import { redirect } from "next/navigation";
import { BadgeCheck, ShieldAlert } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerificationForm } from "./_form";

export default async function VerificationPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const latest = await prisma.idVerification.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">
          <BadgeCheck className="mr-2 inline h-7 w-7 text-sky-400" /> Vérification d'identité
        </h1>
        <p className="text-muted-foreground">
          Obtenez le badge <strong>Vérifiée</strong> sur toutes vos annonces. Confiance accrue → +50% de contacts.
        </p>
      </div>

      {latest?.status === "VERIFIED" && (
        <Card className="border-emerald-500/40 bg-emerald-500/10">
          <CardContent className="flex items-center gap-3 p-6">
            <BadgeCheck className="h-8 w-8 text-emerald-400" />
            <div>
              <p className="font-semibold">Profil vérifié ✅</p>
              <p className="text-sm text-muted-foreground">
                Le badge "Vérifiée" est visible sur toutes vos annonces.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {latest?.status === "PENDING" && (
        <Card className="border-amber-500/40 bg-amber-500/10">
          <CardContent className="p-6">
            <Badge variant="outline">En cours d'examen</Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              Vos documents sont examinés. Délai habituel : 24-48h.
            </p>
          </CardContent>
        </Card>
      )}

      {latest?.status === "REJECTED" && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="p-6">
            <p className="font-semibold text-destructive">Vérification refusée</p>
            <p className="mt-1 text-sm">Motif : {latest.rejectionReason}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Vous pouvez soumettre une nouvelle demande ci-dessous.
            </p>
          </CardContent>
        </Card>
      )}

      {(!latest || latest.status === "REJECTED") && (
        <>
          <Card className="border-sky-500/30 bg-sky-500/5">
            <CardContent className="space-y-2 p-6">
              <h2 className="flex items-center gap-2 font-display text-xl font-bold">
                <ShieldAlert className="h-5 w-5 text-sky-400" /> Comment procéder
              </h2>
              <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
                <li>Photo nette du <strong>recto</strong> de votre CNI ou passeport</li>
                <li>Photo nette du <strong>verso</strong> (si CNI)</li>
                <li>
                  <strong>Selfie</strong> en train de tenir votre pièce d'identité, avec une feuille datée
                  d'aujourd'hui où vous avez écrit "Yamo" + la date
                </li>
                <li>Vos données sont chiffrées et ne sont visibles que par l'équipe de modération</li>
              </ul>
            </CardContent>
          </Card>

          <VerificationForm />
        </>
      )}
    </div>
  );
}
