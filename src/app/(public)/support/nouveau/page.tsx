import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Card, CardContent } from "@/components/ui/card";
import { NewTicketForm } from "./_form";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion?callbackUrl=/support/nouveau");

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-bold">Nouveau ticket support</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          L'équipe Yamo vous répond généralement sous 24h ouvrées.
        </p>
        <Card className="mt-6">
          <CardContent className="p-6">
            <NewTicketForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
