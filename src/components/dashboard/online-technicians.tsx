
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { DailyRecord } from "@/types"
import { formatDistanceToNowStrict } from "date-fns"
import { ptBR } from "date-fns/locale"
import { UserCheck } from "lucide-react"

interface OnlineTechniciansProps {
    records: Pick<DailyRecord, 'tecnico_nome' | 'placa_carro' | 'inicio_expediente'>[];
}

export function OnlineTechnicians({ records }: OnlineTechniciansProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary"/>
                    Técnicos em Expediente
                </CardTitle>
                <CardDescription>
                    Técnicos que estão atualmente com o expediente aberto no aplicativo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Técnico</TableHead>
                            <TableHead>Veículo</TableHead>
                            <TableHead className="text-right">Início</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                       {records.length > 0 ? (
                            records.map((record) => (
                                <TableRow key={record.tecnico_nome}>
                                    <TableCell className="font-medium">{record.tecnico_nome}</TableCell>
                                    <TableCell>{record.placa_carro}</TableCell>
                                    <TableCell className="text-right">
                                        {record.inicio_expediente ? formatDistanceToNowStrict(new Date(record.inicio_expediente), { locale: ptBR, addSuffix: true }) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                       ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    Nenhum técnico em expediente no momento.
                                </TableCell>
                            </TableRow>
                       )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
