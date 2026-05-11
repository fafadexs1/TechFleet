'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addMaintenance(vehicleId: number, data: any) {
  try {
    const result = await prisma.$transaction([
      prisma.carros.update({
        where: { id: BigInt(vehicleId) },
        data: {
          ultima_manutencao: BigInt(data.ultima_manutencao),
          proxima_manutencao: BigInt(data.proxima_manutencao),
          data_ultima_manutencao: new Date(data.data_ultima_manutencao),
          data_proxima_manutencao: new Date(data.data_proxima_manutencao),
        }
      }),
      prisma.registros.create({
        data: {
          registro_motivo: 'Manutenção',
          placa_carro: data.placa_carro,
          carroutilizado: data.carroutilizado,
          datahora: new Date(),
          km_inicial: BigInt(data.ultima_manutencao),
          observacao: data.observacao,
          tecnico_nome: 'Oficina'
        }
      })
    ]);

    revalidatePath('/vehicles');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding maintenance:', error);
    return { error: error.message || 'Erro ao registrar manutenção.' };
  }
}
