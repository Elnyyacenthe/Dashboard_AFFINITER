"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { formatXAF } from "@/lib/utils";

interface Props {
  daily30: { day: string; total: number; count: number }[];
  byType: { type: string; total: number }[];
  byCity: { name: string; total: number }[];
}

const PIE_COLORS = ["#ec4899", "#a855f7", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];

export function RevenueCharts({ daily30, byType, byCity }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Line chart : revenus 30 jours */}
      <Card className="md:col-span-2">
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Évolution sur 30 jours</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={daily30}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(value: number) => [formatXAF(value), "Revenu"]}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Pie : revenu par type */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Par type</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={byType}
                dataKey="total"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(entry: { type: string }) => entry.type}
              >
                {byType.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(value: number) => formatXAF(value)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bar : revenu par ville */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Par ville</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byCity} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(value: number) => formatXAF(value)}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
