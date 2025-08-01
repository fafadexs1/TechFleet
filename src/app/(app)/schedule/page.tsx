'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord } from '@/types';
import { format, intervalToDuration, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
                <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                            <TableHead className="text-right"><Skeleton className="h-4 w-16" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 2 }).map((_, j) => (
                             <TableRow key={j}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell className="text-right"><Skeleton className="h-4 w-16" /></TableCell>
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

    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));

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

    const { years, months, filteredRecords } = useMemo(() => {
        const years = [...new Set(allRecords.map(r => parseISO(r.datahora).getFullYear().toString()))];
        const months = [...new Set(allRecords
            .filter(r => parseISO(r.datahora).getFullYear().toString() === selectedYear)
            .map(r => format(parseISO(r.datahora), 'MMMM', { locale: ptBR }).replace(/^\w/, c => c.toUpperCase()))
        )];

        const filtered = allRecords.filter(r => {
             const recordDate = parseISO(r.datahora);
             const yearMatch = recordDate.getFullYear().toString() === selectedYear;
             const monthMatch = (recordDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
             return yearMatch && monthMatch;
        });

        return { years, months, filteredRecords: groupRecordsByDate(filtered) };
    }, [allRecords, selectedYear, selectedMonth]);

    const sortedDates = Object.keys(filteredRecords).sort((a, b) => b.localeCompare(a));
    const defaultOpenAccordion = sortedDates.slice(0, 2);

    const monthOptions = [
        { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' }, { value: '08', label: 'Agosto' },
        { value: '09', label: 'Setembro' }, { value: '10', label: 'Outubro' },
        { value: '11', label: 'Novembro' }, { value: '12', label: 'Dezembro' }
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Calendar className="h-7 w-7"/> Expediente dos Técnicos
                </h1>
                <p className="text-muted-foreground">
                    Jornadas de trabalho diárias dos técnicos registradas no aplicativo.
                p>
            </div>

             <Card>
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5"/>
                        <h3 className="font-semibold">Filtros</h3>
                    </div>
                     <div className="flex gap-4">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(year => (
                                    <SelectItem key={year} value={year}>{year}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[180px]">
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
                </CardHeader>
            </Card>

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
                                            {filteredRecords[date].map((record) => (
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
