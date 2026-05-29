import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, trend, hint }: Props) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <p className={`mt-3 text-xs ${trend.isPositive ? "text-emerald-400" : "text-destructive"}`}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}% vs semaine dernière
          </p>
        )}
      </CardContent>
    </Card>
  );
}
