
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Technician } from "@/types";
import { Trophy, Award } from "lucide-react";

interface TopTechniciansByKmProps {
    topTechnicians: { uuid: string; totalKm: number }[];
    technicianMap: Map<string, Technician>;
}

function getInitials(name: string) {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

const medalColors = [
    'text-yellow-500', // Gold
    'text-slate-500', // Silver
    'text-yellow-700'  // Bronze
];

export function TopTechniciansByKm({ topTechnicians, technicianMap }: TopTechniciansByKmProps) {
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary"/>
                    Top KM Rodados no Mês
                </CardTitle>
                <CardDescription>Técnicos com maior distância percorrida.</CardDescription>
            </CardHeader>
            <CardContent>
                 {topTechnicians.length > 0 ? (
                    <ul className="space-y-4">
                        {topTechnicians.map((techData, index) => {
                            const technician = technicianMap.get(techData.uuid);
                            if (!technician) return null;

                            return (
                                <li key={technician.uuid} className="flex items-center space-x-4">
                                     {index < 3 ? (
                                        <Award className={`h-8 w-8 ${medalColors[index]}`} />
                                    ) : (
                                        <div className="h-8 w-8 flex items-center justify-center text-muted-foreground font-bold">
                                            {index + 1}
                                        </div>
                                    )}
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarImage src={technician.foto_perfil} alt={technician.display_name} data-ai-hint="person portrait" />
                                        <AvatarFallback>{getInitials(technician.display_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">
                                        {technician.display_name}
                                        </p>
                                    </div>
                                    <p className="font-bold font-mono text-sm">
                                        {techData.totalKm.toLocaleString('pt-BR')} km
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                 ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro de KM encontrado este mês.</p>
                 )}
            </CardContent>
        </Card>
    );
}
