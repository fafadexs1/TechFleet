'use server';

import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createPayment(data: any) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Sessão expirada. Faça login novamente.' };

    const result = await prisma.$transaction(async (tx: any) => {
        // 1. Create the payment record
        const payment = await tx.pagamentos.create({
            data: {
                motivo: data.motivo,
                nomepagamento: data.nomepagamento,
                valorapagar: data.valorapagar,
                pagamentofeito: true,
                tecnico: session.user.id,
                created_at: new Date(),
                comprovante_pagamento: data.comprovante_pagamento,
                // These are arrays in prisma schema
                comprovantes_abastecimentos: data.comprovantes_abastecimentos || [],
                valores_abastecidos: data.valores_abastecidos || []
            }
        });

        // 2. Update the expenses (registros)
        await tx.registros.updateMany({
            where: {
                id: { in: data.recordIds.map((id: any) => BigInt(id)) }
            },
            data: {
                pago: true
            }
        });

        return payment;
    });

    revalidatePath('/expenses');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return { error: error.message || 'Erro ao registrar pagamento.' };
  }
}
