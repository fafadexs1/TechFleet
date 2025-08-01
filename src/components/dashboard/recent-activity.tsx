
'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { RecentActivity, Technician } from "@/types";
import { Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function getInitials(name: string) {
    if (!name) return 'S';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

export function RecentActivityList({ activities, technicianMap }: { activities: RecentActivity[], technicianMap: Map<string, Technician> }) {
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary"/>
                    Atividade Recente
                </CardTitle>
                <CardDescription>Últimas ações registradas.</CardDescription>
            </CardHeader>
            <CardContent>
                 {activities.length > 0 ? (
                    <ul className="space-y-4">
                        {activities.map(activity => {
                            const technician = technicianMap.get(activity.tecnico);
                            const technicianName = technician?.display_name || 'Sistema';
                            return (
                                <li key={activity.id} className="flex items-start space-x-4">
                                    <Avatar className="h-10 w-10 border">
                                        <AvatarFallback>{getInitials(technicianName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">
                                            {technicianName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-semibold text-foreground">{activity.objetivo}:</span> {activity.descricao}
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                 ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade recente para mostrar.</p>
                 )}
            </CardContent>
        </Card>
    );
}
