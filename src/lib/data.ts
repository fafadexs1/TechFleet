import type { Vehicle, Technician, DailyRecord, RecentActivity, AppVersion, Payment } from '@/types';

export const mockVehicles: Vehicle[] = [
  { id: 1, created_at: "2023-10-01T09:00:00Z", placa: 'BRA2E19', marca: 'Fiat', modelo: 'Strada', quilometragem: 125030, data_ultima_manutencao: '2024-05-15T09:00:00Z', data_proxima_manutencao: '2024-08-15T09:00:00Z', tecnico_atual: 'João Silva', displayname_tecnico: 'João Silva', foto_carro: 'https://placehold.co/600x400.png' },
  { id: 2, created_at: "2023-10-01T09:00:00Z", placa: 'XYZ7890', marca: 'Chevrolet', modelo: 'Montana', quilometragem: 89000, data_ultima_manutencao: '2024-06-01T09:00:00Z', data_proxima_manutencao: '2024-09-01T09:00:00Z', tecnico_atual: 'Maria Oliveira', displayname_tecnico: 'Maria Oliveira', foto_carro: 'https://placehold.co/600x400.png' },
  { id: 3, created_at: "2023-10-01T09:00:00Z", placa: 'PQR1234', marca: 'Volkswagen', modelo: 'Saveiro', quilometragem: 152000, data_ultima_manutencao: '2024-04-20T09:00:00Z', data_proxima_manutencao: '2024-07-20T09:00:00Z', tecnico_atual: 'Carlos Pereira', displayname_tecnico: 'Carlos Pereira', foto_carro: 'https://placehold.co/600x400.png' },
  { id: 4, created_at: "2023-10-01T09:00:00Z", placa: 'JKL5678', marca: 'Ford', modelo: 'Ranger', quilometragem: 75000, data_ultima_manutencao: '2024-07-01T09:00:00Z', data_proxima_manutencao: '2024-10-01T09:00:00Z', tecnico_atual: undefined, displayname_tecnico: '', foto_carro: 'https://placehold.co/600x400.png' },
];

export const mockTechnicians: Technician[] = [
    { id: 1, uuid: 'uuid1', created_at: "2023-01-01T00:00:00Z", cargo: 'Técnico de Campo', carro_atual: 'BRA2E19', display_name: 'João Silva', email: 'joao@email.com', online: 'true', telefone: '11999998888', foto_perfil: 'https://placehold.co/100x100.png', ativo: true, aprovado: true },
    { id: 2, uuid: 'uuid2', created_at: "2023-01-01T00:00:00Z", cargo: 'Técnico de Campo', carro_atual: 'XYZ7890', display_name: 'Maria Oliveira', email: 'maria@email.com', online: 'true', telefone: '21988887777', foto_perfil: 'https://placehold.co/100x100.png', ativo: true, aprovado: true },
    { id: 3, uuid: 'uuid3', created_at: "2023-01-01T00:00:00Z", cargo: 'Técnico de Campo', carro_atual: 'PQR1234', display_name: 'Carlos Pereira', email: 'carlos@email.com', online: 'false', telefone: '31977776666', foto_perfil: 'https://placehold.co/100x100.png', ativo: true, aprovado: true },
];

export const mockDailyRecords: DailyRecord[] = [
    { id: 1, created_at: "2024-07-22T08:00:00Z", datahora: "2024-07-22T08:00:00Z", registro_motivo: 'Expediente', tecnico_nome: 'João Silva', carroutilizado: 'Fiat Strada', placa_carro: 'BRA2E19', km_inicial: 124980, km_final: 125030, inicio_expediente: '2024-07-22T08:00:00Z', final_expediente: '2024-07-22T18:00:00Z' },
    { id: 2, created_at: "2024-07-22T10:30:00Z", datahora: "2024-07-22T10:30:00Z", registro_motivo: 'Abastecimento', tecnico_nome: 'João Silva', carroutilizado: 'Fiat Strada', placa_carro: 'BRA2E19', km_inicial: 125000, gasto: 150.00, abastecido: 30, local_de_abastecimento: 'Posto Ipiranga', comprovante_gasolina: 'https://placehold.co/400x600.png' },
    { id: 3, created_at: "2024-07-22T08:00:00Z", datahora: "2024-07-22T08:00:00Z", registro_motivo: 'Expediente', tecnico_nome: 'Maria Oliveira', carroutilizado: 'Chevrolet Montana', placa_carro: 'XYZ7890', km_inicial: 88950, km_final: 89000, inicio_expediente: '2024-07-22T08:05:00Z', final_expediente: '2024-07-22T18:10:00Z' },
];

export const mockRecentActivities: RecentActivity[] = [
    { id: 1, created_at: "2024-07-22T18:00:00Z", status: 'Concluído', objetivo: 'Final de Expediente', descricao: 'Finalizou o expediente com o veículo BRA2E19.', tecnico: 'uuid1' },
    { id: 2, created_at: "2024-07-22T10:30:00Z", status: 'Realizado', objetivo: 'Abastecimento', descricao: 'Abastecimento de R$ 150,00 para o veículo BRA2E19.', tecnico: 'uuid1' },
    { id: 3, created_at: "2024-07-22T08:00:00Z", status: 'Iniciado', objetivo: 'Início de Expediente', descricao: 'Iniciou o expediente com o veículo XYZ7890.', tecnico: 'uuid2' },
];

export const mockAppVersion: AppVersion = {
    id: 1,
    created_at: "2024-07-20T10:00:00Z",
    apkUrl: 'https://example.com/app.apk',
    apkFileName: 'techfleet_v1.2.3.apk',
    packageName: 'com.techfleet.app',
    appversion: '1.2.3'
};

export const mockPayments: Payment[] = [
    { id: 1, created_at: "2024-07-22T10:30:00Z", motivo: 'Abastecimento', nomepagamento: 'Combustível - João Silva', valorapagar: 150.00, pagamentofeito: true, tecnico: 'uuid1', comprovante_pagamento: 'https://placehold.co/400x600.png' },
    { id: 2, created_at: "2024-07-20T15:00:00Z", motivo: 'Manutenção', nomepagamento: 'Troca de óleo - Maria Oliveira', valorapagar: 250.00, pagamentofeito: false, tecnico: 'uuid2' },
];
