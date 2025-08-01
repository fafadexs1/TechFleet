// Based on public.carros
export type Vehicle = {
  id: number;
  created_at: string;
  data_proxima_manutencao?: string;
  data_ultima_manutencao?: string;
  foto_carro?: string;
  marca: string;
  modelo: string;
  placa: string;
  proxima_manutencao?: number;
  quilometragem: number;
  ultima_manutencao?: number;
  tecnico_atual?: string;
  displayname_tecnico: string;
  bindado: boolean;
};

// Based on public.membros
export type Technician = {
  id: number;
  uuid: string;
  created_at: string;
  cargo: string;
  carro_atual: string;
  display_name: string;
  email: string;
  online: string;
  telefone: string;
  foto_perfil: string;
  ativo: boolean;
  aprovado: boolean;
  ban?: boolean;
  ban_motivo?: string;
};

// Based on public.registros
export type DailyRecord = {
  id: number;
  created_at: string;
  datahora: string;
  registro_motivo: 'Abastecimento' | 'Expediente';
  tecnico_nome: string;
  carroutilizado: string;
  placa_carro: string;
  km_inicial: number;
  km_final?: number;
  inicio_expediente?: string;
  final_expediente?: string;
  abastecido?: number; // Liters
  gasto?: number; // Cost
  local_de_abastecimento?: string;
  comprovante_gasolina?: string;
  observacao?: string;
};

// Based on public.atividades_recentes
export type RecentActivity = {
  id: number;
  created_at: string;
  status: string;
  objetivo: string;
  descricao: string;
  tecnico: string; // This is a UUID, should probably join with membros
};

// Based on public.atualiza_app
export type AppVersion = {
  id: number;
  created_at: string;
  apkUrl: string;
  apkFileName: string;
  packageName: string;
  appversion: string;
};

// Based on public.pagamentos
export type Payment = {
    id: number;
    created_at: string;
    motivo: string;
    nomepagamento: string;
    valorapagar: number;
    pagamentofeito: boolean;
    comprovante_pagamento?: string;
    tecnico: string; // UUID
};

// For supabase client, can be generated with: npx supabase gen types typescript --project-id "your-project-ref" > src/types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // This is a placeholder. Generate the actual types from your Supabase project.
  public: {
    Tables: {
      [key: string]: any
    }
  }
}
