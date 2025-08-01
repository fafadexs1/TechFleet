
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DailyRecord, Technician, Vehicle, Payment } from '@/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, DollarSign, Wallet, Filter, TrendingUp, Car, PlusCircle, Paperclip, CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AddExpenseSheet } from '@/components/expenses/add-expense-sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

type GroupedExpenses = {
  [date: string]: {
    records: DailyRecord[];
    total: number;
    isPaid: boolean;
  };
};

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

interface ExpensesClientPageProps {
    allExpenses: DailyRecord[];
    technicians: Technician[];
    vehicles: Vehicle[];
}

export function ExpensesClientPage({ allExpenses: initialExpenses, technicians: initialTechnicians, vehicles: initialVehles }: ExpensesClientPageProps) {
  const [allExpenses, setAllExpenses] = useState<DailyRecord[]>(initialExpenses);
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehles);
  const [loadingPayment, setLoadingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [isAddSheetOpen, setAddSheetOpen] = useState(false);

  const fetchData = async () => {
    const { data: expensesData } = await supabase.from('registros').select('*').gt('gasto', 0).order('datahora', { ascending: false });
    if(expensesData) setAllExpenses(expensesData as DailyRecord[]);
    
    const { data: techsData } = await supabase.from('membros').select('*');
    if (techsData) setTechnicians(techsData as Technician[]);
    
    const { data: vehiclesData } = await supabase.from('carros').select('*');
    if (vehiclesData) setVehicles(vehiclesData as Vehicle[]);
  };

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
    fetchData(); 
    setAddSheetOpen(false);
  }

  const handleConfirmPayment = async (date: string) => {
    setLoadingPayment(date);
    const dayData = groupedExpenses[date];
    const recordsToUpdate = dayData.records.filter(r => !r.pago);
    const recordIdsToUpdate = recordsToUpdate.map(r => r.id);

    if (recordsToUpdate.length === 0) {
        toast({ title: "Nenhuma despesa para pagar", variant: "destructive"});
        setLoadingPayment(null);
        return;
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Erro de autenticação", description: "Usuário não encontrado. Faça login novamente.", variant: "destructive"});
        setLoadingPayment(null);
        return;
    }

    const receiptUrls = recordsToUpdate
      .map(r => r.comprovante_gasolina)
      .filter((url): url is string => !!url);
    
    const expenseValues = recordsToUpdate
        .map(r => r.gasto)
        .filter((gasto): gasto is number => gasto !== null && gasto !== undefined);

    const { error: paymentError } = await supabase
      .from('pagamentos')
      .insert({ 
            motivo: 'Abastecimento',
            nomepagamento: `Despesas do dia ${format(parseISO(date), 'dd/MM/yyyy')}`,
            valorapagar: dayData.total,
            pagamentofeito: true,
            tecnico: user.id,
            created_at: new Date().toISOString(),
            comprovantes_abastecimentos: receiptUrls.length > 0 ? receiptUrls : null,
            valores_abastecidos: expenseValues,
       });

    if (paymentError) {
        toast({ title: "Erro ao registrar pagamento", description: paymentError.message, variant: "destructive" });
        setLoadingPayment(null);
        return;
    }

    const { error: updateError } = await supabase
        .from('registros')
        .update({ pago: true })
        .in('id', recordIdsToUpdate);
    
    if (updateError) {
        toast({ title: "Erro ao atualizar despesas", description: updateError.message, variant: "destructive" });
        // Here you might want to handle the fact that the payment was created but expenses were not updated.
    } else {
        toast({ title: "Pagamento Confirmado!", description: `As despesas do dia ${format(parseISO(date), 'dd/MM/yyyy')} foram marcadas como pagas.`});
        fetchData();
    }

    setLoadingPayment(null);
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-end">
            <Sheet open={isAddSheetOpen} onOpenChange={setAddSheetOpen}>
            <SheetTrigger asChild>
                <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Despesa
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto">
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
            <CardContent className="flex flex-wrap gap-4">
                <div className="flex flex-col gap-2 flex-grow sm:flex-grow-0 sm:w-[180px]">
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
                <div className="flex flex-col gap-2 flex-grow sm:flex-grow-0 sm:w-[120px]">
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

        {filteredExpenses.length > 0 && (
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


      {sortedDates.length === 0 ? (
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
            const isLoading = loadingPayment === date;
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
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
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
                            <TableCell className="text-center">
                              <Badge variant={record.pago ? 'secondary' : 'outline'}>
                                {record.pago ? 'Pago' : 'Pendente'}
                              </Badge>
                            </TableCell>
                             <TableCell className="text-right">
                              {record.comprovante_gasolina && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <Paperclip className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                      <DialogTitle>Comprovante de Despesa</DialogTitle>
                                    </DialogHeader>
                                    <div className="relative h-[80vh] w-full">
                                      <Image
                                        src={record.comprovante_gasolina}
                                        alt={`Comprovante para ${record.registro_motivo}`}
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        data-ai-hint="receipt"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {!dayData.isPaid && (
                        <div className="mt-4 flex justify-end">
                            <Button onClick={() => handleConfirmPayment(date)} disabled={isLoading}>
                                <CheckCircle className="mr-2 h-4 w-4"/>
                                {isLoading ? 'Processando...' : 'Confirmar Pagamento do Dia'}
                            </Button>
                        </div>
                    )}
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
