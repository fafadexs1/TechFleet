
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createPayment } from '@/app/actions/payments';
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

    // STORAGE NOTICE: Since we are moving away from Supabase, 
    // a new storage provider (S3, Cloudinary, etc.) needs to be configured.
    // For now, we'll use a placeholder URL.
    const dummyPublicUrl = "https://placehold.co/600x400?text=Comprovante+Pagamento";

    const recordsToUpdate = dayData.records.filter(r => !r.pago);
    const receiptUrls = recordsToUpdate
      .map(r => r.comprovante_gasolina)
      .filter((url): url is string => !!url);
    const expenseValues = recordsToUpdate
        .map(r => r.gasto)
        .filter((gasto): gasto is number => gasto !== null && gasto !== undefined);

    const result = await createPayment({
        motivo: 'Abastecimento',
        nomepagamento: `Despesas do dia ${format(parseISO(date), 'dd/MM/yyyy')}`,
        valorapagar: dayData.total,
        comprovantes_abastecimentos: receiptUrls,
        valores_abastecidos: expenseValues,
        comprovante_pagamento: dummyPublicUrl,
        recordIds: recordsToUpdate.map(r => r.id)
    });

    if (result.error) {
        setFormError(result.error);
        setLoading(false);
        return;
    }

    onPaymentConfirmed();
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

    