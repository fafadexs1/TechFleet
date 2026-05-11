
import prisma from '@/lib/prisma';
import type { Technician } from '@/types';
import { Users } from 'lucide-react';
import { TechniciansClientPage } from '@/components/technicians/technicians-client-page';

async function getTechniciansData() {
    try {
        const technicians = await prisma.membros.findMany({
            orderBy: { display_name: 'asc' }
        });

        return technicians.map(t => ({
            ...t,
            id: Number(t.id),
            id_estoque_sgp: t.id_estoque_sgp ? Number(t.id_estoque_sgp) : null,
            created_at: t.created_at?.toISOString()
        })) as unknown as Technician[];
    } catch (error) {
        console.error('Error fetching technicians:', error);
        throw new Error('Não foi possível carregar os dados dos técnicos. Tente novamente mais tarde.');
    }
}

export default async function TechniciansPage() {
    const technicians = await getTechniciansData();

    return (
        <div className="flex flex-col gap-6">
             <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Users/> Técnicos</h1>
             <TechniciansClientPage technicians={technicians} />
        </div>
    );
}
