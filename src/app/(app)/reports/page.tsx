
'use client';

import { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import type { Technician, DailyRecord } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function ReportsPage() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString().padStart(2, '0'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
    }, []);

    const monthOptions = [
        { value: '01', label: 'Janeiro' }, { value: '02', label: 'Fevereiro' },
        { value: '03', label: 'Março' }, { value: '04', label: 'Abril' },
        { value: '05', label: 'Maio' }, { value: '06', label: 'Junho' },
        { value: '07', label: 'Julho' }, { value: '08', 'label': 'Agosto' },
        { value: '09', 'label': 'Setembro' }, { value: '10', 'label': 'Outubro' },
        { value: '11', 'label': 'Novembro' }, { value: '12', 'label': 'Dezembro' }
    ];

    useEffect(() => {
        const fetchTechnicians = async () => {
            const { data, error } = await supabase.from('membros').select('*').order('display_name');
            if (error) {
                setError('Não foi possível carregar a lista de técnicos.');
            } else {
                setTechnicians(data as Technician[]);
            }
        };
        fetchTechnicians();
    }, []);

    const generateReport = async () => {
        setLoading(true);
        setError(null);

        const fromDate = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1);
        const toDate = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0, 23, 59, 59);

        let query = supabase
            .from('registros')
            .select('*')
            .gte('datahora', fromDate.toISOString())
            .lte('datahora', toDate.toISOString())
            .in('registro_motivo', ['Expediente', 'Abastecimento'])
            .order('datahora', { ascending: true });

        if (selectedTechnician !== 'all') {
            query = query.eq('tecnicoresponsavel', selectedTechnician);
        }

        const { data: records, error: recordsError } = await query;

        if (recordsError) {
            setError('Não foi possível buscar os registros para o relatório.');
            setLoading(false);
            return;
        }

        if (!records || records.length === 0) {
            toast({
                title: 'Nenhum dado encontrado',
                description: 'Não há registros para os filtros selecionados.',
                variant: 'destructive',
            });
            setLoading(false);
            return;
        }

        // Group records by technician
        const recordsByTechnician = records.reduce((acc, record) => {
            const techId = record.tecnicoresponsavel;
            if (!acc[techId]) {
                acc[techId] = [];
            }
            acc[techId].push(record);
            return acc;
        }, {} as { [key: string]: DailyRecord[] });


        const doc = new jsPDF();
        const reportDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
        const reportMonth = monthOptions.find(m => m.value === selectedMonth)?.label;
        const reportPeriod = `${reportMonth} de ${selectedYear}`;
        
        let isFirstPage = true;

        for (const techId in recordsByTechnician) {
            if (!isFirstPage) {
                doc.addPage();
            }
            
            const techRecords = recordsByTechnician[techId];
            const technician = technicians.find(t => t.uuid === techId);
            const techName = technician?.display_name || 'Técnico Desconhecido';

            // --- Header ---
            doc.setFontSize(18);
            doc.text('Relatório Mensal de Atividades', 14, 22);
            doc.setFontSize(11);
            doc.text(`Técnico: ${techName}`, 14, 30);
            doc.text(`Período: ${reportPeriod}`, 14, 36);
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Gerado em: ${reportDate}`, 14, 42);

            // --- Summary ---
            const summary = techRecords.reduce((acc, record) => {
                if(record.registro_motivo === 'Expediente' && record.km_final && record.km_inicial) {
                    acc.totalKm += (record.km_final - record.km_inicial);
                    acc.workDays.add(format(new Date(record.datahora), 'yyyy-MM-dd'));
                    acc.cars.add(record.placa_carro);
                }
                if(record.registro_motivo === 'Abastecimento' && record.gasto) {
                    acc.totalSpent += record.gasto;
                }
                return acc;
            }, { totalKm: 0, totalSpent: 0, workDays: new Set<string>(), cars: new Set<string>() });

            doc.setLineWidth(0.5);
            doc.line(14, 50, 196, 50);
            doc.setFontSize(14);
            doc.text('Resumo do Mês', 14, 58);

            const summaryText = `
- Dias Trabalhados: ${summary.workDays.size}
- Distância Total Percorrida: ${summary.totalKm.toLocaleString('pt-BR')} km
- Gasto Total com Combustível: R$ ${summary.totalSpent.toFixed(2).replace('.', ',')}
- Veículos Utilizados: ${Array.from(summary.cars).join(', ') || 'Nenhum'}
            `;
            doc.setFontSize(11);
            doc.text(summaryText, 14, 66);


            // --- Details Table ---
            const tableData = techRecords.map(r => {
                const date = format(new Date(r.datahora), 'dd/MM/yy HH:mm');
                let description = '';
                if(r.registro_motivo === 'Expediente') {
                    const distance = r.km_final && r.km_inicial ? `${r.km_final - r.km_inicial} km` : 'N/D';
                    description = `Expediente com ${r.placa_carro}. Distância: ${distance}`;
                } else if (r.registro_motivo === 'Abastecimento') {
                    description = `Abastecimento de R$ ${r.gasto?.toFixed(2).replace('.', ',')} em ${r.local_de_abastecimento}`;
                }
                return [date, description];
            });

            doc.autoTable({
                startY: 100,
                head: [['Data e Hora', 'Descrição da Atividade']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
            });
            
            isFirstPage = false;
        }

        doc.save(`relatorio_${selectedMonth}_${selectedYear}_${selectedTechnician === 'all' ? 'todos' : technicians.find(t=>t.uuid === selectedTechnician)?.display_name.replace(' ','_')}.pdf`);
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                <FileText className="h-7 w-7"/> Gerador de Relatórios
            </h1>
            <Card>
                <CardHeader>
                    <CardTitle>Relatório Mensal de Atividades</CardTitle>
                    <CardDescription>
                        Selecione o período e o técnico para gerar um relatório em PDF com o resumo das atividades.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Técnico</label>
                            <Select value={selectedTechnician} onValueChange={setSelectedTechnician}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um técnico" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Técnicos</SelectItem>
                                    {technicians.map(tech => (
                                        <SelectItem key={tech.uuid} value={tech.uuid}>{tech.display_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Mês</label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    {monthOptions.map(month => (
                                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Ano</label>
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o ano" />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     <Button onClick={generateReport} disabled={loading} className="w-full sm:w-auto">
                        <Download className="mr-2 h-4 w-4"/>
                        {loading ? 'Gerando Relatório...' : 'Gerar Relatório'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
