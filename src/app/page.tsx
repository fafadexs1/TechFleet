import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TowerControl } from 'lucide-react';

export default function LoginPage() {
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
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" required />
              </div>
              <Button type="submit" className="w-full font-bold" asChild>
                <Link href="/dashboard">Entrar</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
