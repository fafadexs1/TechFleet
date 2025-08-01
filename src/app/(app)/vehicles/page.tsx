
import { Car } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import type { Vehicle, Technician } from '@/types';
import { VehiclesClientPage } from '@/components/vehicles/vehicles-client-page';


async function getVehiclesData() {
    const vehiclesPromise = supabase.from('carros').select('*').order('marca', { ascending: true });
    const techniciansPromise = supabase.from('membros').select('*');

    const [vehiclesResult, techsResult] = await Promise.all([
        vehiclesPromise,
        techniciansPromise
    ]);

    if (vehiclesResult.error) {
        console.error('Error fetching vehicles:', vehiclesResult.error);
        throw new Error('Não foi possível carregar os dados dos veículos. Tente novamente mais tarde.');
    }
     if (techsResult.error) {
        console.error('Error fetching technicians:', techsResult.error);
        throw new Error('Não foi possível carregar os dados dos técnicos.');
    }

    const techMap = new Map(techsResult.data.map(t => [t.uuid, t]));
    
    return {
        vehicles: vehiclesResult.data as Vehicle[],
        technicians: techMap
    }
}

export default async function VehiclesPage() {
    const { vehicles, technicians } = await getVehiclesData();

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Car/> Frota de Veículos</h1>
            <VehiclesClientPage vehicles={vehicles} technicians={technicians} />
        </div>
    );
}
