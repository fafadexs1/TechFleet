
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTechniciansRefreshData, banTechnician, unbanTechnician, updateTechnicianPassword, generateResetToken } from '@/app/actions/technicians';
import type { Technician } from '@/types';
import { Ban, Key, MoreVertical, PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TechnicianHistorySheet } from '@/components/technicians/technician-history-sheet';
import { AddTechnicianSheet } from '@/components/technicians/add-technician-sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy } from 'lucide-react';

function getInitials(name: string) {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

interface TechniciansClientPageProps {
    technicians: Technician[];
}

export function TechniciansClientPage({ technicians: initialTechnicians }: TechniciansClientPageProps) {
    const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
    const [banReason, setBanReason] = useState('');
    const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
    const [isAddTechnicianSheetOpen, setAddTechnicianSheetOpen] = useState(false);
    const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [existingCargos, setExistingCargos] = useState<string[]>([]);
    const { toast } = useToast();

    const fetchTechnicians = async () => {
        const data = await getTechniciansRefreshData();
        const uniqueCargos = [...new Set(data.map((t: any) => t.cargo).filter(Boolean))];
        setExistingCargos(uniqueCargos as string[]);
        setTechnicians(data as Technician[]);
    };
    
    useEffect(() => {
        const uniqueCargos = [...new Set(initialTechnicians.map(t => t.cargo).filter(Boolean))];
        setExistingCargos(uniqueCargos);
    }, [initialTechnicians]);

    const handleBan = async (techId: number) => {
        const result = await banTechnician(techId, banReason);
        
        if (result.error) {
            toast({
                title: "Erro ao Banir",
                description: result.error,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Técnico Banido",
                description: "O técnico foi banido com sucesso."
            });
            fetchTechnicians();
        }
        setBanReason('');
    };

    const handleUnban = async (techId: number) => {
        const result = await unbanTechnician(techId);
        
        if (result.error) {
            toast({
                title: "Erro ao Remover Banimento",
                description: result.error,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Banimento Removido",
                description: "O banimento do técnico foi removido."
            });
            fetchTechnicians();
        }
    };

    const handlePasswordChange = async () => {
        if (!selectedTechnician) return;
        
        const result = await updateTechnicianPassword(selectedTechnician.id, newPassword);
        
        if (result.error) {
            toast({
                title: "Erro ao Atualizar Senha",
                description: result.error,
                variant: "destructive"
            });
        } else {
            toast({
                title: "Senha Atualizada",
                description: `A senha de ${selectedTechnician.display_name} foi alterada com sucesso.`
            });
            setPasswordDialogOpen(false);
            setNewPassword('');
        }
    };

    const handleGenerateResetLink = async () => {
        if (!selectedTechnician) return;
        
        const result = await generateResetToken(selectedTechnician.id);
        
        if (result.error) {
            toast({
                title: "Erro ao Gerar Link",
                description: result.error,
                variant: "destructive"
            });
        } else if (result.token) {
            const resetUrl = `${window.location.origin}/reset-password?token=${result.token}`;
            navigator.clipboard.writeText(resetUrl);
            
            toast({
                title: "Link de Recuperação Copiado",
                description: "O link seguro foi copiado para a área de transferência. Ele expira em 24h."
            });
        }
    };
    
    const handleTechnicianAdded = () => {
        fetchTechnicians();
        setAddTechnicianSheetOpen(false);
    }

    return (
        <TooltipProvider>
            <Sheet onOpenChange={(isOpen: boolean) => !isOpen && setSelectedTechnician(null)}>
                <div className="flex items-center justify-end">
                    <Sheet open={isAddTechnicianSheetOpen} onOpenChange={setAddTechnicianSheetOpen}>
                        <SheetTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Técnico
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                            <AddTechnicianSheet onTechnicianAdded={handleTechnicianAdded} existingCargos={existingCargos} />
                        </SheetContent>
                    </Sheet>
                </div>
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Equipe de Técnicos</CardTitle>
                        <CardDescription>Lista de todos os técnicos cadastrados. Clique em um técnico para ver seu histórico.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[60px]">Foto</TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Cargo</TableHead>
                                    <TableHead>Telefone</TableHead>
                                    <TableHead>Carro Atual</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                    <TableHead className="w-[50px]">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {technicians.map((tech) => (
                                    <SheetTrigger asChild key={tech.id}>
                                        <TableRow onClick={() => setSelectedTechnician(tech)} className={`cursor-pointer ${tech.ban ? 'bg-destructive/10' : ''}`}>
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
                                            <TableCell>{tech.cargo || 'N/D'}</TableCell>
                                            <TableCell>{tech.telefone || 'N/A'}</TableCell>
                                            <TableCell>
                                                {tech.carro_atual ? (
                                                    <Badge variant="secondary">{tech.carro_atual}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">Nenhum</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end items-center flex-wrap">
                                                    {tech.ban && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="destructive" className="cursor-pointer">
                                                                        <Ban className="h-3 w-3 mr-1"/> Banido
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="max-w-xs">{tech.ban_motivo || 'Sem motivo especificado.'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                    )}
                                                    <Badge variant={tech.online === 'true' ? 'default' : 'outline'} className={tech.online === 'true' ? 'bg-green-500/20 text-green-700 border-green-400' : ''}>
                                                        {tech.online === 'true' ? 'Online' : 'Offline'}
                                                    </Badge>
                                                    <Badge variant={tech.ativo ? 'secondary' : 'destructive'}>
                                                        {tech.ativo ? 'Ativo' : 'Inativo'}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                    <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                                <MoreVertical className="h-4 w-4"/>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                            <DropdownMenuItem onSelect={() => {
                                                                setSelectedTechnician(tech);
                                                                setPasswordDialogOpen(true);
                                                            }}>
                                                                <Key className="mr-2 h-4 w-4" />
                                                                <span>Alterar Senha</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => {
                                                                setSelectedTechnician(tech);
                                                                handleGenerateResetLink();
                                                            }}>
                                                                <Copy className="mr-2 h-4 w-4" />
                                                                <span>Gerar Link de Reset</span>
                                                            </DropdownMenuItem>
                                                            {tech.ban ? (
                                                                <DropdownMenuItem onSelect={() => handleUnban(tech.id)}>
                                                                    <Ban className="mr-2 h-4 w-4" />
                                                                    <span>Remover Ban</span>
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <AlertDialogTrigger asChild>
                                                                    <DropdownMenuItem onSelect={(e: Event) => e.preventDefault()}>
                                                                        <Ban className="mr-2 h-4 w-4" />
                                                                        <span>Banir Técnico</span>
                                                                    </DropdownMenuItem>
                                                                </AlertDialogTrigger>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Banir {tech.display_name}?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta ação irá bloquear o acesso do técnico ao aplicativo. Ele não poderá mais fazer login.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                            <div className="grid gap-2">
                                                            <Label htmlFor="ban-reason">Motivo do Banimento (Obrigatório)</Label>
                                                            <Input 
                                                                id="ban-reason" 
                                                                placeholder="Ex: Violação dos termos de serviço"
                                                                value={banReason}
                                                                onChange={(e) => setBanReason(e.target.value)}
                                                            />
                                                            </div>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleBan(tech.id)} disabled={!banReason}>
                                                                Confirmar Banimento
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    </SheetTrigger>
                                ))}
                                {technicians.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                            Nenhum técnico encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-y-auto">
                    {selectedTechnician && <TechnicianHistorySheet technician={selectedTechnician} />}
                </SheetContent>
            </Sheet>

            <Dialog open={isPasswordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>
                            Digite a nova senha para {selectedTechnician?.display_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="password">Nova Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Digite a nova senha"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handlePasswordChange} disabled={!newPassword || newPassword.length < 6}>
                            Confirmar Alteração
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
