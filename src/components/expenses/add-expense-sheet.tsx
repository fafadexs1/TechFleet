
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CalendarIcon } from 'lucide-react';
import type { Technician, Vehicle, DailyRecord } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '../ui/calendar';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';

const formSchema = z.object({
  gasto: z.coerce.number().min(0.01, { message: 'O valor do gasto deve ser maior que zero.' }),
  registro_motivo: z.string().min(1, { message: 'O motivo é obrigatório.' }),
  datahora: z.date({ required_error: 'A data e hora são obrigatórias.'}),
  tecnicoresponsavel: z.string().uuid().optional().nullable(),
  placa_carro: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
  pago: z.boolean().default(false),
});

type NewExpenseForm = z.infer<typeof formSchema>;

interface AddExpenseSheetProps {
  onExpenseAdded: () => void;
  technicians: Technician[];
  vehicles: Vehicle[];
}

export function AddExpenseSheet({ onExpenseAdded, technicians, vehicles }: AddExpenseSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<NewExpenseForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gasto: 0,
      registro_motivo: 'Abastecimento',
      datahora: new Date(),
      pago: false,
    },
  });

  async function onSubmit(values: NewExpenseForm) {
    setLoading(true);
    setFormError(null);

    const selectedTechnician = technicians.find(t => t.uuid === values.tecnicoresponsavel);
    const selectedVehicle = vehicles.find(v => v.placa === values.placa_carro);

    const newRecord: Omit<DailyRecord, 'id' | 'created_at' | 'km_inicial'> = {
        gasto: values.gasto,
        registro_motivo: values.registro_motivo as any,
        datahora: values.datahora.toISOString(),
        tecnicoresponsavel: values.tecnicoresponsavel,
        placa_carro: values.placa_carro || '',
        observacao: values.observacao,
        pago: values.pago,
        tecnico_nome: selectedTechnician?.display_name || 'N/A',
        carroutilizado: selectedVehicle ? `${selectedVehicle.marca} ${selectedVehicle.modelo}` : 'N/A'
    };

    const { error } = await supabase.from('registros').insert(newRecord);

    if (error) {
      console.error('Error inserting expense:', error);
      setFormError(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast({
      title: 'Despesa Adicionada!',
      description: `O gasto de R$ ${values.gasto.toFixed(2)} foi registrado com sucesso.`,
    });
    onExpenseAdded();
    form.reset();
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Adicionar Nova Despesa</SheetTitle>
        <SheetDescription>
            Registre um novo gasto manualmente.
        </SheetDescription>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6 pr-6">
          <FormField
            control={form.control}
            name="gasto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="150,00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registro_motivo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="Abastecimento">Abastecimento</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                          <SelectItem value="Alimentação">Alimentação</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                      </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="datahora"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data e Hora</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP 'às' HH:mm", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tecnicoresponsavel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Técnico Responsável</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione um técnico (opcional)" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="null">Nenhum</SelectItem>
                          {technicians.map(tech => (
                              <SelectItem key={tech.uuid} value={tech.uuid}>{tech.display_name}</SelectItem>
                          ))}
                      </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="placa_carro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo Utilizado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                      <FormControl>
                      <SelectTrigger>
                          <SelectValue placeholder="Selecione um veículo (opcional)" />
                      </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                          <SelectItem value="null">Nenhum</SelectItem>
                          {vehicles.map(vehicle => (
                              <SelectItem key={vehicle.placa} value={vehicle.placa}>{vehicle.marca} {vehicle.modelo} ({vehicle.placa})</SelectItem>
                          ))}
                      </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="observacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observações</FormLabel>
                <FormControl>
                  <Textarea placeholder="Detalhes adicionais sobre a despesa..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
              control={form.control}
              name="pago"
              render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                      <FormLabel>Despesa Paga?</FormLabel>
                      <FormDescription>
                      Marque se esta despesa já foi quitada.
                      </FormDescription>
                  </div>
                  <FormControl>
                      <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      />
                  </FormControl>
                  </FormItem>
              )}
          />

          {formError && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro no Cadastro</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
              </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adicionando...' : 'Adicionar Despesa'}
          </Button>
        </form>
      </Form>
    </>
  );
}
