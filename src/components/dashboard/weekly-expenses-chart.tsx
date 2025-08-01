
"use client"

import { useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { subDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DailyRecord } from "@/types"
import { BarChart3 } from "lucide-react"

interface WeeklyExpensesChartProps {
  records: DailyRecord[];
}

export function WeeklyExpensesChart({ records }: WeeklyExpensesChartProps) {

  const chartData = useMemo(() => {
    const today = new Date();
    const data: { date: string; name: string; total: number }[] = [];

    // Initialize with the last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        data.push({
            date: format(date, "yyyy-MM-dd"),
            name: format(date, "eee", { locale: ptBR }),
            total: 0,
        });
    }

    // Populate with actual data
    records.forEach(record => {
      if (record.gasto && record.gasto > 0) {
        const recordDate = format(new Date(record.datahora), "yyyy-MM-dd");
        const dayEntry = data.find(d => d.date === recordDate);
        if (dayEntry) {
            dayEntry.total += record.gasto;
        }
      }
    });

    return data;
  }, [records]);


  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary"/>
                Despesas da Semana
            </CardTitle>
            <CardDescription>
                Gastos totais dos últimos 7 dias.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                        return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="grid grid-cols-1 gap-1">
                                    <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                            {payload[0].payload.name}
                                        </span>
                                        <span className="font-bold text-muted-foreground">
                                            R$ {payload[0].value?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )
                        }
                        return null
                    }}
                 />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  )
}
