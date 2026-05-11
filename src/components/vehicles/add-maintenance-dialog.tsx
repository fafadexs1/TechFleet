
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addMaintenance } from '@/app/actions/maintenance';
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
  data_ultima_manutencao: z.string().refine((val) => val !== '', { message: 'A data da revisão é obrigatória.' }),
  data_proxima_manutencao: z.string().refine((val) => val !== '', { message: 'A data da próxima revisão é obrigatória.' }),
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
      ultima_manutencao: Number(vehicle.quilometragem) || 0,
      proxima_manutencao: (Number(vehicle.quilometragem) || 0) + 10000,
      data_ultima_manutencao: new Date().toISOString().split('T')[0],
      data_proxima_manutencao: '',
      observacao: '',
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        ultima_manutencao: Number(vehicle.quilometragem) || 0,
        proxima_manutencao: (Number(vehicle.quilometragem) || 0) + 10000,
        data_ultima_manutencao: new Date().toISOString().split('T')[0],
        data_proxima_manutencao: '',
        observacao: ''
      });
    }
  }, [open, form, vehicle]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setFormError(null);

    const result = await addMaintenance(Number(vehicle.id), {
        ...values,
        placa_carro: vehicle.placa,
        carroutilizado: `${vehicle.marca} ${vehicle.modelo}`,
        observacao: `Revisão realizada em ${new Date(values.data_ultima_manutencao).toLocaleDateString('pt-BR')}. Próxima prevista para ${new Date(values.data_proxima_manutencao).toLocaleDateString('pt-BR')} ou ${values.proxima_manutencao} km. \n\n${values.observacao}`,
    });

    if (result.error) {
      setFormError(result.error);
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
          <DialogTitle>Registrar Nova Revisão</DialogTitle>
          <DialogDescription>
            Atualize as informações de manutenção para o veículo <span className="font-mono font-semibold">{vehicle.placa}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_ultima_manutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Revisão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_proxima_manutencao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Próxima Revisão</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

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
