
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, DollarSign, Wallet } from 'lucide-react';

type GroupedExpenses = {
  [date: string]: {
    records: DailyRecord[];
    total: number;
    isPaid: boolean;
  };
};

const ExpenseSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-5 w-24 ml-auto" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('registros')
        .select('*')
        .gt('gasto', 0)
        .order('datahora', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        setError('Não foi possível carregar as despesas.');
      } else {
        setExpenses(data as DailyRecord[]);
      }
      setLoading(false);
    };
    fetchExpenses();
  }, []);

  const groupedExpenses = useMemo(() => {
    return expenses.reduce((acc, record) => {
      const date = format(parseISO(record.datahora), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = {
          records: [],
          total: 0,
          isPaid: true,
        };
      }
      acc[date].records.push(record);
      acc[date].total += record.gasto || 0;
      if (!record.pago) {
        acc[date].isPaid = false;
      }
      return acc;
    }, {} as GroupedExpenses);
  }, [expenses]);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));
  const defaultOpenAccordion = sortedDates.slice(0, 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
          <DollarSign className="h-7 w-7" />
          Controle de Despesas
        </h1>
        <p className="text-muted-foreground">
          Histórico de todos os gastos registrados, agrupados por dia.
        </p>
      </div>

      {loading ? (
        <ExpenseSkeleton />
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : sortedDates.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground">
            <Wallet className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-xl font-semibold">Nenhuma despesa encontrada</h3>
            <p>Não há registros de gastos no sistema.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={defaultOpenAccordion} className="w-full space-y-4">
          {sortedDates.map((date) => {
            const dayData = groupedExpenses[date];
            return (
              <AccordionItem value={date} key={date} className="border-none">
                <Card>
                  <AccordionTrigger className="p-6 hover:no-underline">
                    <div className="flex justify-between items-center w-full">
                      <div className="text-left">
                        <h2 className="font-headline text-xl font-semibold">
                          {format(parseISO(`${date}T12:00:00Z`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {dayData.records.length} {dayData.records.length === 1 ? 'registro' : 'registros'} de despesa
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          R$ {dayData.total.toFixed(2).replace('.', ',')}
                        </p>
                        <Badge variant={dayData.isPaid ? 'secondary' : 'destructive'}>
                          {dayData.isPaid ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hora</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Técnico</TableHead>
                          <TableHead>Placa</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                          <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dayData.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{format(parseISO(record.datahora), 'HH:mm')}</TableCell>
                            <TableCell className="font-medium">{record.registro_motivo}</TableCell>
                            <TableCell>{record.tecnico_nome}</TableCell>
                            <TableCell>{record.placa_carro}</TableCell>
                            <TableCell className="text-right font-mono">
                              R$ {record.gasto?.toFixed(2).replace('.', ',')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={record.pago ? 'secondary' : 'outline'}>
                                {record.pago ? 'Pago' : 'Pendente'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
