import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Building, Users, Mail, UserPlus, Trash2, Crown, Loader2,
    Calendar, Settings, Clock, Shield, Edit2, Save, X, ArrowRight, Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

interface Clinic {
    id: number;
    name: string;
    adminUserId: number;
    maxProfessionals: number;
    maxSecretaries: number;
}

interface ClinicMember {
    id: number;
    username: string;
    fullName: string;
    email: string;
    clinicRole: string;
}

interface ClinicInvitation {
    id: number;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
}

interface ClinicData {
    clinic: Clinic | null;
    members: ClinicMember[];
    invitations: ClinicInvitation[];
    isAdmin: boolean;
}

const MyClinic = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, navigate] = useLocation();

    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isCreateClinicDialogOpen, setIsCreateClinicDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'member' | 'secretary'>('member');
    const [clinicName, setClinicName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedClinicName, setEditedClinicName] = useState('');

    const { data: clinicData, isLoading, refetch: refetchClinic } = useQuery<ClinicData>({
        queryKey: ['/api/my-clinic'],
        enabled: !!user,
    });

    const { data: subscriptionData } = useQuery<any>({
        queryKey: ['/api/user-subscription'],
        enabled: !!user,
    });

    const { data: clinicAppointments, isLoading: isLoadingAppointments } = useQuery<any[]>({
        queryKey: ['/api/clinic/appointments'],
        enabled: !!user && !!clinicData?.clinic,
    });

    const createClinicMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await apiRequest('POST', '/api/clinics', { name });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao criar clínica'); }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Clínica criada!', description: 'Sua clínica foi configurada com sucesso.' });
            setIsCreateClinicDialogOpen(false);
            setClinicName('');
            refetchClinic();
        },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const inviteMemberMutation = useMutation({
        mutationFn: async (email: string) => {
            const clinicId = clinicData?.clinic?.id;
            if (!clinicId) throw new Error('Clínica não encontrada');
            const res = await apiRequest('POST', `/api/clinics/${clinicId}/invite`, { email, role: inviteRole });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao enviar convite'); }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Convite enviado!', description: `O ${inviteRole === 'secretary' ? 'secretário(a)' : 'profissional'} receberá um email com o convite.` });
            setIsInviteDialogOpen(false);
            setInviteEmail('');
            refetchClinic();
        },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const removeMemberMutation = useMutation({
        mutationFn: async (userId: number) => {
            const clinicId = clinicData?.clinic?.id;
            if (!clinicId) throw new Error('Clínica não encontrada');
            const res = await apiRequest('DELETE', `/api/clinics/${clinicId}/members/${userId}`);
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao remover membro'); }
            return res.json();
        },
        onSuccess: () => { toast({ title: 'Membro removido' }); refetchClinic(); },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const cancelInvitationMutation = useMutation({
        mutationFn: async (invitationId: number) => {
            const res = await apiRequest('DELETE', `/api/clinic/invitations/${invitationId}`);
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao cancelar convite'); }
            return res.json();
        },
        onSuccess: () => { toast({ title: 'Convite cancelado' }); refetchClinic(); },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const updateClinicMutation = useMutation({
        mutationFn: async (name: string) => {
            const clinicId = clinicData?.clinic?.id;
            if (!clinicId) throw new Error('Clínica não encontrada');
            const res = await apiRequest('PUT', `/api/clinics/${clinicId}`, { name });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao atualizar clínica'); }
            return res.json();
        },
        onSuccess: () => { toast({ title: 'Clínica atualizada!' }); setIsEditingName(false); refetchClinic(); },
        onError: (error: Error) => { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); }
    });

    const currentPlan = subscriptionData?.plan;
    const planName = currentPlan?.name?.toLowerCase() || '';
    const isClinicPlan = planName.includes('team') || planName.includes('business');
    const clinic = clinicData?.clinic;

    if (isLoading) {
        return (
            <div className="flex h-screen">
                <Sidebar />
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    // ─── Content renderers ───

    const renderPremiumGate = () => (
        <div className="space-y-6">
            {/* Hero card */}
            <Card className="border border-border shadow-sm overflow-hidden">
                <CardContent className="p-8 md:p-12">
                    <div className="flex flex-col items-center text-center max-w-xl mx-auto">
                        <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-6">
                            <Sparkles className="h-7 w-7 text-foreground" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
                            Gerencie sua clínica com facilidade
                        </h2>
                        <p className="text-muted-foreground text-base leading-relaxed mb-2">
                            Ferramentas completas de equipe, agenda unificada e configurações avançadas para clínicas multiprofissionais.
                        </p>
                        <p className="text-sm text-muted-foreground mb-8">
                            Disponível nos planos <span className="font-semibold text-foreground">Vita Team</span> e <span className="font-semibold text-foreground">Vita Business</span>.
                        </p>
                        <Button
                            onClick={() => navigate('/subscription')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base rounded-xl"
                            size="lg"
                        >
                            Ver Planos
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                            <Users className="h-5 w-5 text-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Gestão de Equipe</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Convide profissionais e gerencie sua equipe de forma centralizada.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                            <Calendar className="h-5 w-5 text-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Agenda Unificada</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Visão consolidada de todos os agendamentos da sua clínica.
                        </p>
                    </CardContent>
                </Card>
                <Card className="border border-border shadow-sm">
                    <CardContent className="p-6">
                        <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center mb-4">
                            <Settings className="h-5 w-5 text-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Configurações</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Controle total sobre dados, permissões e configurações da clínica.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    const renderCreateClinic = () => (
        <Card className="border-2 border-dashed border-border">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-muted rounded-2xl border border-border flex items-center justify-center mb-5">
                        <Building className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Configure sua Clínica</h3>
                    <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                        Você possui um plano {currentPlan?.name || 'clínica'}. Configure sua clínica para
                        começar a convidar outros profissionais.
                    </p>
                    <Button onClick={() => setIsCreateClinicDialogOpen(true)} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-6">
                        <Building className="h-4 w-4 mr-2" />
                        Criar Minha Clínica
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    const renderClinicContent = () => {
        if (!clinic || !clinicData) return null;
        return (
            <>
                {/* Clinic header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                            <Building className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{clinic.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-muted-foreground">
                                    {clinicData.members.length} / {clinic.maxProfessionals} profissionais
                                </span>
                                {clinicData.isAdmin && (
                                    <Badge className="bg-primary text-primary-foreground text-[10px] rounded-md">
                                        <Crown className="h-3 w-3 mr-1" />Admin
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="equipe" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-muted border border-border rounded-xl h-11">
                        <TabsTrigger value="equipe" className="flex items-center gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" style={{ color: '#333' }}>
                            <Users className="h-4 w-4" /><span className="hidden sm:inline">Equipe</span>
                        </TabsTrigger>
                        <TabsTrigger value="agenda" className="flex items-center gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" style={{ color: '#333' }}>
                            <Calendar className="h-4 w-4" /><span className="hidden sm:inline">Agenda</span>
                        </TabsTrigger>
                        <TabsTrigger value="config" className="flex items-center gap-2 text-xs sm:text-sm rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm" style={{ color: '#333' }}>
                            <Settings className="h-4 w-4" /><span className="hidden sm:inline">Configurações</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB: Equipe */}
                    <TabsContent value="equipe" className="space-y-6 mt-6">
                        {(() => {
                            const professionals = clinicData.members.filter(m => m.clinicRole === 'admin' || m.clinicRole === 'member');
                            const secretaries = clinicData.members.filter(m => m.clinicRole === 'secretary');
                            const pendingInvites = clinicData.invitations.filter(i => i.status === 'pending');

                            const profLimit = clinic.maxProfessionals;
                            const secLimit = 1; // Strict limit of 1 secretary

                            return (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card className="border border-border shadow-sm">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Profissionais</p>
                                                        <p className="text-2xl font-bold text-foreground">{professionals.length} / {profLimit}</p>
                                                    </div>
                                                    <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-foreground" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border border-border shadow-sm">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Secretárias</p>
                                                        <p className="text-2xl font-bold text-foreground">{secretaries.length} / {secLimit}</p>
                                                    </div>
                                                    <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-foreground" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="border border-border shadow-sm">
                                            <CardContent className="pt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Convites Pendentes</p>
                                                        <p className="text-2xl font-bold text-foreground">{pendingInvites.length}</p>
                                                    </div>
                                                    <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center">
                                                        <Mail className="h-5 w-5 text-foreground" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Professionals */}
                                    <Card className="border border-border shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle className="text-foreground">Profissionais de Saúde</CardTitle>
                                                <CardDescription className="text-muted-foreground">Médicos e profissionais vinculados</CardDescription>
                                            </div>
                                            {clinicData.isAdmin && professionals.length < profLimit && (
                                                <Button onClick={() => { setInviteRole('member'); setIsInviteDialogOpen(true); }} size="sm" className="bg-primary hover:bg-primary/90 rounded-lg">
                                                    <UserPlus className="h-4 w-4 mr-2" />Convidar Profissional
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {professionals.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border hover:border-gray-400 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                                                                {(member.fullName || member.username).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {member.fullName || member.username}
                                                                    {member.clinicRole === 'admin' && <Crown className="h-4 w-4 inline ml-2 text-muted-foreground" />}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">{member.email || 'Sem email'}</p>
                                                            </div>
                                                        </div>
                                                        {clinicData.isAdmin && member.clinicRole !== 'admin' && (
                                                            <Button variant="ghost" size="sm" onClick={() => removeMemberMutation.mutate(member.id)}
                                                                disabled={removeMemberMutation.isPending} className="text-destructive hover:text-destructive/90 hover:bg-red-50">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                                {professionals.length === 0 && (
                                                    <div className="text-center py-6 text-[#9E9E9E]">
                                                        <p>Nenhum profissional encontrado.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Secretaries */}
                                    <Card className="border border-border shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle className="text-foreground">Secretaria e Apoio</CardTitle>
                                                <CardDescription className="text-muted-foreground">Equipe de suporte administrativo</CardDescription>
                                            </div>
                                            {clinicData.isAdmin && secretaries.length < secLimit && (
                                                <Button onClick={() => { setInviteRole('secretary'); setIsInviteDialogOpen(true); }} size="sm" variant="outline" className="border-primary text-primary hover:bg-muted rounded-lg">
                                                    <UserPlus className="h-4 w-4 mr-2" />Convidar Secretária
                                                </Button>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {secretaries.map((member) => (
                                                    <div key={member.id} className="flex items-center justify-between p-4 bg-muted rounded-xl border border-border hover:border-gray-400 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center font-bold text-sm">
                                                                {(member.fullName || member.username).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-foreground">
                                                                    {member.fullName || member.username}
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">{member.email || 'Sem email'}</p>
                                                            </div>
                                                        </div>
                                                        {clinicData.isAdmin && (
                                                            <Button variant="ghost" size="sm" onClick={() => removeMemberMutation.mutate(member.id)}
                                                                disabled={removeMemberMutation.isPending} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                                {secretaries.length === 0 && (
                                                    <div className="text-center py-6 text-muted-foreground">
                                                        <p>Nenhuma secretária cadastrada.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Pending invitations */}
                                    {pendingInvites.length > 0 && (
                                        <Card className="border border-border shadow-sm">
                                            <CardHeader><CardTitle className="text-base text-foreground">Convites Pendentes</CardTitle></CardHeader>
                                            <CardContent>
                                                <div className="space-y-2">
                                                    {pendingInvites.map((invite) => (
                                                        <div key={invite.id} className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                                                            <div className="flex items-center gap-3">
                                                                <Mail className="h-5 w-5 text-muted-foreground" />
                                                                <div>
                                                                    <span className="font-medium text-foreground block">{invite.email}</span>
                                                                    <span className="text-xs text-muted-foreground">{invite.role === 'secretary' ? 'Secretária' : 'Profissional'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                                                                    Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                                                                </Badge>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                                    onClick={() => cancelInvitationMutation.mutate(invite.id)}
                                                                    disabled={cancelInvitationMutation.isPending}
                                                                    title="Cancelar convite"
                                                                >
                                                                    {cancelInvitationMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            );
                        })()}
                    </TabsContent>

                    {/* TAB: Agenda */}
                    <TabsContent value="agenda" className="space-y-6 mt-6">
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-foreground">Agenda da Clínica</CardTitle>
                                        <CardDescription className="text-muted-foreground">Agendamentos de hoje para toda a equipe</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="flex gap-1 items-center text-muted-foreground border-border">
                                        <Calendar className="h-3 w-3" />
                                        {clinicAppointments?.length || 0} agendamentos
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingAppointments ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
                                ) : !clinicAppointments || clinicAppointments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-muted rounded-2xl border border-border flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="h-7 w-7 text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum agendamento encontrado</h3>
                                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                            Não há agendamentos registrados para os membros da sua clínica.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Array.from(new Set(clinicAppointments.map(a => a.date))).sort().map(date => (
                                            <div key={date}>
                                                <h4 className="text-sm font-semibold mb-3 bg-muted border border-border px-3 py-1.5 rounded-lg inline-block" style={{ color: '#333' }}>
                                                    {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </h4>
                                                <div className="space-y-3 pl-3 border-l-2 border-border ml-2">
                                                    {clinicAppointments.filter(a => a.date === date).map(apt => (
                                                        <div key={apt.id} className="flex items-start justify-between p-4 bg-card rounded-xl border border-border hover:border-gray-400 hover:shadow-sm transition-all">
                                                            <div className="flex gap-3">
                                                                <div className="text-center min-w-[3rem]">
                                                                    <span className="block text-sm font-bold text-foreground">{apt.time}</span>
                                                                    <span className="block text-[10px] text-muted-foreground">{apt.duration} min</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-foreground">{apt.patientName}</p>
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                        <Users className="h-3 w-3" />
                                                                        Dr(a). {clinicData.members.find(m => m.id === apt.userId)?.fullName || clinicData.members.find(m => m.id === apt.userId)?.username || 'Desconhecido'}
                                                                    </p>
                                                                    {apt.type && (() => {
                                                                        const typeStyles: Record<string, string> = {
                                                                            consulta: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                                                                            retorno: 'bg-green-100 text-green-800 border-green-300',
                                                                            exames: 'bg-purple-100 text-purple-800 border-purple-300',
                                                                            procedimento: 'bg-blue-100 text-blue-800 border-blue-300',
                                                                            urgencia: 'bg-red-100 text-red-800 border-red-300',
                                                                        };
                                                                        const style = typeStyles[apt.type] || 'bg-gray-100 text-gray-700 border-gray-300';
                                                                        return (
                                                                            <Badge variant="secondary" className={`mt-1.5 text-[10px] h-5 border ${style}`}>
                                                                                {apt.type}
                                                                            </Badge>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                            <Badge className={
                                                                apt.status === 'completed' ? 'bg-muted text-foreground border border-border hover:bg-muted' :
                                                                    apt.status === 'cancelled' ? 'bg-red-50 text-destructive border border-red-100 hover:bg-red-50' :
                                                                        'bg-muted text-foreground border border-border hover:bg-muted'
                                                            }>
                                                                {apt.status === 'scheduled' ? 'Agendado' :
                                                                    apt.status === 'completed' ? 'Concluido' :
                                                                        apt.status === 'cancelled' ? 'Cancelado' : apt.status}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB: Configurações */}
                    <TabsContent value="config" className="space-y-6 mt-6">
                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-foreground">Dados da Clínica</CardTitle>
                                <CardDescription className="text-muted-foreground">Informações gerais da sua clínica</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">Nome da Clínica</Label>
                                    {isEditingName ? (
                                        <div className="flex gap-2">
                                            <Input value={editedClinicName} onChange={(e) => setEditedClinicName(e.target.value)}
                                                placeholder="Nome da clínica" className="flex-1 border-border focus:border-primary" />
                                            <Button size="sm" className="bg-primary hover:bg-primary/90"
                                                onClick={() => updateClinicMutation.mutate(editedClinicName)}
                                                disabled={!editedClinicName.trim() || updateClinicMutation.isPending}>
                                                {updateClinicMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)} className="border-border">
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-muted rounded-xl border border-border">
                                            <span className="font-medium text-foreground">{clinic.name}</span>
                                            {clinicData.isAdmin && (
                                                <Button size="sm" variant="ghost" onClick={() => { setEditedClinicName(clinic.name); setIsEditingName(true); }}
                                                    className="text-muted-foreground hover:text-foreground">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">Plano Atual</Label>
                                    <div className="p-3 bg-muted rounded-xl border border-border">
                                        <span className="font-medium text-foreground">{currentPlan?.name || 'Não identificado'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">Limite de Profissionais</Label>
                                    <div className="p-3 bg-muted rounded-xl border border-border">
                                        <span className="font-medium text-foreground">{clinic.maxProfessionals} profissionais</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-foreground">Segurança</CardTitle>
                                <CardDescription className="text-muted-foreground">Controle de acesso e permissões</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border">
                                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                                            <Shield className="h-5 w-5 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">Dados Protegidos</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">Todos os dados da clínica são criptografados e armazenados com segurança conforme a LGPD.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-muted rounded-xl border border-border">
                                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0">
                                            <Crown className="h-5 w-5 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">Administrador</p>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                {clinicData.isAdmin
                                                    ? 'Você é o administrador desta clínica. Apenas você pode convidar ou remover membros.'
                                                    : 'Apenas o administrador pode gerenciar membros e configurações da clínica.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </>
        );
    };

    // ─── Main content logic ───
    const renderContent = () => {
        if (!isClinicPlan) return renderPremiumGate();
        if (!clinic) return renderCreateClinic();
        return renderClinicContent();
    };

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <MobileHeader />
                <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                            <Building className="h-7 w-7 text-muted-foreground" />
                            Minha Clínica
                        </h1>
                        <p className="text-muted-foreground mt-1">Gerencie sua equipe, agenda e configurações da clínica.</p>
                    </div>

                    {renderContent()}

                    {/* Dialogs */}
                    <Dialog open={isCreateClinicDialogOpen} onOpenChange={setIsCreateClinicDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Criar Clínica</DialogTitle>
                                <DialogDescription className="text-muted-foreground">Defina um nome para sua clínica. Você poderá convidar profissionais para sua equipe.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clinicName" className="text-foreground">Nome da Clínica</Label>
                                    <Input id="clinicName" placeholder="Ex: Clínica Integrada Saúde" value={clinicName}
                                        onChange={(e) => setClinicName(e.target.value)} className="border-border focus:border-primary" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateClinicDialogOpen(false)} className="border-border text-muted-foreground">Cancelar</Button>
                                <Button onClick={() => createClinicMutation.mutate(clinicName)} disabled={!clinicName.trim() || createClinicMutation.isPending}
                                    className="bg-primary hover:bg-primary/90">
                                    {createClinicMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Criar Clínica
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-foreground">Convidar {inviteRole === 'secretary' ? 'Secretária' : 'Profissional'}</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Envie um convite por email para adicionar um novo {inviteRole === 'secretary' ? 'membro de apoio' : 'profissional'} à sua clínica.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="inviteEmail" className="text-foreground">Email do profissional</Label>
                                    <Input id="inviteEmail" type="email" placeholder="profissional@exemplo.com" value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)} className="border-border focus:border-primary" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)} className="border-border text-muted-foreground">Cancelar</Button>
                                <Button onClick={() => inviteMemberMutation.mutate(inviteEmail)} disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
                                    className="bg-primary hover:bg-primary/90">
                                    {inviteMemberMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Enviar Convite
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default MyClinic;
