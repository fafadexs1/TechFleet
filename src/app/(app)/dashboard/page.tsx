
import { Car, Users, Wrench, Wallet, BarChart3, Trophy } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import prisma from '@/lib/prisma';
import type { Vehicle, Technician, RecentActivity, DailyRecord } from '@/types';
import { WeeklyExpensesChart } from '@/components/dashboard/weekly-expenses-chart';
import { OnlineTechnicians } from '@/components/dashboard/online-technicians';
import { RecentActivityList } from '@/components/dashboard/recent-activity';
import { MaintenanceAlerts } from '@/components/dashboard/maintenance-alerts';
import { startOfMonth, subDays } from 'date-fns';
import { TopTechniciansByKm } from '@/components/dashboard/top-technicians-by-km';

async function getDashboardData() {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const sevenDaysAgo = subDays(today, 7);

    const vehiclesPromise = prisma.carros.findMany();
    const techniciansPromise = prisma.membros.findMany();
    const recentActivitiesPromise = prisma.atividades_recentes.findMany({
        orderBy: { created_at: 'desc' },
        take: 5
    });
    const monthlyExpensesPromise = prisma.registros.findMany({
        where: {
            datahora: { gte: firstDayOfMonth }
        },
        select: { gasto: true }
    });
    const weeklyExpensesPromise = prisma.registros.findMany({
        where: {
            datahora: { gte: sevenDaysAgo }
        },
        select: { datahora: true, gasto: true }
    });
    const onlineTechniciansRecordsPromise = prisma.registros.findMany({
        where: {
            final_expediente: null,
            registro_motivo: 'Expediente'
        },
        select: {
            id: true,
            tecnico_nome: true,
            placa_carro: true,
            inicio_expediente: true,
            tecnicoresponsavel: true
        }
    });
    const monthlyKmPromise = prisma.registros.findMany({
        where: {
            datahora: { gte: firstDayOfMonth },
            somar_km: { gt: 0 }
        },
        select: { tecnicoresponsavel: true, somar_km: true }
    });

    const [
        vehiclesData,
        techniciansData,
        recentActivitiesData,
        monthlyExpensesData,
        weeklyExpensesData,
        onlineTechniciansData,
        monthlyKmData,
    ] = await Promise.all([
        vehiclesPromise,
        techniciansPromise,
        recentActivitiesPromise,
        monthlyExpensesPromise,
        weeklyExpensesPromise,
        onlineTechniciansRecordsPromise,
        monthlyKmPromise,
    ]);

    const monthlyExpenses = monthlyExpensesData.reduce((sum: number, r: { gasto: number | null }) => sum + (r.gasto || 0), 0);
        
    const technicians = techniciansData.map((t: any) => ({
        ...t,
        id: Number(t.id),
        id_estoque_sgp: t.id_estoque_sgp ? Number(t.id_estoque_sgp) : null
    })) as Technician[];

    const onlineTechniciansRecords = onlineTechniciansData.map((r: any) => ({
        ...r,
        id: Number(r.id)
    })) as any[];
    
    const bannedTechnicianIds = new Set(technicians.filter(t => t.ban).map(t => t.uuid));
    const filteredOnlineTechnicians = onlineTechniciansRecords.filter(
        (record: any) => !record.tecnicoresponsavel || !bannedTechnicianIds.has(record.tecnicoresponsavel)
    );

    const kmByTechnician = monthlyKmData.reduce<Record<string, number>>((acc, record: any) => {
        if (record.tecnicoresponsavel && record.somar_km) {
            acc[record.tecnicoresponsavel] = (acc[record.tecnicoresponsavel] || 0) + Number(record.somar_km);
        }
        return acc;
    }, {});

    const topTechnicians = (Object.entries(kmByTechnician) as [string, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([uuid, totalKm]) => ({
            uuid,
            totalKm: Number(totalKm)
        }));

    return {
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
        technicians: technicians,
        recentActivities: recentActivitiesData.map((a: any) => ({
            ...a,
            id: Number(a.id),
            created_at: a.created_at?.toISOString(),
        })) as RecentActivity[],
        monthlyExpenses,
        weeklyExpenses: weeklyExpensesData.map((r: any) => ({
            ...r,
            gasto: r.gasto || 0,
            datahora: r.datahora?.toISOString(),
        })) as DailyRecord[],
        onlineTechniciansRecords: filteredOnlineTechnicians.map((r: any) => ({
            ...r,
            inicio_expediente: r.inicio_expediente?.toISOString(),
        })),
        topTechnicians,
    }
}


export default async function DashboardPage() {
    const { 
        vehicles, 
        technicians, 
        recentActivities,
        monthlyExpenses,
        weeklyExpenses,
        onlineTechniciansRecords,
        topTechnicians,
    } = await getDashboardData();
    
    const activeTechnicians = technicians.filter(t => t.online === 'true' && !t.ban).length;
    const pendingMaintenance = vehicles.filter(v => v.proxima_manutencao && v.quilometragem >= v.proxima_manutencao).length;
    
    const technicianMap = new Map(technicians.map(t => [t.uuid, t]));

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard 
                    title="Total de Veículos" 
                    value={vehicles.length.toString()} 
                    icon={Car} 
                    description={`${vehicles.filter(v => v.tecnico_atual).length} em uso`}
                />
                <StatCard 
                    title="Técnicos Online" 
                    value={`${activeTechnicians} / ${technicians.filter(t => !t.ban).length}`} 
                    icon={Users}
                    description="Técnicos com expediente aberto"
                />
                <StatCard 
                    title="Manutenções Pendentes" 
                    value={pendingMaintenance.toString()} 
                    icon={Wrench}
                    description="Veículos com revisão por KM vencida"
                />
                 <StatCard 
                    title="Despesas no Mês" 
                    value={`R$ ${monthlyExpenses.toFixed(2).replace('.', ',')}`}
                    icon={Wallet}
                    description="Soma de todos os gastos este mês"
                />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <WeeklyExpensesChart records={weeklyExpenses} />
                    <OnlineTechnicians records={onlineTechniciansRecords} />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <MaintenanceAlerts vehicles={vehicles} />
                    <TopTechniciansByKm topTechnicians={topTechnicians} technicianMap={technicianMap} />
                    <RecentActivityList activities={recentActivities} technicianMap={technicianMap} />
                </div>
            </div>
        </div>
    );
}
