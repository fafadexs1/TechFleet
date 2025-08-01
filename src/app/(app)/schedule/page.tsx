'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord } from '@/types';
import { format, intervalToDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SchedulePage() {
    const [records, setRecords] = useState<DailyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchScheduleRecords = async () => {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
            .from('registros')
            .select('*')
            .eq('registro_motivo', 'Expediente')
            .order('datahora', { ascending: false });

        if (error) {
            console.error('Error fetching schedule records:', error);
            setError('Não foi possível carregar os registros de expediente.');
        } else {
            setRecords(data as DailyRecord[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchScheduleRecords();
    }, []);


    const getDuration = (start?: string, end?: string) => {
        if (!start || !end) return 'N/A';
        try {
            const duration = intervalToDuration({ start: new Date(start), end: new Date(end) });
            const hours = duration.hours || 0;
            const minutes = duration.minutes || 0;
            if (hours === 0 && minutes === 0) {
                 const seconds = duration.seconds || 0;
                 if (seconds > 0) return '< 1m';
                 return 'N/A';
            }
            return `${hours}h ${minutes}m`;
        } catch (e) {
            return 'Inválido';
        }
    };
    
    const formatDate = (dateStr?: string, formatStr: string = 'dd/MM/yyyy') => {
        if (!dateStr) return 'N/A';
        try {
            return format(new Date(dateStr), formatStr, { locale: ptBR });
        } catch (e) {
            return "Data inválida";
        }
    };


    const ScheduleRowSkeleton = () => (
        <TableRow>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
        </TableRow>
    );


    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Calendar /> Expediente dos Técnicos</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Registros de Expediente</CardTitle>
                    <CardDescription>Jornadas de trabalho diárias dos técnicos registradas no aplicativo.</CardDescription>
                </CardHeader>
                <CardContent>
                     {error && (
                         <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro ao Carregar</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Técnico</TableHead>
                                <TableHead>Veículo</TableHead>
                                <TableHead>Início</TableHead>
                                <TableHead>Fim</TableHead>
                                <TableHead className="text-right">Duração</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <ScheduleRowSkeleton key={i} />)
                            ) : (
                                records.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell>{formatDate(record.datahora)}</TableCell>
                                        <TableCell className="font-medium">{record.tecnico_nome}</TableCell>
                                        <TableCell>{record.placa_carro || 'N/D'}</TableCell>
                                        <TableCell>{formatDate(record.inicio_expediente, 'HH:mm')}</TableCell>
                                        <TableCell>{formatDate(record.final_expediente, 'HH:mm')}</TableCell>
                                        <TableCell className="text-right">{getDuration(record.inicio_expediente, record.final_expediente)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {!loading && records.length === 0 && !error && (
                        <div className="text-center py-10 text-muted-foreground">
                            Nenhum registro de expediente encontrado.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
