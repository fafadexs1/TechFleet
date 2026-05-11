'use server';

import prisma from '@/lib/prisma';

export async function getTechnicians(): Promise<{ data?: any[], error?: string }> {
    try {
        const technicians = await prisma.membros.findMany({
            orderBy: { display_name: 'asc' }
        });
        return { 
            data: technicians.map(t => ({
                ...t,
                id: Number(t.id),
                id_estoque_sgp: t.id_estoque_sgp ? Number(t.id_estoque_sgp) : null,
                created_at: t.created_at?.toISOString() || '',
                uuid: t.uuid || '',
                cargo: t.cargo || '',
                carro_atual: t.carro_atual || '',
                display_name: t.display_name || '',
                email: t.email || '',
                online: t.online || '',
                telefone: t.telefone || '',
                foto_perfil: t.foto_perfil || '',
                ativo: !!t.ativo,
                aprovado: !!t.aprovado,
            })) as any[]
        };
    } catch (error) {
        console.error('Error fetching technicians:', error);
        return { error: 'Não foi possível carregar os técnicos.' };
    }
}

export async function getReportData(fromDate: string, toDate: string, technicianId?: string): Promise<{ data?: any[], error?: string }> {
    try {
        const where: any = {
            datahora: {
                gte: new Date(fromDate),
                lte: new Date(toDate)
            },
            registro_motivo: {
                in: ['Expediente', 'Abastecimento']
            }
        };

        if (technicianId && technicianId !== 'all') {
            where.tecnicoresponsavel = technicianId;
        }

        const records = await prisma.registros.findMany({
            where,
            orderBy: { datahora: 'asc' }
        });

        return { 
            data: records.map(r => ({
                ...r,
                id: Number(r.id),
                km_inicial: r.km_inicial ? Number(r.km_inicial) : 0,
                km_final: r.km_final ? Number(r.km_final) : 0,
                somar_km: r.somar_km ? Number(r.somar_km) : 0,
                problema: r.problema ? Number(r.problema) : 0,
                prioridade_ticket: r.prioridade_ticket ? Number(r.prioridade_ticket) : 0,
                datahora: r.datahora?.toISOString() || '',
                created_at: r.created_at?.toISOString() || '',
                inicio_expediente: r.inicio_expediente?.toISOString() || '',
                final_expediente: r.final_expediente?.toISOString() || '',
            })) as any[]
        };
    } catch (error) {
        console.error('Error fetching report data:', error);
        return { error: 'Não foi possível buscar os dados do relatório.' };
    }
}
