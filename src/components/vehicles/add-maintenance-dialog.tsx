
'use client';

import { useState } from 'react';
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
import { AlertCircle, CalendarIcon, Wrench } from 'lucide-react';
import type { Vehicle } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  quilometragem: z.coerce.number().min(1, { message: 'A quilometragem é obrigatória.' }),
  data_ultima_manutencao: z.date({ required_error: 'A data da revisão é obrigatória.' }),
  data_proxima_manutencao: z.date().optional(),
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
      quilometragem: vehicle.quilometragem || 0,
      data_ultima_manutencao: new Date(),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setFormError(null);

    // 1. Update the vehicle in 'carros' table
    const { error: vehicleUpdateError } = await supabase
      .from('carros')
      .update({
        quilometragem: values.quilometragem,
        data_ultima_manutencao: values.data_ultima_manutencao.toISOString(),
        data_proxima_manutencao: values.data_proxima_manutencao?.toISOString(),
      })
      .eq('id', vehicle.id);

    if (vehicleUpdateError) {
      setFormError(vehicleUpdateError.message);
      setLoading(false);
      return;
    }

    // 2. Create a new record in 'registros' table
    const { error: recordInsertError } = await supabase.from('registros').insert({
      registro_motivo: 'Manutenção',
      placa_carro: vehicle.placa,
      carroutilizado: `${vehicle.marca} ${vehicle.modelo}`,
      datahora: values.data_ultima_manutencao.toISOString(),
      km_inicial: values.quilometragem, // Use km_inicial to store the mileage at the time of maintenance
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
    form.reset();
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
                <FormField
                control={form.control}
                name="quilometragem"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quilometragem Atual</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="data_ultima_manutencao"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Data da Revisão</FormLabel>
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
                                format(field.value, "PPP", { locale: ptBR })
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
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
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
                name="data_proxima_manutencao"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                    <FormLabel>Próxima Revisão (Opcional)</FormLabel>
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
                                format(field.value, "PPP", { locale: ptBR })
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
                    name="observacao"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Observações</FormLabel>
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
