'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TowerControl } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
        if (error.message === 'Invalid login credentials') {
            setError('E-mail ou senha inválidos. Por favor, tente novamente.');
        } else {
            setError(error.message);
        }
    } else {
      toast({
        title: 'Login bem-sucedido!',
        description: 'Redirecionando para o dashboard.',
      });
      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
      <div className="relative z-10 w-full max-w-md p-4">
        <Card className="shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4 inline-flex items-center justify-center gap-2">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                    <TowerControl className="h-6 w-6" />
                </div>
                <h1 className="font-headline text-3xl font-bold text-primary">TechFleet</h1>
            </div>
            <CardTitle className="font-headline text-2xl">Bem-vindo de volta</CardTitle>
            <CardDescription>Faça login para gerenciar sua frota.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                />
              </div>
               {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Erro de autenticação</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full font-bold" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
