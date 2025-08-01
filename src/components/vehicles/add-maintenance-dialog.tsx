
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { AlertCircle, Wrench } from 'lucide-react';
import type { Vehicle } from '@/types';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  ultima_manutencao: z.coerce.number().min(1, { message: 'A quilometragem da última revisão é obrigatória.' }),
  proxima_manutencao: z.coerce.number().min(1, { message: 'A quilometragem da próxima revisão é obrigatória.' }),
  observacao: z.string().optional(),
});

interface AddMaintenanceDialogProps {
  vehicle: Vehicle;
  onMaintenanceAdded: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddMaintenanceDialog({ vehicle, onMaintenanceAdded, open, onOpenChange }: AddMaintenanceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ultima_manutencao: vehicle.quilometragem || 0,
      proxima_manutencao: (vehicle.quilometragem || 0) + 10000,
      observacao: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        ultima_manutencao: vehicle.quilometragem || 0,
        proxima_manutencao: (vehicle.quilometragem || 0) + 10000,
        observacao: ''
      });
    }
  }, [open, form, vehicle]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setFormError(null);

    // 1. Update the vehicle in 'carros' table with KM values for maintenance
    const { error: vehicleUpdateError } = await supabase
      .from('carros')
      .update({
        ultima_manutencao: values.ultima_manutencao,
        proxima_manutencao: values.proxima_manutencao,
        data_ultima_manutencao: new Date().toISOString(), // Also stamp the date of this maintenance
      })
      .eq('id', vehicle.id);

    if (vehicleUpdateError) {
      setFormError(vehicleUpdateError.message);
      setLoading(false);
      return;
    }

    // 2. Create a new record in 'registros' table for history
    const { error: recordInsertError } = await supabase.from('registros').insert({
      registro_motivo: 'Manutenção',
      placa_carro: vehicle.placa,
      carroutilizado: `${vehicle.marca} ${vehicle.modelo}`,
      datahora: new Date().toISOString(),
      km_inicial: values.ultima_manutencao, // Use km_inicial to store the mileage at the time of maintenance
      observacao: values.observacao,
      tecnicoresponsavel: null, // Maintenance might not be done by a technician from the list
      tecnico_nome: 'Oficina'
    });
    
    if (recordInsertError) {
        // This is not ideal, as the vehicle might have been updated.
        // In a real app, you might want to use a transaction.
        setFormError(recordInsertError.message);
        setLoading(false);
        return;
    }


    setLoading(false);
    toast({
      title: 'Revisão Registrada!',
      description: `A manutenção para o veículo ${vehicle.placa} foi registrada com sucesso.`,
    });
    onMaintenanceAdded();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
             <Button variant="outline">
                <Wrench className="mr-2 h-4 w-4" />
                Registrar Revisão
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Registrar Nova Revisão por KM</DialogTitle>
                <DialogDescription>
                    Atualize as informações de manutenção para o veículo <span className="font-mono font-semibold">{vehicle.placa}</span>.
                    A quilometragem atual do veículo é <span className="font-mono font-semibold">{vehicle.quilometragem.toLocaleString('pt-BR')} km</span>.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <FormField
                    control={form.control}
                    name="ultima_manutencao"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>KM da Última Revisão</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="120000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="proxima_manutencao"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>KM da Próxima Revisão</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="130000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="observacao"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Serviços Realizados (Observações)</FormLabel>
                        <FormControl>
                            <Textarea
                            placeholder="Ex: Troca de óleo e filtros, alinhamento e balanceamento."
                            className="resize-none"
                            {...field}
                            />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {formError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Erro</AlertTitle>
                        <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                )}
                
                <DialogFooter>
                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Salvando...' : 'Salvar Revisão'}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}
