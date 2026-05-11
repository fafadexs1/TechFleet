
'use client';

import { useState, useEffect, useMemo } from 'react';
import { getTechnicianRecords } from '@/app/actions/technicians';
import type { DailyRecord, Technician } from '@/types';
import { AlertCircle, Calendar as CalendarIcon, Fuel, Route, Filter, Car } from 'lucide-react';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { Badge } from '../ui/badge';

interface TechnicianHistorySheetProps {
  technician: Technician;
}

const HistorySkeleton = () => (
    <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                </div>
            </div>
        ))}
    </div>
);

export function TechnicianHistorySheet({ technician }: TechnicianHistorySheetProps) {
  const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  useEffect(() => {
    const fetchAllRecords = async () => {
        if (!technician?.uuid) {
            setError("ID do técnico não encontrado. Não é possível buscar o histórico.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        
        const data = await getTechnicianRecords(technician.uuid);
        setAllRecords(data as DailyRecord[]);
        setLoading(false);
    };

    fetchAllRecords();
  }, [technician]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      const recordDate = new Date(record.datahora);
      if (!dateRange?.from || !dateRange?.to) return true;
      // Adjust the end of the day for the 'to' date to include all records on that day
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      return recordDate >= dateRange.from && recordDate <= toDate;
    });
  }, [allRecords, dateRange]);


  const EventIcon = ({ motivo }: { motivo: string }) => {
    const iconWrapperClass = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
    if (motivo === 'Expediente') {
        return <div className={`${iconWrapperClass} bg-blue-100 text-blue-600`}><Route className="h-5 w-5"/></div>
    }
    if (motivo === 'Abastecimento') {
        return <div className={`${iconWrapperClass} bg-green-100 text-green-600`}><Fuel className="h-5 w-5"/></div>
    }
    return <div className={`${iconWrapperClass} bg-muted text-muted-foreground`}><CalendarIcon className="h-5 w-5"/></div>
  }

  const ExpedienteDetails = ({ record }: { record: DailyRecord }) => (
      <div className="text-sm text-muted-foreground space-y-1 mt-1">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <Badge variant="secondary">{record.placa_carro}</Badge>
          </div>
          <p><strong>Início:</strong> {record.inicio_expediente ? format(new Date(record.inicio_expediente), 'HH:mm') : 'N/A'} - <strong>Fim:</strong> {record.final_expediente ? format(new Date(record.final_expediente), 'HH:mm') : 'Em andamento'}</p>
          <p><strong>Distância:</strong> {record.km_final && record.km_inicial ? `${record.km_final - record.km_inicial} km` : 'N/D'} (de {record.km_inicial} km para {record.km_final || '...'} km)</p>
      </div>
  );
  
  const AbastecimentoDetails = ({ record }: { record: DailyRecord }) => (
       <div className="text-sm text-muted-foreground space-y-1 mt-1">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            <Badge variant="secondary">{record.placa_carro}</Badge>
          </div>
          <p><strong>Valor:</strong> R$ {record.gasto?.toFixed(2).replace('.', ',')}</p>
          <p><strong>Litros:</strong> {record.abastecido ? `${record.abastecido} L` : 'N/D'}</p>
          <p><strong>Local:</strong> {record.local_de_abastecimento || 'Não informado'}</p>
      </div>
  );

  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle className="font-headline text-2xl">Histórico do Técnico</SheetTitle>
        <SheetDescription>
          Relatório de atividades para {technician.display_name}.
        </SheetDescription>
      </SheetHeader>
      <Separator className="my-4" />

      <Card className="my-4 mr-6">
        <CardHeader>
            <div className="flex items-center gap-2">
                <Filter className="h-5 w-5"/>
                <h3 className="font-semibold">Filtrar por Período</h3>
            </div>
        </CardHeader>
        <CardContent>
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                        {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                        {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y", { locale: ptBR })
                    )
                    ) : (
                    <span>Escolha um período</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                />
                </PopoverContent>
            </Popover>
        </CardContent>
      </Card>

      <div className="py-4 pr-6">
        {loading ? (
            <HistorySkeleton />
        ) : error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : filteredRecords.length > 0 ? (
            <div className="relative pl-6 before:absolute before:left-11 before:top-0 before:h-full before:w-px before:bg-border">
                {filteredRecords.map((record) => (
                    <div key={record.id} className="relative mb-8 flex items-start gap-6">
                        <EventIcon motivo={record.registro_motivo} />
                         <div className="flex-1">
                             <p className="text-xs text-muted-foreground">
                                {format(new Date(record.datahora), "EEEE, dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <h4 className="font-semibold">{record.registro_motivo}</h4>
                            {record.registro_motivo === 'Expediente' && <ExpedienteDetails record={record} />}
                            {record.registro_motivo === 'Abastecimento' && <AbastecimentoDetails record={record} />}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
          <Card className="text-center mr-6">
            <CardContent className="py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Nenhum Registro Encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há registros para este técnico no período selecionado.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
