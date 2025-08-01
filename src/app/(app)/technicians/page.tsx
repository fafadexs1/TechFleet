'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import type { Technician } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Users } from 'lucide-react';

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export default function TechniciansPage() {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTechnicians = async () => {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('membros')
                .select('*');

            if (error) {
                console.error('Error fetching technicians:', error);
                setError('Não foi possível carregar os dados dos técnicos. Tente novamente mais tarde.');
            } else {
                setTechnicians(data as Technician[]);
            }
            setLoading(false);
        };

        fetchTechnicians();
    }, []);

    const TechnicianRowSkeleton = () => (
        <TableRow>
            <TableCell>
                <Skeleton className="h-10 w-10 rounded-full" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-40" />
            </TableCell>
            <TableCell>
                <Skeleton className="h-4 w-28" />
            </TableCell>
             <TableCell>
                <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Users/> Técnicos</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Equipe de Técnicos</CardTitle>
                    <CardDescription>Lista de todos os técnicos cadastrados no sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                         <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Erro ao Carregar</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">Foto</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Carro Atual</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <TechnicianRowSkeleton key={i} />)
                            ) : (
                                technicians.map((tech) => (
                                    <TableRow key={tech.id}>
                                        <TableCell>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={tech.foto_perfil} alt={tech.display_name} data-ai-hint="person portrait" />
                                                <AvatarFallback>{getInitials(tech.display_name)}</AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{tech.display_name}</div>
                                            <div className="text-sm text-muted-foreground">{tech.email}</div>
                                        </TableCell>
                                        <TableCell>{tech.telefone || 'N/A'}</TableCell>
                                        <TableCell>
                                            {tech.carro_atual ? (
                                                <Badge variant="secondary">{tech.carro_atual}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">Nenhum</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex gap-2 justify-end">
                                                <Badge variant={tech.online === 'true' ? 'default' : 'outline'} className={tech.online === 'true' ? 'bg-green-500/20 text-green-700 border-green-400' : ''}>
                                                    {tech.online === 'true' ? 'Online' : 'Offline'}
                                                </Badge>
                                                <Badge variant={tech.ativo ? 'secondary' : 'destructive'}>
                                                    {tech.ativo ? 'Ativo' : 'Inativo'}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                     {!loading && technicians.length === 0 && !error && (
                        <div className="text-center py-10 text-muted-foreground">
                            Nenhum técnico encontrado.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
