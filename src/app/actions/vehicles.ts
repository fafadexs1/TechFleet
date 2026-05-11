'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addVehicle(data: any) {
  try {
    const newVehicle = await prisma.carros.create({
      data: {
        placa: data.placa,
        marca: data.marca,
        modelo: data.modelo,
        quilometragem: BigInt(data.quilometragem || 0),
        data_ultima_manutencao: data.data_ultima_manutencao ? new Date(data.data_ultima_manutencao) : null,
        data_proxima_manutencao: data.data_proxima_manutencao ? new Date(data.data_proxima_manutencao) : null,
        proxima_manutencao: BigInt(0),
        ultima_manutencao: BigInt(0),
        displayname_tecnico: '',
        bindado: false
      }
    });

    revalidatePath('/vehicles');
    return { success: true, data: { ...newVehicle, id: Number(newVehicle.id) } };
  } catch (error: any) {
    console.error('Error adding vehicle:', error);
    return { error: error.message || 'Erro ao adicionar veículo.' };
  }
}

export async function updateVehicle(id: number, data: any) {
    try {
        const updated = await prisma.carros.update({
            where: { id: BigInt(id) },
            data: {
                ...data,
                quilometragem: data.quilometragem !== undefined ? BigInt(data.quilometragem) : undefined,
                proxima_manutencao: data.proxima_manutencao !== undefined ? BigInt(data.proxima_manutencao) : undefined,
                ultima_manutencao: data.ultima_manutencao !== undefined ? BigInt(data.ultima_manutencao) : undefined,
            }
        });
        revalidatePath('/vehicles');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating vehicle:', error);
        return { error: error.message || 'Erro ao atualizar veículo.' };
    }
}

export async function removeTechnicianFromVehicle(vehicleId: number, technicianUuid: string) {
    try {
        await prisma.$transaction([
            prisma.carros.update({
                where: { id: BigInt(vehicleId) },
                data: {
                    tecnico_atual: null,
                    displayname_tecnico: '',
                    bindado: false
                }
            }),
            prisma.membros.update({
                where: { uuid: technicianUuid },
                data: {
                    carro_atual: '',
                    foto_carro: ''
                }
            })
        ]);

        revalidatePath('/vehicles');
        return { success: true };
    } catch (error: any) {
        console.error('Error removing technician:', error);
        return { error: error.message || 'Erro ao remover técnico.' };
    }
}

export async function getVehiclesRefreshData() {
    try {
        const vehicles = await prisma.carros.findMany({
            orderBy: { marca: 'asc' }
        });
        
        return vehicles.map((v: any) => ({
            ...v,
            id: Number(v.id),
            proxima_manutencao: v.proxima_manutencao ? Number(v.proxima_manutencao) : 0,
            quilometragem: v.quilometragem ? Number(v.quilometragem) : 0,
            ultima_manutencao: v.ultima_manutencao ? Number(v.ultima_manutencao) : 0,
            data_proxima_manutencao: v.data_proxima_manutencao?.toISOString(),
            data_ultima_manutencao: v.data_ultima_manutencao?.toISOString(),
            created_at: v.created_at?.toISOString(),
        }));
    } catch (error) {
        console.error('Error fetching vehicles refresh data:', error);
        return [];
    }
}

export async function getVehicleRecords(placa: string) {
    try {
        const records = await prisma.registros.findMany({
            where: {
                placa_carro: placa,
                registro_motivo: { in: ['Expediente', 'Abastecimento', 'Manutenção'] }
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
        console.error('Error fetching vehicle records:', error);
        return [];
    }
}

export async function getVehicleById(id: number) {
    try {
        const vehicle = await prisma.carros.findUnique({
            where: { id: BigInt(id) }
        });

        if (!vehicle) return null;

        return {
            ...vehicle,
            id: Number(vehicle.id),
            proxima_manutencao: vehicle.proxima_manutencao ? Number(vehicle.proxima_manutencao) : 0,
            quilometragem: vehicle.quilometragem ? Number(vehicle.quilometragem) : 0,
            ultima_manutencao: vehicle.ultima_manutencao ? Number(vehicle.ultima_manutencao) : 0,
            data_proxima_manutencao: vehicle.data_proxima_manutencao?.toISOString(),
            data_ultima_manutencao: vehicle.data_ultima_manutencao?.toISOString(),
            created_at: vehicle.created_at?.toISOString(),
        };
    } catch (error) {
        console.error('Error fetching vehicle by id:', error);
        return null;
    }
}
