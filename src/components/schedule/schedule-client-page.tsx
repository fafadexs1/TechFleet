
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Filter } from 'lucide-react';
import type { DailyRecord } from '@/types';
import { format, intervalToDuration, parseISO, getFullYear, getMonth } from 'date-fns';
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

interface ScheduleClientPageProps {
    allRecords: DailyRecord[];
}

export function ScheduleClientPage({ allRecords }: ScheduleClientPageProps) {
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));

    const { years, monthOptions, filteredRecords } = useMemo(() => {
        const years = [...new Set(allRecords.map(r => getFullYear(parseISO(r.datahora)).toString()))].sort((a,b) => b.localeCompare(a));
        
        const monthOptions = [
            { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
            { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
            { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
            { value: '07', label: 'Julho' }, { value: '08', 'label': 'Agosto' },
            { value: '09', 'label': 'Setembro' }, { value: '10', 'label': 'Outubro' },
            { value: '11', 'label': 'Novembro' }, { value: '12', 'label': 'Dezembro' }
        ];

        const filtered = allRecords.filter(r => {
            const recordDate = parseISO(r.datahora);
            const yearMatch = getFullYear(recordDate).toString() === selectedYear;
            const monthMatch = (getMonth(recordDate) + 1).toString().padStart(2, '0') === selectedMonth;
            return yearMatch && monthMatch;
        });

        return { years, monthOptions, filteredRecords: filtered };
    }, [allRecords, selectedYear, selectedMonth]);


    const groupedRecords = useMemo(() => {
        return groupRecordsByDate(filteredRecords);
    }, [filteredRecords]);
    
    const sortedDates = Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));
    const defaultOpenAccordion = sortedDates.slice(0, 2);

    return (
        <>
            <Card>
                <CardHeader className="flex-col items-start gap-4 space-y-0 pb-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5"/>
                        <h3 className="font-semibold text-lg">Filtros</h3>
                    </div>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2 flex-grow">
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
                    <div className="flex flex-col gap-2 sm:w-[120px] flex-grow">
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

            {sortedDates.length > 0 ? (
                 <Accordion type="multiple" defaultValue={defaultOpenAccordion} className="w-full space-y-4">
                    {sortedDates.map((date) => (
                         <AccordionItem value={date} key={date} className="border-none">
                             <Card>
                                <AccordionTrigger className="p-6 hover:no-underline">
                                    <h2 className="font-headline text-xl font-semibold text-left">
                                        {format(parseISO(`${date}T12:00:00Z`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </h2>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                     <div className="overflow-x-auto">
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
                                     </div>
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
        </>
    );
}
