
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord } from '@/types';
import { Calendar } from 'lucide-react';
import { ScheduleClientPage } from '@/components/schedule/schedule-client-page';

async function getScheduleData() {
    const { data, error } = await supabase
        .from('registros')
        .select('*')
        .eq('registro_motivo', 'Expediente')
        .order('datahora', { ascending: false });
    
    if (error) {
        console.error('Error fetching schedule records:', error);
        throw new Error('Não foi possível carregar os registros de expediente.');
    }
    
    return data as DailyRecord[];
}


export default async function SchedulePage() {
    const allRecords = await getScheduleData();

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Calendar className="h-7 w-7"/> Expediente dos Técnicos
                </h1>
                <p className="text-muted-foreground">
                    Jornadas de trabalho diárias dos técnicos registradas no aplicativo.
                </p>
            </div>
            <ScheduleClientPage allRecords={allRecords} />
        </div>
    );
}
