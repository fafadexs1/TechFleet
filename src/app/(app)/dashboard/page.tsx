
'use client';

import { Car, Users, Wrench } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { MaintenanceAlerts } from '@/components/dashboard/maintenance-alerts';
import { RecentActivityList } from '@/components/dashboard/recent-activity';
import { mockVehicles, mockTechnicians, mockRecentActivities } from '@/lib/data';
import { useMounted } from '@/hooks/use-mounted';
import { Skeleton } from '@/components/ui/skeleton';

// In a real app, this would be an async function fetching data from Supabase
export default function DashboardPage() {
    const isMounted = useMounted();
    const vehicles = mockVehicles;
    const technicians = mockTechnicians;
    const recentActivities = mockRecentActivities;

    const activeTechnicians = technicians.filter(t => t.online === 'true').length;

    const pendingMaintenance = vehicles.filter(v => v.data_proxima_manutencao && new Date(v.data_proxima_manutencao) < new Date()).length.toString();

    if (!isMounted) {
         return (
            <div className="flex flex-col gap-6">
                <Skeleton className="h-9 w-64" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
                 <div className="grid gap-4 lg:grid-cols-5">
                    <Skeleton className="h-72 col-span-1 lg:col-span-2 rounded-lg" />
                    <Skeleton className="h-72 col-span-1 lg:col-span-3 rounded-lg" />
                </div>
            </div>
        );
    }


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

const CardSkeleton = () => (
    <div className="p-6 border rounded-lg bg-card shadow-sm">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24"/>
            <Skeleton className="h-4 w-4"/>
        </div>
        <div>
            <Skeleton className="h-8 w-12 mb-1"/>
            <Skeleton className="h-3 w-40"/>
        </div>
    </div>
)
