'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { signToken } from '@/lib/auth';

export async function addTechnician(data: any) {
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const userId = uuidv4();

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the user in the 'usuarios' table
      const user = await tx.usuarios.create({
        data: {
          id: userId,
          nome: data.display_name,
          email: data.email,
          senha_hash: hashedPassword,
          cargo: data.cargo,
          ativo: true,
        },
      });

      // 2. Create the technician record in the 'membros' table
      const technician = await tx.membros.create({
        data: {
          uuid: userId,
          display_name: data.display_name,
          email: data.email,
          cargo: data.cargo,
          telefone: data.telefone || '',
          ativo: true,
          aprovado: true,
          online: 'false',
        },
      });

      return technician;
    });

    revalidatePath('/technicians');
    return { success: true };
  } catch (error: any) {
    console.error('Error adding technician:', error);
    if (error.code === 'P2002') {
        return { error: 'Este e-mail já está cadastrado.' };
    }
    return { error: error.message || 'Erro ao adicionar técnico.' };
  }
}

export async function banTechnician(techId: number, reason: string) {
    try {
        const tech = await prisma.membros.findUnique({ where: { id: BigInt(techId) } });
        if (!tech || !tech.uuid) return { error: 'Técnico sem UUID válido.' };

        await prisma.$transaction([
            prisma.membros.update({
                where: { id: BigInt(techId) },
                data: { ban: true, ban_motivo: reason, ativo: false }
            }),
            prisma.usuarios.update({
                where: { id: tech.uuid },
                data: { ativo: false }
            })
        ]);

        revalidatePath('/technicians');
        return { success: true };
    } catch (error: any) {
        console.error('Error banning technician:', error);
        return { error: error.message || 'Erro ao banir técnico.' };
    }
}

export async function unbanTechnician(techId: number) {
    try {
        const tech = await prisma.membros.findUnique({ where: { id: BigInt(techId) } });
        if (!tech || !tech.uuid) return { error: 'Técnico sem UUID válido.' };

        await prisma.$transaction([
            prisma.membros.update({
                where: { id: BigInt(techId) },
                data: { ban: false, ban_motivo: null, ativo: true }
            }),
            prisma.usuarios.update({
                where: { id: tech.uuid },
                data: { ativo: true }
            })
        ]);

        revalidatePath('/technicians');
        return { success: true };
    } catch (error: any) {
        console.error('Error unbanning technician:', error);
        return { error: error.message || 'Erro ao remover banimento.' };
    }
}

export async function getTechniciansRefreshData() {
    try {
        const technicians = await prisma.membros.findMany({
            orderBy: { display_name: 'asc' }
        });

        return technicians.map((t: any) => ({
            ...t,
            id: Number(t.id),
            id_estoque_sgp: t.id_estoque_sgp ? Number(t.id_estoque_sgp) : null,
            created_at: t.created_at?.toISOString()
        }));
    } catch (error) {
        console.error('Error fetching technicians refresh data:', error);
        return [];
    }
}

export async function getTechnicianRecords(techUuid: string) {
    try {
        const records = await prisma.registros.findMany({
            where: {
                tecnicoresponsavel: techUuid
            },
            orderBy: { datahora: 'desc' }
        });

        return records.map((r: any) => ({
            ...r,
            id: Number(r.id),
            km_inicial: r.km_inicial ? Number(r.km_inicial) : 0,
            km_final: r.km_final ? Number(r.km_final) : 0,
            somar_km: r.somar_km ? Number(r.somar_km) : 0,
            prioridade_ticket: r.prioridade_ticket ? Number(r.prioridade_ticket) : 0,
            datahora: r.datahora?.toISOString(),
            created_at: r.created_at?.toISOString(),
            inicio_expediente: r.inicio_expediente?.toISOString(),
            final_expediente: r.final_expediente?.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching technician records:', error);
        return [];
    }
}
export async function updateTechnicianPassword(techId: number, newPassword: string) {
    try {
        const tech = await prisma.membros.findUnique({ where: { id: BigInt(techId) } });
        if (!tech || !tech.uuid) return { error: 'Técnico sem UUID válido.' };

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.usuarios.update({
            where: { id: tech.uuid },
            data: { senha_hash: hashedPassword }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating technician password:', error);
        return { error: error.message || 'Erro ao atualizar senha.' };
    }
}

export async function generateResetToken(techId: number) {
    try {
        const tech = await prisma.membros.findUnique({ where: { id: BigInt(techId) } });
        if (!tech || !tech.uuid) return { error: 'Técnico sem UUID válido.' };

        // Sign a token that expires in 24 hours
        const token = await signToken({ userId: tech.uuid }, '24h');

        return { token };
    } catch (error: any) {
        console.error('Error generating reset token:', error);
        return { error: 'Erro ao gerar token de recuperação.' };
    }
}
