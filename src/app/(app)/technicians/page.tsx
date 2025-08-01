
import { supabase } from '@/lib/supabase/client';
import type { Technician } from '@/types';
import { Users } from 'lucide-react';
import { TechniciansClientPage } from '@/components/technicians/technicians-client-page';

async function getTechniciansData() {
    const { data, error } = await supabase
        .from('membros')
        .select('*')
        .order('display_name', { ascending: true });

    if (error) {
        console.error('Error fetching technicians:', error);
        throw new Error('Não foi possível carregar os dados dos técnicos. Tente novamente mais tarde.');
    }
    return data as Technician[];
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
