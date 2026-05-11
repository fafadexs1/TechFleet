
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addTechnician } from '@/app/actions/technicians';
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
import type { NewTechnician } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';

const formSchema = z.object({
  display_name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
  cargo: z.string().min(2, { message: 'O cargo é obrigatório.' }),
  telefone: z.string().optional(),
});

interface AddTechnicianSheetProps {
  onTechnicianAdded: () => void;
  existingCargos: string[];
}

export function AddTechnicianSheet({ onTechnicianAdded, existingCargos }: AddTechnicianSheetProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      display_name: '',
      email: '',
      password: '',
      cargo: '',
      telefone: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setFormError(null);

    const result = await addTechnician(values);

    if (result.error) {
      setFormError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    toast({
      title: 'Técnico Adicionado!',
      description: `O técnico ${values.display_name} foi cadastrado com sucesso.`,
    });
    onTechnicianAdded();
    form.reset();
  }

  return (
    <>
        <SheetHeader>
            <SheetTitle>Adicionar Novo Técnico</SheetTitle>
            <SheetDescription>
                Crie um novo usuário e adicione seus detalhes. Um e-mail de confirmação será enviado.
            </SheetDescription>
        </SheetHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6 pr-6">
            <FormField
            control={form.control}
            name="display_name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                    <Input placeholder="João da Silva" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                    <Input type="email" placeholder="joao.silva@email.com" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="cargo"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Cargo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {existingCargos.map((cargo) => (
                            <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                        ))}
                        </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Telefone (Opcional)</FormLabel>
                <FormControl>
                    <Input placeholder="(11) 99999-8888" {...field} />
                </FormControl>
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
            {loading ? 'Adicionando...' : 'Adicionar Técnico'}
            </Button>
        </form>
        </Form>
    </>
  );
}
