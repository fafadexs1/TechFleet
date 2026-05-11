
import { Car } from 'lucide-react';
import prisma from '@/lib/prisma';
import { VehiclesClientPage } from '@/components/vehicles/vehicles-client-page';
import type { Vehicle } from '@/types';

async function getVehiclesData() {
    try {
        const [vehicles, technicians] = await Promise.all([
            prisma.carros.findMany({
                orderBy: { marca: 'asc' }
            }),
            prisma.membros.findMany()
        ]);

        const techMap = new Map(
            technicians
                .filter(t => t.uuid !== null)
                .map(t => [t.uuid as string, { ...t, id: Number(t.id) } as any])
        );
        
        return {
            // Convert BigInt to number for the client components
            vehicles: vehicles.map(v => ({
                ...v,
                id: Number(v.id),
                proxima_manutencao: v.proxima_manutencao ? Number(v.proxima_manutencao) : 0,
                quilometragem: v.quilometragem ? Number(v.quilometragem) : 0,
                ultima_manutencao: v.ultima_manutencao ? Number(v.ultima_manutencao) : 0,
                data_proxima_manutencao: v.data_proxima_manutencao?.toISOString(),
                data_ultima_manutencao: v.data_ultima_manutencao?.toISOString(),
                created_at: v.created_at.toISOString(),
            })),
            technicians: techMap
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error('Não foi possível carregar os dados. Tente novamente mais tarde.');
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
