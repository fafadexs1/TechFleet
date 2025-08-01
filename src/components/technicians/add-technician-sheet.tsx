
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
import { AlertCircle } from 'lucide-react';
import type { NewTechnician } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

    // This is NOT the recommended way to create users.
    // This should be done in a server environment with admin privileges.
    // This is a temporary solution for the demo.
    // It creates the user but also logs them in, which is not ideal for an admin panel.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.display_name,
        }
      }
    });

    if (authError || !authData.user) {
      console.error('Auth Error:', authError);
      setFormError(authError?.message || 'Não foi possível criar o usuário.');
      setLoading(false);
      return;
    }

    const newTechnician: NewTechnician = {
        uuid: authData.user.id,
        display_name: values.display_name,
        email: values.email,
        cargo: values.cargo,
        telefone: values.telefone || '',
        ativo: true,
        aprovado: true,
        online: 'false',
    };

    const { error: insertError } = await supabase
        .from('membros')
        .insert(newTechnician);

    if (insertError) {
        console.error('Insert Error:', insertError);
        // Attempt to clean up the created auth user if the db insert fails
        // This requires admin privileges and won't work from the client.
        // await supabase.auth.admin.deleteUser(authData.user.id);
        setFormError(insertError.message || 'Não foi possível salvar os detalhes do técnico.');
        setLoading(false);
        return;
    }

    setLoading(false);
    toast({
      title: 'Técnico Adicionado!',
      description: `Um e-mail de confirmação foi enviado para ${values.email}.`,
    });
    onTechnicianAdded();
    form.reset();
  }

  return (
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
  );
}

    