
import { Car, Users, Wrench, Wallet, BarChart3, Activity } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { supabase } from '@/lib/supabase/client';
import type { Vehicle, Technician, RecentActivity, DailyRecord } from '@/types';
import { WeeklyExpensesChart } from '@/components/dashboard/weekly-expenses-chart';
import { OnlineTechnicians } from '@/components/dashboard/online-technicians';
import { RecentActivityList } from '@/components/dashboard/recent-activity';
import { MaintenanceAlerts } from '@/components/dashboard/maintenance-alerts';
import { startOfMonth, subDays } from 'date-fns';

async function getDashboardData() {
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const sevenDaysAgo = subDays(today, 7);

    const vehiclesPromise = supabase.from('carros').select('*');
    const techniciansPromise = supabase.from('membros').select('*');
    const recentActivitiesPromise = supabase.from('atividades_recentes').select('*').order('created_at', { ascending: false }).limit(5);
    const monthlyExpensesPromise = supabase.from('registros').select('gasto').gte('datahora', firstDayOfMonth.toISOString());
    const weeklyExpensesPromise = supabase.from('registros').select('datahora, gasto').gte('datahora', sevenDaysAgo.toISOString());
    const onlineTechniciansRecordsPromise = supabase.from('registros').select('id, tecnico_nome, placa_carro, inicio_expediente, tecnicoresponsavel').is('final_expediente', null).eq('registro_motivo', 'Expediente');

    const [
        vehiclesResult,
        techniciansResult,
        recentActivitiesResult,
        monthlyExpensesResult,
        weeklyExpensesResult,
        onlineTechniciansResult,
    ] = await Promise.all([
        vehiclesPromise,
        techniciansPromise,
        recentActivitiesPromise,
        monthlyExpensesPromise,
        weeklyExpensesPromise,
        onlineTechniciansRecordsPromise,
    ]);

    if (vehiclesResult.error) throw new Error('Failed to fetch vehicles');
    if (techniciansResult.error) throw new Error('Failed to fetch technicians');
    if (recentActivitiesResult.error) throw new Error('Failed to fetch recent activities');
    
    const monthlyExpenses = (monthlyExpensesResult.data as DailyRecord[] || [])
        .reduce((sum, r) => sum + (r.gasto || 0), 0);
        
    const technicians = (techniciansResult.data as Technician[]) || [];
    const onlineTechniciansRecords = (onlineTechniciansResult.data as (Pick<DailyRecord, 'id' | 'tecnico_nome' | 'placa_carro' | 'inicio_expediente' | 'tecnicoresponsavel'>)[]) || [];
    
    const bannedTechnicianIds = new Set(technicians.filter(t => t.ban).map(t => t.uuid));
    const filteredOnlineTechnicians = onlineTechniciansRecords.filter(
        record => !record.tecnicoresponsavel || !bannedTechnicianIds.has(record.tecnicoresponsavel)
    );

    return {
        vehicles: (vehiclesResult.data as Vehicle[]) || [],
        technicians: technicians,
        recentActivities: (recentActivitiesResult.data as RecentActivity[]) || [],
        monthlyExpenses,
        weeklyExpenses: (weeklyExpensesResult.data as DailyRecord[]) || [],
        onlineTechniciansRecords: filteredOnlineTechnicians,
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
                    <RecentActivityList activities={recentActivities} technicianMap={technicianMap} />
                </div>
            </div>
        </div>
    );
}
