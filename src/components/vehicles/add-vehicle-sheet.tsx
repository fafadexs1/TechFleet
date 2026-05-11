
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addVehicle } from '@/app/actions/vehicles';
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
import { AlertCircle } from 'lucide-react';
import type { NewVehicle } from '@/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';

const formSchema = z.object({
  placa: z.string().min(7, { message: 'A placa deve ter 7 caracteres.' }).max(7),
  marca: z.string().min(2, { message: 'A marca é obrigatória.' }),
  modelo: z.string().min(1, { message: 'O modelo é obrigatório.' }),
  quilometragem: z.coerce.number().min(0, { message: 'A quilometragem não pode ser negativa.' }),
  data_ultima_manutencao: z.date().optional(),
  data_proxima_manutencao: z.date().optional(),
});

interface AddVehicleSheetProps {
  onVehicleAdded: () => void;
}

export function AddVehicleSheet({ onVehicleAdded }: AddVehicleSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      placa: '',
      marca: '',
      modelo: '',
      quilometragem: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setFormError(null);
    
    const result = await addVehicle({
      ...values,
      placa: values.placa.toUpperCase(),
      data_ultima_manutencao: values.data_ultima_manutencao?.toISOString(),
      data_proxima_manutencao: values.data_proxima_manutencao?.toISOString(),
    });

    if (result.error) {
      setFormError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast({
      title: 'Veículo Adicionado!',
      description: `O veículo ${values.marca} ${values.modelo} foi cadastrado com sucesso.`,
    });
    onVehicleAdded();
    form.reset();
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Adicionar Novo Veículo</SheetTitle>
        <SheetDescription>
            Preencha os detalhes do novo veículo para adicioná-lo à frota.
        </SheetDescription>
      </SheetHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6 pr-6">
          <FormField
            control={form.control}
            name="placa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input placeholder="BRA2E19" {...field} onChange={e => field.onChange(e.target.value.toUpperCase())} maxLength={7} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <Input placeholder="Fiat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="modelo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Strada" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quilometragem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quilometragem</FormLabel>
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
                <FormLabel>Última Manutenção (Opcional)</FormLabel>
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
                <FormLabel>Próxima Manutenção (Opcional)</FormLabel>
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

          {formError && (
              <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro no Cadastro</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
              </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Adicionando...' : 'Adicionar Veículo'}
          </Button>
        </form>
      </Form>
    </>
  );
}
