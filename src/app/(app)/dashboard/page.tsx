
'use client';

import { Car, Users, Wrench } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { MaintenanceAlerts } from '@/components/dashboard/maintenance-alerts';
import { RecentActivityList } from '@/components/dashboard/recent-activity';
import { mockVehicles, mockTechnicians, mockRecentActivities } from '@/lib/data';
import { useMounted } from '@/hooks/use-mounted';

// In a real app, this would be an async function fetching data from Supabase
export default function DashboardPage() {
    const isMounted = useMounted();
    const vehicles = mockVehicles;
    const technicians = mockTechnicians;
    const recentActivities = mockRecentActivities;

    const activeTechnicians = technicians.filter(t => t.online === 'true').length;

    // We can't render the card that uses `new Date()` on the server
    const pendingMaintenance = isMounted 
        ? vehicles.filter(v => v.data_proxima_manutencao && new Date(v.data_proxima_manutencao) < new Date()).length.toString()
        : '...';

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Total de Veículos" 
                    value={vehicles.length.toString()} 
                    icon={Car} 
                    description={`${vehicles.filter(v => v.bindado).length} em uso`}
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
                    description="Veículos com manutenção atrasada"
                />
            </div>
            <div className="grid gap-4 lg:grid-cols-5">
                <MaintenanceAlerts vehicles={vehicles} />
                <RecentActivityList activities={recentActivities} technicians={technicians} />
            </div>
        </div>
    );
}
