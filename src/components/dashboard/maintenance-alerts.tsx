
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Vehicle } from "@/types";
import { Wrench } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

export function MaintenanceAlerts({ vehicles }: { vehicles: Vehicle[] }) {

    const vehiclesNeedingAttention = vehicles
        .filter(v => v.proxima_manutencao && v.quilometragem >= (v.proxima_manutencao - 2000))
        .sort((a, b) => (a.proxima_manutencao! - a.quilometragem) - (b.proxima_manutencao! - b.quilometragem));

    return (
        <Card>
             <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary"/>
                    Alerta de Manutenção
                </CardTitle>
                <CardDescription>Veículos que precisam de atenção por KM.</CardDescription>
            </CardHeader>
            <CardContent>
                <TooltipProvider>
                    <div className="space-y-4">
                        {vehiclesNeedingAttention.length > 0 ? vehiclesNeedingAttention.map(vehicle => {
                            const kmRemaining = vehicle.proxima_manutencao! - vehicle.quilometragem;
                            const isOverdue = kmRemaining <= 0;
                            const kmFormatted = Math.abs(kmRemaining).toLocaleString('pt-BR');
                            
                            let badgeVariant: "destructive" | "default" = isOverdue ? 'destructive' : 'default';
                            let badgeLabel = isOverdue ? `Atrasada` : `Próxima`;
                            let tooltipText = isOverdue ? `Revisão atrasada em ${kmFormatted} km.` : `Faltam ${kmFormatted} km para a revisão.`;
                            
                            return (
                                <div key={vehicle.id} className="flex items-center space-x-4">
                                    <Avatar className="h-10 w-10 rounded-lg">
                                        <AvatarImage src={vehicle.foto_carro || undefined} alt={vehicle.modelo || 'Veículo'} data-ai-hint="car side" className="rounded-lg"/>
                                        <AvatarFallback className="rounded-lg">{(vehicle.marca || 'V').charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-medium">{vehicle.marca} {vehicle.modelo}</p>
                                        <p className="text-sm text-muted-foreground">{vehicle.placa}</p>
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Badge variant={badgeVariant} className={!isOverdue ? 'bg-accent text-accent-foreground hover:bg-accent/80' : ''}>
                                                {badgeLabel}
                                            </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{tooltipText}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            )
                        }) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhum veículo com manutenção próxima.</p>
                        )}
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    );
}
