
import { Car, Users, Wrench } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { MaintenanceAlerts } from '@/components/dashboard/maintenance-alerts';
import { RecentActivityList } from '@/components/dashboard/recent-activity';
import { supabase } from '@/lib/supabase/client';
import type { Vehicle, Technician, RecentActivity } from '@/types';

async function getDashboardData() {
    const vehiclesPromise = supabase.from('carros').select('*');
    const techniciansPromise = supabase.from('membros').select('*');
    const recentActivitiesPromise = supabase.from('atividades_recentes').select('*').order('created_at', { ascending: false }).limit(5);

    const [vehiclesResult, techniciansResult, recentActivitiesResult] = await Promise.all([
        vehiclesPromise,
        techniciansPromise,
        recentActivitiesPromise
    ]);

    if (vehiclesResult.error) throw new Error('Failed to fetch vehicles');
    if (techniciansResult.error) throw new Error('Failed to fetch technicians');
    if (recentActivitiesResult.error) throw new Error('Failed to fetch recent activities');
    
    return {
        vehicles: vehiclesResult.data as Vehicle[],
        technicians: techniciansResult.data as Technician[],
        recentActivities: recentActivitiesResult.data as RecentActivity[],
    }
}


export default async function DashboardPage() {
    const { vehicles, technicians, recentActivities } = await getDashboardData();
    
    const activeTechnicians = technicians.filter(t => t.online === 'true').length;

    const pendingMaintenance = vehicles.filter(v => v.proxima_manutencao && v.quilometragem >= v.proxima_manutencao).length.toString();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Total de Veículos" 
                    value={vehicles.length.toString()} 
                    icon={Car} 
                    description={`${vehicles.filter(v => v.tecnico_atual).length} em uso`}
                />
                <StatCard 
                    title="Técnicos Ativos" 
                    value={`${activeTechnicians} / ${technicians.length}`} 
                    icon={Users}
                    description="Técnicos online no momento"
                />
                <StatCard 
                    title="Manutenções Pendentes" 
                    value={pendingMaintenance} 
                    icon={Wrench}
                    description="Veículos com manutenção por KM vencida"
                />
            </div>
            <div className="grid gap-4 lg:grid-cols-5">
                <MaintenanceAlerts vehicles={vehicles} />
                <RecentActivityList activities={recentActivities} technicians={technicians} />
            </div>
        </div>
    );
}
