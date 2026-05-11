import prisma from '@/lib/prisma';
import type { DailyRecord } from '@/types';
import { Calendar } from 'lucide-react';
import { ScheduleClientPage } from '@/components/schedule/schedule-client-page';

async function getScheduleData() {
    try {
        const records = await prisma.registros.findMany({
            where: {
                registro_motivo: 'Expediente'
            },
            orderBy: {
                datahora: 'desc'
            }
        });

        return records.map(r => ({
            ...r,
            id: Number(r.id),
            km_inicial: r.km_inicial ? Number(r.km_inicial) : 0,
            km_final: r.km_final ? Number(r.km_final) : 0,
            somar_km: r.somar_km ? Number(r.somar_km) : 0,
            problema: r.problema ? Number(r.problema) : 0,
            prioridade_ticket: r.prioridade_ticket ? Number(r.prioridade_ticket) : 0,
            datahora: r.datahora?.toISOString(),
            created_at: r.created_at?.toISOString(),
            inicio_expediente: r.inicio_expediente?.toISOString(),
            final_expediente: r.final_expediente?.toISOString(),
            gasto: r.gasto ? Number(r.gasto) : 0,
        })) as any[];
    } catch (error) {
        console.error('Error fetching schedule records:', error);
        return [];
    }
}


export default async function SchedulePage() {
    const allRecords = await getScheduleData();

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
            <ScheduleClientPage allRecords={allRecords} />
        </div>
    );
}
