
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord } from '@/types';
import { format, intervalToDuration, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type GroupedRecords = { [date: string]: DailyRecord[] };

// --- Helper Functions ---

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

const groupRecordsByDate = (records: DailyRecord[]): GroupedRecords => {
    return records.reduce((acc, record) => {
        const date = format(parseISO(record.datahora), 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(record);
        return acc;
    }, {} as GroupedRecords);
};


// --- Skeleton Component ---

const ScheduleSkeleton = () => (
    Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="mb-4">
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                            <TableHead className="text-right"><Skeleton className="h-4 w-24" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 2 }).map((_, j) => (
                             <TableRow key={j}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-24" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    ))
);

// --- Main Page Component ---

export default function SchedulePage() {
    const [allRecords, setAllRecords] = useState<DailyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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
                setAllRecords(data as DailyRecord[]);
            }
            setLoading(false);
        };
        fetchScheduleRecords();
    }, []);

    const groupedRecords = useMemo(() => {
        return groupRecordsByDate(allRecords);
    }, [allRecords]);
    
    const sortedDates = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));
    const defaultOpenAccordion = sortedDates.slice(0, 2);

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Calendar className="h-7 w-7"/> Expediente dos Técnicos
                </h1>
                <p className="text-muted-foreground">
                    Jornadas de trabalho diárias dos técnicos registradas no aplicativo.
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro ao Carregar</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <ScheduleSkeleton />
            ) : sortedDates.length > 0 ? (
                 <Accordion type="multiple" defaultValue={defaultOpenAccordion} className="w-full space-y-4">
                    {sortedDates.map((date) => (
                         <AccordionItem value={date} key={date} className="border-none">
                             <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <h2 className="font-headline text-xl font-semibold">
                                        {format(parseISO(`${date}T12:00:00Z`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </h2>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Técnico</TableHead>
                                                <TableHead>Veículo</TableHead>
                                                <TableHead>Início</TableHead>
                                                <TableHead>Fim</TableHead>
                                                <TableHead className="text-right">Duração</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {groupedRecords[date].map((record) => (
                                                <TableRow key={record.id}>
                                                    <TableCell className="font-medium">{record.tecnico_nome}</TableCell>
                                                    <TableCell>{record.placa_carro || 'N/D'}</TableCell>
                                                    <TableCell>{formatDate(record.inicio_expediente, 'HH:mm')}</TableCell>
                                                    <TableCell>{formatDate(record.final_expediente, 'HH:mm')}</TableCell>
                                                    <TableCell className="text-right">{getDuration(record.inicio_expediente, record.final_expediente)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                             </Card>
                         </AccordionItem>
                    ))}
                 </Accordion>
            ) : (
                <Card>
                    <CardContent className="text-center py-16 text-muted-foreground">
                        <Calendar className="mx-auto h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold">Nenhum registro encontrado</h3>
                        <p>Não há registros de expediente para o período selecionado.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
