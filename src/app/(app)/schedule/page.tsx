import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockDailyRecords } from '@/lib/data';
import { format, intervalToDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SchedulePage() {
    const scheduleRecords = mockDailyRecords.filter(r => r.registro_motivo === 'Expediente');

    const getDuration = (start?: string, end?: string) => {
        if (!start || !end) return 'N/A';
        const duration = intervalToDuration({ start: new Date(start), end: new Date(end) });
        return `${duration.hours || 0}h ${duration.minutes || 0}m`;
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold">Expediente dos Técnicos</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Registros de Expediente</CardTitle>
                    <CardDescription>Jornadas de trabalho diárias dos técnicos.</CardDescription>
                </CardHeader>
                <CardContent>
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
                            {scheduleRecords.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{format(new Date(record.datahora), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                    <TableCell className="font-medium">{record.tecnico_nome}</TableCell>
                                    <TableCell>{record.placa_carro}</TableCell>
                                    <TableCell>{record.inicio_expediente ? format(new Date(record.inicio_expediente), 'HH:mm', { locale: ptBR }) : 'N/A'}</TableCell>
                                    <TableCell>{record.final_expediente ? format(new Date(record.final_expediente), 'HH:mm', { locale: ptBR }) : 'N/A'}</TableCell>
                                    <TableCell className="text-right">{getDuration(record.inicio_expediente, record.final_expediente)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
