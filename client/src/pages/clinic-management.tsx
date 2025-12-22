import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Building,
    Users,
    Mail,
    UserPlus,
    Trash2,
    Crown,
    Loader2,
    Copy,
    ExternalLink,
    AlertCircle
} from 'lucide-react';
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

interface ClinicMember {
    id: number;
    username: string;
    fullName: string | null;
    email: string | null;
    clinicRole: string | null;
}

interface ClinicInvitation {
    id: number;
    email: string;
    token: string;
    status: string;
    expiresAt: string;
}

interface Clinic {
    id: number;
    name: string;
    adminUserId: number;
    maxProfessionals: number;
}

interface ClinicData {
    clinic: Clinic | null;
    members: ClinicMember[];
    invitations: ClinicInvitation[];
    isAdmin: boolean;
}

const ClinicManagement = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [, navigate] = useLocation();

    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [clinicName, setClinicName] = useState('');

    // Fetch clinic data
    const { data: clinicData, isLoading, refetch } = useQuery<ClinicData>({
        queryKey: ['/api/my-clinic'],
        enabled: !!user,
    });

    // Create clinic mutation
    const createClinicMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await apiRequest('POST', '/api/clinics', { name });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erro ao criar clínica');
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Clínica criada!', description: 'Sua clínica foi configurada com sucesso.' });
            setIsCreateDialogOpen(false);
            setClinicName('');
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    });

    // Invite member mutation
    const inviteMemberMutation = useMutation({
        mutationFn: async (email: string) => {
            const res = await apiRequest('POST', `/api/clinics/${clinicData?.clinic?.id}/invite`, { email });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erro ao enviar convite');
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast({
                title: 'Convite enviado!',
                description: `Um convite foi enviado para ${inviteEmail}`
            });
            setIsInviteDialogOpen(false);
            setInviteEmail('');
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: async (memberId: number) => {
            const res = await apiRequest('DELETE', `/api/clinics/${clinicData?.clinic?.id}/members/${memberId}`);
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erro ao remover membro');
            }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Membro removido', description: 'O membro foi removido da clínica.' });
            refetch();
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin" />
            </div>
        );
    }

    const clinic = clinicData?.clinic;
    const members = clinicData?.members || [];
    const invitations = clinicData?.invitations || [];
    const isAdmin = clinicData?.isAdmin || false;

    // If no clinic and user doesn't have one, show setup prompt
    if (!clinic) {
        return (
            <div className="min-h-screen flex flex-col">
                <MobileHeader />
                <div className="flex flex-1 relative">
                    <Sidebar />
                    <main className="flex-1 bg-gray-50 p-4 md:p-8">
                        <div className="max-w-2xl mx-auto">
                            <Card className="border-dashed border-2">
                                <CardContent className="pt-6">
                                    <div className="flex flex-col items-center justify-center py-10 text-center">
                                        <Building className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h2 className="text-2xl font-semibold mb-2">Configurar sua Clínica</h2>
                                        <p className="text-muted-foreground mb-6 max-w-md">
                                            Você possui um plano de clínica multiprofissional. Configure sua clínica para
                                            começar a convidar outros profissionais.
                                        </p>
                                        <Button
                                            size="lg"
                                            onClick={() => setIsCreateDialogOpen(true)}
                                            className="bg-[#212121] hover:bg-[#424242]"
                                        >
                                            <Building className="h-4 w-4 mr-2" />
                                            Criar Minha Clínica
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Create Clinic Dialog */}
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Criar Clínica</DialogTitle>
                                    <DialogDescription>
                                        Defina um nome para sua clínica. Você poderá convidar até 5 profissionais.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="clinicName">Nome da Clínica</Label>
                                        <Input
                                            id="clinicName"
                                            placeholder="Ex: Clínica Integrada Saúde"
                                            value={clinicName}
                                            onChange={(e) => setClinicName(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                        Cancelar
                                    </Button>
                                    <Button
                                        onClick={() => createClinicMutation.mutate(clinicName)}
                                        disabled={!clinicName.trim() || createClinicMutation.isPending}
                                        className="bg-[#212121] hover:bg-[#424242]"
                                    >
                                        {createClinicMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Criar Clínica
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <MobileHeader />
            <div className="flex flex-1 relative">
                <Sidebar />
                <main className="flex-1 bg-gray-50 p-4 md:p-8">
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2 text-gray-900">{clinic.name}</h1>
                                <p className="text-gray-500">Gerencie sua equipe e convites</p>
                            </div>
                            {isAdmin && (
                                <Badge className="bg-amber-500 text-white">
                                    <Crown className="h-3 w-3 mr-1" />
                                    Administrador
                                </Badge>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Profissionais</p>
                                            <p className="text-2xl font-bold">{members.length} / {clinic.maxProfessionals}</p>
                                        </div>
                                        <Users className="h-8 w-8 text-primary" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Convites Pendentes</p>
                                            <p className="text-2xl font-bold">{invitations.length}</p>
                                        </div>
                                        <Mail className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Vagas Disponíveis</p>
                                            <p className="text-2xl font-bold">{Math.max(0, clinic.maxProfessionals - members.length)}</p>
                                        </div>
                                        <UserPlus className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Team Members */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Equipe</CardTitle>
                                    <CardDescription>Profissionais vinculados à clínica</CardDescription>
                                </div>
                                {isAdmin && members.length < clinic.maxProfessionals && (
                                    <Button onClick={() => setIsInviteDialogOpen(true)} size="sm">
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Convidar
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                                                    {(member.fullName || member.username).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        {member.fullName || member.username}
                                                        {member.clinicRole === 'admin' && (
                                                            <Crown className="h-4 w-4 inline ml-2 text-amber-500" />
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">{member.email || 'Sem email'}</p>
                                                </div>
                                            </div>
                                            {isAdmin && member.clinicRole !== 'admin' && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeMemberMutation.mutate(member.id)}
                                                    disabled={removeMemberMutation.isPending}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}

                                    {members.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>Nenhum membro na equipe ainda</p>
                                            <p className="text-sm">Convide profissionais para colaborar</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Invitations */}
                        {invitations.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Convites Pendentes</CardTitle>
                                    <CardDescription>Aguardando aceitação</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {invitations.map((invite) => (
                                            <div
                                                key={invite.id}
                                                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-5 w-5 text-blue-500" />
                                                    <span className="font-medium">{invite.email}</span>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Limit Warning */}
                        {members.length >= clinic.maxProfessionals && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Você atingiu o limite de {clinic.maxProfessionals} profissionais do seu plano.
                                    Entre em contato para expandir sua equipe.
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* Invite Member Dialog */}
                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Convidar Profissional</DialogTitle>
                                <DialogDescription>
                                    Envie um convite por email para adicionar um novo membro à sua clínica.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email do profissional</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="profissional@exemplo.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => inviteMemberMutation.mutate(inviteEmail)}
                                    disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
                                    className="bg-[#212121] hover:bg-[#424242]"
                                >
                                    {inviteMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Enviar Convite
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </main>
            </div>
        </div>
    );
};

export default ClinicManagement;
