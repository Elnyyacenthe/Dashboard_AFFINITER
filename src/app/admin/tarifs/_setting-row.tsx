"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { SiteSetting } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateSettingAction } from "@/lib/actions/settings";

export function SettingRow({ setting }: { setting: SiteSetting }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(setting.value);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await updateSettingAction({ key: setting.key, value });
        toast.success("Réglage mis à jour");
        setEditing(false);
      } catch {
        toast.error("Erreur");
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/40 p-3">
      <div className="flex-1">
        <p className="text-sm font-medium">{setting.label ?? setting.key}</p>
        <p className="text-xs font-mono text-muted-foreground">{setting.key}</p>
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-32"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
          <Button onClick={save} size="icon" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button onClick={() => { setValue(setting.value); setEditing(false); }} size="icon" variant="ghost">
            ✕
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold">{setting.value}</span>
          <Button onClick={() => setEditing(true)} size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
