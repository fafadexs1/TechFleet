
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, AlertCircle, Car } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';
import type { Vehicle } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('carros')
                .select('*')
                .order('marca', { ascending: true });

            if (error) {
                console.error('Error fetching vehicles:', error);
                setError('Não foi possível carregar os dados dos veículos. Tente novamente mais tarde.');
            } else {
                setVehicles(data as Vehicle[]);
            }
            setLoading(false);
        };
        fetchVehicles();
    }, []);

    const getMaintenanceStatus = (dateStr?: string) => {
        if (!dateStr) return { label: 'N/D', variant: 'secondary' as const, className: '' };
        const maintenanceDate = new Date(dateStr);
        const today = new Date();
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(today.getMonth() + 1);

        if (maintenanceDate < today) return { label: 'Atrasada', variant: 'destructive' as const, className: '' };
        if (maintenanceDate <= oneMonthFromNow) return { label: 'Próxima', variant: 'default' as const, className: 'bg-accent text-accent-foreground hover:bg-accent/80' };
        return { label: 'Em dia', variant: 'secondary' as const, className: '' };
    };

    const VehicleRowSkeleton = () => (
        <TableRow>
            <TableCell><Skeleton className="h-16 w-16 rounded-md" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
        </TableRow>
    );

    return (
        <div className="flex flex-col gap-6">
            <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Car/> Frota de Veículos</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Todos os Veículos</CardTitle>
                    <CardDescription>Lista completa de veículos da frota e seus status.</CardDescription>
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
                                <TableHead>Placa</TableHead>
                                <TableHead>Marca/Modelo</TableHead>
                                <TableHead>Quilometragem</TableHead>
                                <TableHead>Técnico</TableHead>
                                <TableHead>Última Manut.</TableHead>
                                <TableHead>Próxima Manut.</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <VehicleRowSkeleton key={i} />)
                            ) : vehicles.length > 0 ? (
                                vehicles.map((vehicle) => {
                                    const status = getMaintenanceStatus(vehicle.data_proxima_manutencao);
                                    return (
                                    <TableRow key={vehicle.id}>
                                        <TableCell>
                                            <Image
                                                src={vehicle.foto_carro || 'https://placehold.co/80x80.png'}
                                                alt={vehicle.modelo || 'Veículo'}
                                                width={64}
                                                height={64}
                                                className="rounded-md object-cover"
                                                data-ai-hint="pickup truck"
                                            />
                                        </TableCell>
                                        <TableCell className="font-mono">{vehicle.placa || 'N/A'}</TableCell>
                                        <TableCell className="font-medium">{vehicle.marca} {vehicle.modelo}</TableCell>
                                        <TableCell>{vehicle.quilometragem ? vehicle.quilometragem.toLocaleString('pt-BR') : '0'} km</TableCell>
                                        <TableCell>
                                            {vehicle.tecnico_atual ? (
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span>{vehicle.tecnico_atual}</span>
                                                </div>
                                            ) : (
                                                <Badge variant="outline">Disponível</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {vehicle.data_ultima_manutencao ? format(new Date(vehicle.data_ultima_manutencao), 'dd/MM/yy', { locale: ptBR }) : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {vehicle.data_proxima_manutencao ? format(new Date(vehicle.data_proxima_manutencao), 'dd/MM/yy', { locale: ptBR }) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                                        </TableCell>
                                    </TableRow>
                                )})
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-24 text-center">
                                        Nenhum veículo encontrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
