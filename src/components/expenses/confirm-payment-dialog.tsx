
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
  DialogClose,
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
import { AlertCircle, CheckCircle, Upload } from 'lucide-react';
import type { DailyRecord } from '@/types';
import { format, parseISO } from 'date-fns';

const formSchema = z.object({
  receipt: z
    .custom<FileList>()
    .refine((files) => files?.length === 1, 'É necessário enviar o comprovante de pagamento.')
    .refine((files) => files?.[0]?.type.startsWith('image/'), 'O arquivo deve ser uma imagem.'),
});

interface ConfirmPaymentDialogProps {
  dayData: {
    records: DailyRecord[];
    total: number;
    isPaid: boolean;
  };
  date: string;
  onPaymentConfirmed: () => void;
}

export function ConfirmPaymentDialog({ dayData, date, onPaymentConfirmed }: ConfirmPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setFormError(null);

    const receiptFile = values.receipt[0];
    if (!receiptFile) {
      setFormError('Nenhum arquivo de comprovante selecionado.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: "Erro de autenticação", description: "Usuário não encontrado. Faça login novamente.", variant: "destructive"});
        setLoading(false);
        return;
    }

    // 1. Upload receipt to Supabase Storage
    const fileExt = receiptFile.name.split('.').pop();
    const fileName = `${user.id}-${new Date().toISOString()}.${fileExt}`;
    const filePath = `abastecimentos_comprovantes/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('velpro')
      .upload(filePath, receiptFile);

    if (uploadError) {
      setFormError(`Erro no upload: ${uploadError.message}`);
      setLoading(false);
      return;
    }
    
    // 2. Get public URL of the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('velpro')
      .getPublicUrl(filePath);

    if (!publicUrl) {
        setFormError('Não foi possível obter a URL pública do comprovante.');
        setLoading(false);
        return;
    }

    // 3. Create payment record
    const recordsToUpdate = dayData.records.filter(r => !r.pago);
    const receiptUrls = recordsToUpdate
      .map(r => r.comprovante_gasolina)
      .filter((url): url is string => !!url);
    const expenseValues = recordsToUpdate
        .map(r => r.gasto)
        .filter((gasto): gasto is number => gasto !== null && gasto !== undefined);

    const { error: paymentError } = await supabase
      .from('pagamentos')
      .insert({ 
            motivo: 'Abastecimento',
            nomepagamento: `Despesas do dia ${format(parseISO(date), 'dd/MM/yyyy')}`,
            valorapagar: dayData.total,
            pagamentofeito: true,
            tecnico: user.id,
            created_at: new Date().toISOString(),
            comprovantes_abastecimentos: receiptUrls.length > 0 ? receiptUrls : null,
            valores_abastecidos: expenseValues,
            comprovante_pagamento: publicUrl,
       });

    if (paymentError) {
        toast({ title: "Erro ao registrar pagamento", description: paymentError.message, variant: "destructive" });
        setLoading(false);
        return;
    }

    // 4. Update expense records
    const recordIdsToUpdate = recordsToUpdate.map(r => r.id);
    const { error: updateError } = await supabase
        .from('registros')
        .update({ pago: true })
        .in('id', recordIdsToUpdate);
    
    if (updateError) {
        toast({ title: "Erro ao atualizar despesas", description: updateError.message, variant: "destructive" });
        // Handle the case where payment was created but expenses not updated
    } else {
        onPaymentConfirmed();
    }

    setLoading(false);
    setOpen(false);
    form.reset();
  }

  const fileRef = form.register('receipt');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
             <Button>
                <CheckCircle className="mr-2 h-4 w-4"/>
                Confirmar Pagamento do Dia
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
                <DialogTitle>Confirmar Pagamento e Anexar Comprovante</DialogTitle>
                <DialogDescription>
                    Para marcar as despesas do dia como pagas, por favor, anexe o comprovante de pagamento geral.
                </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                <FormField
                    control={form.control}
                    name="receipt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Comprovante de Pagamento</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/*" {...fileRef} />
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
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={loading} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        {loading ? 'Processando...' : 'Confirmar e Enviar'}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
    </Dialog>
  );
}

    