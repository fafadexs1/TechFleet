import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { mockDailyRecords, mockPayments } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ExpensesPage() {
    const fuelRecords = mockDailyRecords.filter(r => r.registro_motivo === 'Abastecimento');
    const payments = mockPayments;

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold">Controle de Despesas</h1>
            <Tabs defaultValue="fuel">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="fuel">Abastecimentos</TabsTrigger>
                    <TabsTrigger value="payments">Outros Pagamentos</TabsTrigger>
                </TabsList>
                <TabsContent value="fuel">
                    <Card>
                        <CardHeader>
                            <CardTitle>Registros de Abastecimento</CardTitle>
                            <CardDescription>Todos os abastecimentos realizados pelos técnicos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Técnico</TableHead>
                                        <TableHead>Veículo</TableHead>
                                        <TableHead>Local</TableHead>
                                        <TableHead className="text-right">Valor Gasto</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fuelRecords.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>{format(new Date(record.datahora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                            <TableCell>{record.tecnico_nome}</TableCell>
                                            <TableCell>{record.placa_carro}</TableCell>
                                            <TableCell>{record.local_de_abastecimento}</TableCell>
                                            <TableCell className="text-right font-medium">R$ {record.gasto?.toFixed(2).replace('.', ',')}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="payments">
                     <Card>
                        <CardHeader>
                            <CardTitle>Registros de Pagamentos</CardTitle>
                            <CardDescription>Pagamentos de manutenção e outras despesas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead>Motivo</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                                            <TableCell className="font-medium">{payment.nomepagamento}</TableCell>
                                            <TableCell>{payment.motivo}</TableCell>
                                            <TableCell className="text-right">R$ {payment.valorapagar.toFixed(2).replace('.', ',')}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={payment.pagamentofeito ? 'secondary' : 'destructive'}>
                                                    {payment.pagamentofeito ? 'Pago' : 'Pendente'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
