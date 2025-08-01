
import { supabase } from '@/lib/supabase/client';
import type { DailyRecord, Technician, Vehicle } from '@/types';
import { DollarSign } from 'lucide-react';
import { ExpensesClientPage } from '@/components/expenses/expenses-client-page';


async function getExpensesData() {
    const expensesPromise = supabase
      .from('registros')
      .select('*')
      .gt('gasto', 0)
      .order('datahora', { ascending: false });

    const techniciansPromise = supabase.from('membros').select('*');
    const vehiclesPromise = supabase.from('carros').select('*');

    const [expensesResult, techsResult, vehiclesResult] = await Promise.all([
        expensesPromise,
        techniciansPromise,
        vehiclesPromise,
    ]);
    
    if (expensesResult.error) throw new Error(`Failed to fetch expenses: ${expensesResult.error.message}`);
    if (techsResult.error) console.warn('Could not fetch technicians', techsResult.error);
    if (vehiclesResult.error) console.warn('Could not fetch vehicles', vehiclesResult.error);


    return {
        allExpenses: (expensesResult.data as DailyRecord[]) || [],
        technicians: (techsResult.data as Technician[]) || [],
        vehicles: (vehiclesResult.data as Vehicle[]) || [],
    }
}


export default async function ExpensesPage() {
    const { allExpenses, technicians, vehicles } = await getExpensesData();

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <DollarSign className="h-7 w-7" />
                    Controle de Despesas
                </h1>
                <p className="text-muted-foreground">
                    Histórico de todos os gastos registrados, agrupados por dia.
                </p>
            </div>
            <ExpensesClientPage 
                allExpenses={allExpenses} 
                technicians={technicians} 
                vehicles={vehicles} 
            />
        </div>
    );
}
