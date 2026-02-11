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
    Calendar, Settings, Clock, Shield, Edit2, Save, X
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
            const res = await apiRequest('POST', `/api/clinics/${clinicId}/invite`, { email });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Erro ao enviar convite'); }
            return res.json();
        },
        onSuccess: () => {
            toast({ title: 'Convite enviado!', description: 'O profissional receberá um email com o convite.' });
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
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </div>
        );
    }

    // ─── Content renderers ───

    const renderPremiumGate = () => (
        <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8 md:p-12 text-white">
                <div className="flex flex-col items-center text-center max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                        <Building className="h-10 w-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3">Recurso Premium</h2>
                    <p className="text-gray-300 mb-2">
                        Gerencie sua clínica multiprofissional com ferramentas completas de equipe, agenda unificada e configurações avançadas.
                    </p>
                    <p className="text-sm text-gray-400 mb-8">
                        Disponível nos planos <strong className="text-white">Vita Team</strong> e <strong className="text-white">Vita Business</strong>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm font-medium">Gestão de Equipe</p>
                            <p className="text-xs text-gray-400">Convide profissionais</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <Calendar className="h-6 w-6 text-green-400 mx-auto mb-2" />
                            <p className="text-sm font-medium">Agenda Unificada</p>
                            <p className="text-xs text-gray-400">Visão consolidada</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <Settings className="h-6 w-6 text-amber-400 mx-auto mb-2" />
                            <p className="text-sm font-medium">Configurações</p>
                            <p className="text-xs text-gray-400">Controle total</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => navigate('/subscription')}
                        className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8 py-3 text-base"
                        size="lg"
                    >
                        <Crown className="h-5 w-5 mr-2 text-amber-500" />
                        Ver Planos
                    </Button>
                </div>
            </div>
        </Card>
    );

    const renderCreateClinic = () => (
        <Card className="border-dashed border-2">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Building className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Configure sua Clínica</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Você possui um plano {currentPlan?.name || 'clínica'}. Configure sua clínica para
                        começar a convidar outros profissionais.
                    </p>
                    <Button onClick={() => setIsCreateClinicDialogOpen(true)} className="bg-[#212121] hover:bg-[#424242]">
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
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#212121] rounded-xl flex items-center justify-center">
                            <Building className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{clinic.name}</h2>
                            <p className="text-sm text-gray-500">
                                {clinicData.members.length} / {clinic.maxProfessionals} profissionais
                                {clinicData.isAdmin && (
                                    <Badge className="bg-amber-500 text-white ml-2 text-[10px]">
                                        <Crown className="h-3 w-3 mr-1" />Admin
                                    </Badge>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="equipe" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                        <TabsTrigger value="equipe" className="flex items-center gap-2 text-xs sm:text-sm">
                            <Users className="h-4 w-4" /><span className="hidden sm:inline">Equipe</span>
                        </TabsTrigger>
                        <TabsTrigger value="agenda" className="flex items-center gap-2 text-xs sm:text-sm">
                            <Calendar className="h-4 w-4" /><span className="hidden sm:inline">Agenda</span>
                        </TabsTrigger>
                        <TabsTrigger value="config" className="flex items-center gap-2 text-xs sm:text-sm">
                            <Settings className="h-4 w-4" /><span className="hidden sm:inline">Configurações</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB: Equipe */}
                    <TabsContent value="equipe" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Profissionais</p>
                                            <p className="text-2xl font-bold">{clinicData.members.length} / {clinic.maxProfessionals}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                                            <Users className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Convites Pendentes</p>
                                            <p className="text-2xl font-bold">{clinicData.invitations.length}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                            <Mail className="h-6 w-6 text-orange-500" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Vagas Disponíveis</p>
                                            <p className="text-2xl font-bold">{Math.max(0, clinic.maxProfessionals - clinicData.members.length)}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                                            <UserPlus className="h-6 w-6 text-green-600" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Members */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Membros da Equipe</CardTitle>
                                    <CardDescription>Profissionais vinculados à clínica</CardDescription>
                                </div>
                                {clinicData.isAdmin && clinicData.members.length < clinic.maxProfessionals && (
                                    <Button onClick={() => setIsInviteDialogOpen(true)} size="sm" className="bg-[#212121] hover:bg-[#424242]">
                                        <UserPlus className="h-4 w-4 mr-2" />Convidar
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {clinicData.members.map((member) => (
                                        <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-[#212121] text-white flex items-center justify-center font-bold text-sm">
                                                    {(member.fullName || member.username).charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {member.fullName || member.username}
                                                        {member.clinicRole === 'admin' && <Crown className="h-4 w-4 inline ml-2 text-amber-500" />}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{member.email || 'Sem email'}</p>
                                                </div>
                                            </div>
                                            {clinicData.isAdmin && member.clinicRole !== 'admin' && (
                                                <Button variant="ghost" size="sm" onClick={() => removeMemberMutation.mutate(member.id)}
                                                    disabled={removeMemberMutation.isPending} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                    {clinicData.members.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                            <p>Nenhum membro na equipe ainda</p>
                                            <p className="text-sm">Convide profissionais para colaborar</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending invitations */}
                        {clinicData.invitations.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="text-base">Convites Pendentes</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {clinicData.invitations.map((invite) => (
                                            <div key={invite.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-5 w-5 text-orange-500" />
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
                    </TabsContent>

                    {/* TAB: Agenda */}
                    <TabsContent value="agenda" className="space-y-6 mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Agenda da Clínica</CardTitle>
                                        <CardDescription>Visão consolidada dos agendamentos de toda a equipe</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="flex gap-1 items-center">
                                        <Calendar className="h-3 w-3" />
                                        {clinicAppointments?.length || 0} agendamentos
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoadingAppointments ? (
                                    <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                                ) : !clinicAppointments || clinicAppointments.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Calendar className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum agendamento encontrado</h3>
                                        <p className="text-sm max-w-md mx-auto">
                                            Não há agendamentos registrados para os membros da sua clínica.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Group by date logic */}
                                        {Array.from(new Set(clinicAppointments.map(a => a.date))).sort().map(date => (
                                            <div key={date}>
                                                <h4 className="text-sm font-semibold text-gray-500 mb-3 bg-gray-50 p-2 rounded-md inline-block">
                                                    {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </h4>
                                                <div className="space-y-3 pl-2 border-l-2 border-gray-100 ml-2">
                                                    {clinicAppointments.filter(a => a.date === date).map(apt => (
                                                        <div key={apt.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                                                            <div className="flex gap-3">
                                                                <div className="text-center min-w-[3rem]">
                                                                    <span className="block text-sm font-bold text-gray-900">{apt.time}</span>
                                                                    <span className="block text-[10px] text-gray-400">{apt.duration} min</span>
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-900">{apt.patientName}</p>
                                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        Dr(a). {clinicData.members.find(m => m.id === apt.userId)?.fullName || clinicData.members.find(m => m.id === apt.userId)?.username || 'Desconhecido'}
                                                                    </p>
                                                                    {apt.type && (
                                                                        <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                                                                            {apt.type}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-1">
                                                                <Badge className={
                                                                    apt.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                                        apt.status === 'cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                                            'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                                                }>
                                                                    {apt.status === 'scheduled' ? 'Agendado' :
                                                                        apt.status === 'completed' ? 'Concluído' :
                                                                            apt.status === 'cancelled' ? 'Cancelado' : apt.status}
                                                                </Badge>
                                                            </div>
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Dados da Clínica</CardTitle>
                                <CardDescription>Informações gerais da sua clínica</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Nome da Clínica</Label>
                                    {isEditingName ? (
                                        <div className="flex gap-2">
                                            <Input value={editedClinicName} onChange={(e) => setEditedClinicName(e.target.value)}
                                                placeholder="Nome da clínica" className="flex-1" />
                                            <Button size="sm" className="bg-[#212121] hover:bg-[#424242]"
                                                onClick={() => updateClinicMutation.mutate(editedClinicName)}
                                                disabled={!editedClinicName.trim() || updateClinicMutation.isPending}>
                                                {updateClinicMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setIsEditingName(false)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <span className="font-medium">{clinic.name}</span>
                                            {clinicData.isAdmin && (
                                                <Button size="sm" variant="ghost" onClick={() => { setEditedClinicName(clinic.name); setIsEditingName(true); }}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Plano Atual</Label>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="font-medium">{currentPlan?.name || 'Não identificado'}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">Limite de Profissionais</Label>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className="font-medium">{clinic.maxProfessionals} profissionais</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Segurança</CardTitle>
                                <CardDescription>Controle de acesso e permissões</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                                        <Shield className="h-6 w-6 text-green-600 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">Dados Protegidos</p>
                                            <p className="text-xs text-gray-500">Todos os dados da clínica são criptografados e armazenados com segurança conforme a LGPD.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <Crown className="h-6 w-6 text-amber-500 flex-shrink-0" />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">Administrador</p>
                                            <p className="text-xs text-gray-500">
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
        <div className="flex h-screen bg-[#F9FAFB]">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                <MobileHeader />
                <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Building className="h-7 w-7 text-gray-700" />
                            Minha Clínica
                        </h1>
                        <p className="text-gray-500 mt-1">Gerencie sua equipe, agenda e configurações da clínica.</p>
                    </div>

                    {renderContent()}

                    {/* Dialogs */}
                    <Dialog open={isCreateClinicDialogOpen} onOpenChange={setIsCreateClinicDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Clínica</DialogTitle>
                                <DialogDescription>Defina um nome para sua clínica. Você poderá convidar profissionais para sua equipe.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clinicName">Nome da Clínica</Label>
                                    <Input id="clinicName" placeholder="Ex: Clínica Integrada Saúde" value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateClinicDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={() => createClinicMutation.mutate(clinicName)} disabled={!clinicName.trim() || createClinicMutation.isPending}
                                    className="bg-[#212121] hover:bg-[#424242]">
                                    {createClinicMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Criar Clínica
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Convidar Profissional</DialogTitle>
                                <DialogDescription>Envie um convite por email para adicionar um novo membro à sua clínica.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="inviteEmail">Email do profissional</Label>
                                    <Input id="inviteEmail" type="email" placeholder="profissional@exemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancelar</Button>
                                <Button onClick={() => inviteMemberMutation.mutate(inviteEmail)} disabled={!inviteEmail.trim() || inviteMemberMutation.isPending}
                                    className="bg-[#212121] hover:bg-[#424242]">
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
