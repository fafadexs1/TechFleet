
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord, Vehicle } from '@/types';
import { AlertCircle, Calendar, Droplet, Fuel, Route } from 'lucide-react';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VehicleHistorySheetProps {
  vehicle: Vehicle;
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

export function VehicleHistorySheet({ vehicle }: VehicleHistorySheetProps) {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicle.placa) {
        setError("Veículo sem placa para buscar histórico.");
        setLoading(false);
        return;
    };

    const fetchRecords = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('registros')
        .select('*')
        .eq('placa_carro', vehicle.placa)
        .in('registro_motivo', ['Expediente', 'Abastecimento'])
        .order('datahora', { ascending: false });

      if (error) {
        console.error('Error fetching vehicle records:', error);
        setError('Não foi possível carregar o histórico do veículo.');
      } else {
        setRecords(data as DailyRecord[]);
      }
      setLoading(false);
    };

    fetchRecords();
  }, [vehicle]);

  const EventIcon = ({ motivo }: { motivo: string }) => {
    const iconWrapperClass = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
    if (motivo === 'Expediente') {
        return <div className={`${iconWrapperClass} bg-blue-100 text-blue-600`}><Route className="h-5 w-5"/></div>
    }
    if (motivo === 'Abastecimento') {
        return <div className={`${iconWrapperClass} bg-green-100 text-green-600`}><Fuel className="h-5 w-5"/></div>
    }
    return <div className={`${iconWrapperClass} bg-muted text-muted-foreground`}><Calendar className="h-5 w-5"/></div>
  }

  const ExpedienteDetails = ({ record }: { record: DailyRecord }) => (
      <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Início:</strong> {format(new Date(record.inicio_expediente!), 'HH:mm')} - <strong>Fim:</strong> {record.final_expediente ? format(new Date(record.final_expediente), 'HH:mm') : 'Em andamento'}</p>
          <p><strong>Distância:</strong> {record.km_final ? `${record.km_final - record.km_inicial} km` : 'N/D'} (de {record.km_inicial} km para {record.km_final || '...'} km)</p>
      </div>
  );
  
  const AbastecimentoDetails = ({ record }: { record: DailyRecord }) => (
       <div className="text-sm text-muted-foreground space-y-1">
          <p><strong>Valor:</strong> R$ {record.gasto?.toFixed(2).replace('.', ',')}</p>
          <p><strong>Litros:</strong> {record.abastecido ? `${record.abastecido} L` : 'N/D'}</p>
          <p><strong>Local:</strong> {record.local_de_abastecimento || 'Não informado'}</p>
      </div>
  );

  return (
    <>
      <SheetHeader className="pr-12">
        <SheetTitle className="font-headline text-2xl">Histórico do Veículo</SheetTitle>
        <SheetDescription>
          Relatório de uso para o veículo {vehicle.marca} {vehicle.modelo} - <span className="font-mono">{vehicle.placa}</span>
        </SheetDescription>
      </SheetHeader>
      <Separator className="my-4" />
      <div className="py-4 pr-6">
        {loading ? (
            <HistorySkeleton />
        ) : error ? (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        ) : records.length > 0 ? (
            <div className="relative pl-6 before:absolute before:left-11 before:top-0 before:h-full before:w-px before:bg-border">
                {records.map((record) => (
                    <div key={record.id} className="relative mb-8 flex items-start gap-6">
                        <EventIcon motivo={record.registro_motivo} />
                         <div className="flex-1">
                             <p className="text-xs text-muted-foreground">
                                {format(new Date(record.datahora), "EEEE, dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                            <h4 className="font-semibold">{record.registro_motivo} por {record.tecnico_nome}</h4>
                            {record.registro_motivo === 'Expediente' && <ExpedienteDetails record={record} />}
                            {record.registro_motivo === 'Abastecimento' && <AbastecimentoDetails record={record} />}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
          <Card className="text-center">
            <CardContent className="py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Nenhum Registro Encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Não há registros de expediente ou abastecimento para este veículo.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
