
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "@/types";
import { Wrench } from "lucide-react";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MaintenanceAlerts({ vehicles }: { vehicles: Vehicle[] }) {

    const vehiclesNeedingAttention = vehicles
        .filter(v => v.proxima_manutencao)
        .filter(v => v.quilometragem >= (v.proxima_manutencao! - 2000))
        .sort((a, b) => (a.proxima_manutencao! - a.quilometragem) - (b.proxima_manutencao! - b.quilometragem))
        .slice(0, 5);

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary"/>
                    Manutenções Próximas
                </CardTitle>
                <CardDescription>Veículos que precisam de atenção em breve (por KM).</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {vehiclesNeedingAttention.length > 0 ? vehiclesNeedingAttention.map(vehicle => {
                        const kmRemaining = vehicle.proxima_manutencao! - vehicle.quilometragem;
                        const isOverdue = kmRemaining <= 0;
                        const kmFormatted = Math.abs(kmRemaining).toLocaleString('pt-BR');
                        
                        return (
                            <div key={vehicle.id} className="flex items-center space-x-4">
                                <Avatar className="h-10 w-10 rounded-lg">
                                    <AvatarImage src={vehicle.foto_carro} alt={vehicle.modelo} data-ai-hint="car side" className="rounded-lg"/>
                                    <AvatarFallback className="rounded-lg">{vehicle.marca.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                                    <p className="text-sm text-muted-foreground">{vehicle.placa}</p>
                                </div>
                                <div className="text-right">
                                    <Badge variant={isOverdue ? 'destructive' : 'default'} className={!isOverdue ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''}>
                                        {isOverdue ? `Atrasada (${kmFormatted} km)` : `Em ${kmFormatted} km`}
                                    </Badge>
                                    {vehicle.data_proxima_manutencao && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(parseISO(vehicle.data_proxima_manutencao), { addSuffix: true, locale: ptBR })}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum veículo com manutenção próxima.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
