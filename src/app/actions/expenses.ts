'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addExpense(data: any) {
  try {
    const result = await prisma.registros.create({
      data: {
        gasto: data.gasto,
        registro_motivo: data.registro_motivo,
        datahora: new Date(data.datahora),
        tecnicoresponsavel: data.tecnicoresponsavel === 'null' ? null : data.tecnicoresponsavel,
        placa_carro: data.placa_carro === 'null' ? '' : data.placa_carro,
        observacao: data.observacao,
        pago: data.pago,
        tecnico_nome: data.tecnico_nome,
        carroutilizado: data.carroutilizado
      }
    });

    revalidatePath('/expenses');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding expense:', error);
    return { error: error.message || 'Erro ao adicionar despesa.' };
  }
}

export async function markExpensesAsPaid(ids: number[]) {
  try {
    await prisma.registros.updateMany({
      where: {
        id: { in: ids.map(id => BigInt(id)) }
      },
      data: {
        pago: true
      }
    });

    revalidatePath('/expenses');
    return { success: true };
  } catch (error: any) {
    console.error('Error marking expenses as paid:', error);
    return { error: error.message || 'Erro ao marcar como pago.' };
  }
}

export async function getExpensesRefreshData() {
    const expenses = await prisma.registros.findMany({
        where: { gasto: { gt: 0 } },
        orderBy: { datahora: 'desc' }
    });
    
    const technicians = await prisma.membros.findMany();
    const vehicles = await prisma.carros.findMany();

    return {
        allExpenses: expenses.map((e: any) => ({
            ...e,
            id: Number(e.id),
            km_inicial: e.km_inicial ? Number(e.km_inicial) : 0,
            km_final: e.km_final ? Number(e.km_final) : 0,
            somar_km: e.somar_km ? Number(e.somar_km) : 0,
            prioridade_ticket: e.prioridade_ticket ? Number(e.prioridade_ticket) : 0,
            datahora: e.datahora?.toISOString(),
            created_at: e.created_at?.toISOString(),
            inicio_expediente: e.inicio_expediente?.toISOString(),
            final_expediente: e.final_expediente?.toISOString(),
        })),
        technicians: technicians.map((t: any) => ({
            ...t,
            id: Number(t.id),
            id_estoque_sgp: t.id_estoque_sgp ? Number(t.id_estoque_sgp) : null,
            created_at: t.created_at?.toISOString(),
        })),
        vehicles: vehicles.map((v: any) => ({
            ...v,
            id: Number(v.id),
            proxima_manutencao: v.proxima_manutencao ? Number(v.proxima_manutencao) : 0,
            quilometragem: v.quilometragem ? Number(v.quilometragem) : 0,
            ultima_manutencao: v.ultima_manutencao ? Number(v.ultima_manutencao) : 0,
            data_proxima_manutencao: v.data_proxima_manutencao?.toISOString(),
            data_ultima_manutencao: v.data_ultima_manutencao?.toISOString(),
            created_at: v.created_at?.toISOString(),
        }))
    };
}
