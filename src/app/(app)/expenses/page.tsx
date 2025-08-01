
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord, Technician, Vehicle } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, DollarSign, Wallet, Filter, TrendingUp, Car, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AddExpenseSheet } from '@/components/expenses/add-expense-sheet';

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

const SummaryCard = ({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) => (
    <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary"/>
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-headline text-2xl font-bold">{value}</p>
        </div>
    </div>
);

export default function ExpensesPage() {
  const [allExpenses, setAllExpenses] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isAddSheetOpen, setAddSheetOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    const { data: expensesData, error: expensesError } = await supabase
      .from('registros')
      .select('*')
      .gt('gasto', 0)
      .order('datahora', { ascending: false });

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      setError('Não foi possível carregar as despesas.');
      setLoading(false);
      return;
    }
    setAllExpenses(expensesData as DailyRecord[]);

    // Fetch technicians and vehicles for the form
    const { data: techsData, error: techsError } = await supabase.from('membros').select('*');
    if (techsError) console.warn('Could not fetch technicians', techsError);
    else setTechnicians(techsData as Technician[]);
    
    const { data: vehiclesData, error: vehiclesError } = await supabase.from('carros').select('*');
    if (vehiclesError) console.warn('Could not fetch vehicles', vehiclesError);
    else setVehicles(vehiclesData as Vehicle[]);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const technicianMap = useMemo(() => {
    return new Map(technicians.map(t => [t.uuid, t]));
  }, [technicians]);

  const { years, monthOptions, filteredExpenses, summary } = useMemo(() => {
    const years = [...new Set(allExpenses.map(r => parseISO(r.datahora).getFullYear().toString()))].sort((a,b) => b.localeCompare(a));
    
    const monthOptions = [
        { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' }, { value: '08', 'label': 'Agosto' },
        { value: '09', 'label': 'Setembro' }, { value: '10', 'label': 'Outubro' },
        { value: '11', 'label': 'Novembro' }, { value: '12', 'label': 'Dezembro' }
    ];

    const filtered = allExpenses.filter(r => {
        const recordDate = parseISO(r.datahora);
        const yearMatch = recordDate.getFullYear().toString() === selectedYear;
        const monthMatch = (recordDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
        return yearMatch && monthMatch;
    });

    const summaryData = filtered.reduce((acc, record) => {
        acc.totalSpent += record.gasto || 0;
        
        if (record.placa_carro) {
            acc.carCounts[record.placa_carro] = (acc.carCounts[record.placa_carro] || 0) + 1;
        }

        return acc;
    }, { totalSpent: 0, carCounts: {} as Record<string, number> });

    const mostFrequentCar = Object.keys(summaryData.carCounts).length > 0 
        ? Object.entries(summaryData.carCounts).sort((a,b) => b[1] - a[1])[0][0]
        : 'Nenhum';

    const summary = {
        totalSpent: summaryData.totalSpent,
        totalTransactions: filtered.length,
        mostFrequentCar: mostFrequentCar
    }


    return { years, monthOptions, filteredExpenses: filtered, summary };
  }, [allExpenses, selectedYear, selectedMonth]);


  const groupedExpenses = useMemo(() => {
    return filteredExpenses.reduce((acc, record) => {
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
  }, [filteredExpenses]);

  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => b.localeCompare(a));
  const defaultOpenAccordion = sortedDates.slice(0, 1);

  const handleExpenseAdded = () => {
    fetchData(); // Refetch all data
    setAddSheetOpen(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-7 w-7" />
            Controle de Despesas
          </h1>
          <p className="text-muted-foreground">
            Histórico de todos os gastos registrados, agrupados por dia.
          </p>
        </div>
         <Sheet open={isAddSheetOpen} onOpenChange={setAddSheetOpen}>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Adicionar Nova Despesa</SheetTitle>
              <SheetDescription>
                Registre um novo gasto manualmente.
              </SheetDescription>
            </SheetHeader>
            <AddExpenseSheet 
                onExpenseAdded={handleExpenseAdded} 
                technicians={technicians} 
                vehicles={vehicles} 
            />
          </SheetContent>
        </Sheet>
      </div>

       <Card>
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5"/>
                    <h3 className="font-semibold text-lg">Filtros</h3>
                </div>
            </CardHeader>
            <CardContent className="flex gap-4">
                <div className="flex flex-col gap-2 w-[180px]">
                    <label className="text-sm font-medium">Mês</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger>
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                        {monthOptions.map(month => (
                                <SelectItem key={month.value} value={month.value}>
                                    {month.label}
                                </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2 w-[120px]">
                    <label className="text-sm font-medium">Ano</label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(year => (
                                <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        {!loading && filteredExpenses.length > 0 && (
             <Card>
                <CardHeader>
                     <CardTitle>Resumo do Mês</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <SummaryCard title="Gasto Total" value={`R$ ${summary.totalSpent.toFixed(2).replace('.', ',')}`} icon={DollarSign} />
                    <SummaryCard title="Total de Transações" value={summary.totalTransactions.toString()} icon={TrendingUp} />
                    <SummaryCard title="Carro Mais Utilizado" value={summary.mostFrequentCar} icon={Car} />
                </CardContent>
            </Card>
        )}


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
            <p>Não há registros de gastos para o período selecionado.</p>
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
                            <TableCell>{technicianMap.get(record.tecnicoresponsavel!)?.display_name || record.tecnico_nome}</TableCell>
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
