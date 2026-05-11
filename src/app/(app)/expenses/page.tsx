
import prisma from '@/lib/prisma';
import type { DailyRecord, Technician, Vehicle } from '@/types';
import { DollarSign } from 'lucide-react';
import { ExpensesClientPage } from '@/components/expenses/expenses-client-page';

async function getExpensesData() {
    const expensesPromise = prisma.registros.findMany({
        where: { gasto: { gt: 0 } },
        orderBy: { datahora: 'desc' }
    });

    const techniciansPromise = prisma.membros.findMany();
    const vehiclesPromise = prisma.carros.findMany();

    const [expensesData, techsData, vehiclesData] = await Promise.all([
        expensesPromise,
        techniciansPromise,
        vehiclesPromise,
    ]);

    return {
        allExpenses: expensesData.map((e: any) => ({
            ...e,
            id: Number(e.id),
            km_inicial: e.km_inicial ? Number(e.km_inicial) : 0,
            km_final: e.km_final ? Number(e.km_final) : 0,
            somar_km: e.somar_km ? Number(e.somar_km) : 0,
            prioridade_ticket: e.prioridade_ticket ? Number(e.prioridade_ticket) : 0,
            datahora: e.datahora?.toISOString(),
            created_at: e.created_at?.toISOString(),
            inicio_expediente: e.inicio_expediente?.toISOString(),
            final_expediente: e.final_expediente?.toISOString(),
        })) as DailyRecord[],
        technicians: techsData.map((t: any) => ({
            ...t,
            id: Number(t.id),
            id_estoque_sgp: t.id_estoque_sgp ? Number(t.id_estoque_sgp) : null,
            created_at: t.created_at?.toISOString(),
        })) as Technician[],
        vehicles: vehiclesData.map((v: any) => ({
            ...v,
            id: Number(v.id),
            proxima_manutencao: v.proxima_manutencao ? Number(v.proxima_manutencao) : 0,
            quilometragem: v.quilometragem ? Number(v.quilometragem) : 0,
            ultima_manutencao: v.ultima_manutencao ? Number(v.ultima_manutencao) : 0,
            data_proxima_manutencao: v.data_proxima_manutencao?.toISOString(),
            data_ultima_manutencao: v.data_ultima_manutencao?.toISOString(),
            created_at: v.created_at?.toISOString(),
        })) as Vehicle[],
    }
}


export default async function ExpensesPage() {
    const { allExpenses, technicians, vehicles } = await getExpensesData();

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <DollarSign className="h-7 w-7" />
                    Controle de Despesas
                </h1>
                <p className="text-muted-foreground">
                    Histórico de todos os gastos registrados, agrupados por dia.
                </p>
            </div>
            <ExpensesClientPage 
                allExpenses={allExpenses} 
                technicians={technicians} 
                vehicles={vehicles} 
            />
        </div>
    );
}
