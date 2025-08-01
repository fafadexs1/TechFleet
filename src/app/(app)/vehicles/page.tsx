
'use client';

import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { User, AlertCircle, Car, Mail, Phone, PlusCircle, Filter, Search, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/lib/supabase/client';
import type { Vehicle, Technician } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { VehicleHistorySheet } from '@/components/vehicles/vehicle-history-sheet';
import { AddVehicleSheet } from '@/components/vehicles/add-vehicle-sheet';
import { useMounted } from '@/hooks/use-mounted';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


function getInitials(name: string) {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

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

const getMaintenanceStatus = (vehicle: Vehicle) => {
    if (!vehicle.proxima_manutencao) return { label: 'N/D', key: 'nodate', variant: 'secondary' as const, className: '' };
    
    const kmRemaining = vehicle.proxima_manutencao - vehicle.quilometragem;

    if (kmRemaining <= 0) return { label: 'Atrasada', key: 'overdue', variant: 'destructive' as const, className: '' };
    if (kmRemaining <= 2000) return { label: 'Próxima', key: 'soon', variant: 'default' as const, className: 'bg-yellow-500/20 text-yellow-700 border-yellow-400' };
    return { label: 'Em dia', key: 'ok', variant: 'secondary' as const, className: '' };
};


export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [technicians, setTechnicians] = useState<Map<string, Technician>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [isAddVehicleSheetOpen, setAddVehicleSheetOpen] = useState(false);
    const [filters, setFilters] = useState({ query: '', brand: 'all', status: 'all', availability: 'all' });
    const isMounted = useMounted();

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        const { data: vehiclesData, error: vehiclesError } = await supabase
            .from('carros')
            .select('*')
            .order('marca', { ascending: true });

        if (vehiclesError) {
            console.error('Error fetching vehicles:', vehiclesError);
            setError('Não foi possível carregar os dados dos veículos. Tente novamente mais tarde.');
            setLoading(false);
            return;
        }

        const { data: techsData, error: techsError } = await supabase
            .from('membros')
            .select('*');

        if (techsError) {
                console.error('Error fetching technicians:', techsError);
                // Continue even if techs fail, but log it
        } else {
            const techMap = new Map(techsData.map(t => [t.uuid, t]));
            setTechnicians(techMap);
        }

        setVehicles(vehiclesData as Vehicle[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleVehicleAdded = () => {
        fetchData(); // Refetch all data
        setAddVehicleSheetOpen(false);
    }
    
    const uniqueBrands = useMemo(() => [...new Set(vehicles.map(v => v.marca))], [vehicles]);

    const filteredVehicles = useMemo(() => {
        return vehicles.filter(vehicle => {
            const queryLower = filters.query.toLowerCase();
            const searchMatch = !filters.query ||
                vehicle.placa?.toLowerCase().includes(queryLower) ||
                vehicle.modelo.toLowerCase().includes(queryLower) ||
                vehicle.marca.toLowerCase().includes(queryLower);

            const brandMatch = filters.brand === 'all' || vehicle.marca === filters.brand;
            
            const statusMatch = filters.status === 'all' || getMaintenanceStatus(vehicle).key === filters.status;

            const availabilityMatch = filters.availability === 'all' || (filters.availability === 'available' && !vehicle.tecnico_atual) || (filters.availability === 'in_use' && !!vehicle.tecnico_atual);

            return searchMatch && brandMatch && statusMatch && availabilityMatch;
        });
    }, [vehicles, filters]);


    if (!isMounted) {
        return (
             <div className="flex flex-col gap-6">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Car/> Frota de Veículos</h1>
                 <Card>
                    <CardHeader>
                         <Skeleton className="h-8 w-48" />
                         <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">Foto</TableHead>
                                    <TableHead>Placa</TableHead>
                                    <TableHead>Marca/Modelo</TableHead>
                                    <TableHead>Quilometragem</TableHead>
                                    <TableHead>Técnico</TableHead>
                                    <TableHead>Próxima Revisão (km)</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, i) => <VehicleRowSkeleton key={i} />)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <TooltipProvider>
            <Sheet onOpenChange={(isOpen) => !isOpen && setSelectedVehicle(null)}>
                <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h1 className="font-headline text-3xl font-bold flex items-center gap-2"><Car/> Frota de Veículos</h1>
                        <Sheet open={isAddVehicleSheetOpen} onOpenChange={setAddVehicleSheetOpen}>
                            <SheetTrigger asChild>
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Adicionar Veículo
                                </Button>
                            </SheetTrigger>
                            <SheetContent className="w-full sm:max-w-md">
                                <SheetHeader>
                                    <SheetTitle>Adicionar Novo Veículo</SheetTitle>
                                    <SheetDescription>
                                        Preencha os detalhes do novo veículo para adicioná-lo à frota.
                                    </SheetDescription>
                                </SheetHeader>
                                <AddVehicleSheet onVehicleAdded={handleVehicleAdded} />
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2">
                                <Filter className="h-5 w-5"/>
                                <CardTitle className="text-xl font-semibold">Filtros da Frota</CardTitle>
                            </div>
                            <CardDescription>Use os filtros abaixo para refinar a sua busca por veículos.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                <Input 
                                    placeholder="Buscar por placa, marca, modelo..." 
                                    className="pl-9"
                                    value={filters.query}
                                    onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                                />
                            </div>
                            <Select value={filters.brand} onValueChange={(value) => setFilters(prev => ({ ...prev, brand: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Filtrar por marca" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas as Marcas</SelectItem>
                                    {uniqueBrands.map(brand => (
                                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status da Manutenção" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Qualquer Status</SelectItem>
                                    <SelectItem value="ok">Em dia</SelectItem>
                                    <SelectItem value="soon">Próxima</SelectItem>
                                    <SelectItem value="overdue">Atrasada</SelectItem>
                                    <SelectItem value="nodate">Não definida</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={filters.availability} onValueChange={(value) => setFilters(prev => ({ ...prev, availability: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Disponibilidade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="available">Disponível</SelectItem>
                                    <SelectItem value="in_use">Em uso</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resultados ({filteredVehicles.length})</CardTitle>
                            <CardDescription>Lista de veículos da frota. Clique em um para ver seu histórico.</CardDescription>
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
                                        <TableHead>Próxima Revisão (km)</TableHead>
                                        <TableHead className="text-right">Status Manutenção</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => <VehicleRowSkeleton key={i} />)
                                    ) : filteredVehicles.length > 0 ? (
                                        filteredVehicles.map((vehicle) => {
                                            const status = getMaintenanceStatus(vehicle);
                                            const technician = vehicle.tecnico_atual ? technicians.get(vehicle.tecnico_atual) : undefined;

                                            return (
                                            <SheetTrigger asChild key={vehicle.id}>
                                                <TableRow onClick={() => setSelectedVehicle(vehicle)} className="cursor-pointer">
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
                                                        {technician ? (
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="link" className="p-0 h-auto" onClick={(e) => e.stopPropagation()}>
                                                                        <User className="h-4 w-4 mr-2" />
                                                                        {technician.display_name}
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Detalhes do Técnico</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="flex flex-col items-center gap-4 py-4">
                                                                        <Avatar className="h-24 w-24">
                                                                            <AvatarImage src={technician.foto_perfil} alt={technician.display_name} data-ai-hint="person portrait"/>
                                                                            <AvatarFallback>{getInitials(technician.display_name)}</AvatarFallback>
                                                                        </Avatar>
                                                                        <div className="text-center">
                                                                            <p className="text-xl font-bold">{technician.display_name}</p>
                                                                            <p className="text-sm text-muted-foreground">{technician.cargo}</p>
                                                                        </div>
                                                                        <div className="w-full space-y-2 text-sm">
                                                                            <div className="flex items-center gap-2">
                                                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                                                <span>{technician.email}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                                                <span>{technician.telefone || 'Não informado'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>
                                                            </Dialog>
                                                        ) : (
                                                            <Badge variant="outline">Disponível</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {vehicle.proxima_manutencao ? (
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                     <div className="flex items-center gap-2">
                                                                        <Wrench className="h-4 w-4 text-muted-foreground" />
                                                                        <span>{vehicle.proxima_manutencao.toLocaleString('pt-BR')} km</span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Última revisão em: {vehicle.ultima_manutencao?.toLocaleString('pt-BR')} km</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            ) : (
                                                                'N/A'
                                                            )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                                                    </TableCell>
                                                </TableRow>
                                            </SheetTrigger>
                                        )})
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                Nenhum veículo encontrado para os filtros selecionados.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                
                <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
                    {selectedVehicle && <VehicleHistorySheet vehicle={selectedVehicle} onUpdate={fetchData} />}
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    );
}
