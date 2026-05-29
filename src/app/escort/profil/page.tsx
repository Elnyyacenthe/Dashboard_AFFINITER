import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  const profile = await prisma.escortProfile.findUnique({
    where: { userId: session!.user.id },
  });
  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { email: true, phone: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground">Mettez à jour vos informations publiques</p>
      </div>

      {profile?.isVerified ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          <BadgeCheck className="h-4 w-4" />
          Profil vérifié — le badge "Vérifié" s'affiche sur toutes vos annonces
        </div>
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-sm font-semibold">Profil non vérifié</p>
              <p className="text-xs text-muted-foreground">
                Soumettez une vérification d'identité depuis Premium → Vérification pour obtenir le badge.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <ProfileForm
        profile={profile}
        user={user!}
      />
    </div>
  );
}
