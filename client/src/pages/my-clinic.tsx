import {
  useState } from 'react';
import { useQuery,
  useMutation,
  useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs,
  TabsContent,
  TabsList,
  TabsTrigger } from "@/components/ui/tabs";
import {
    Building,
  Users,
  Mail,
  UserPlus,
  Trash2,
  Crown,
  Calendar,
  Settings,
  Clock,
  Shield,
  Edit2,
  Save,
  X,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PatientHeader from "@/components/patient-header";
import { BrandLoader } from "@/components/ui/brand-loader";
import { isAppStoreRestrictedIOSAppShell } from '@/lib/app-shell';

interface Clinic {
    id: number;
    name: string;
    adminUserId: number;
    subscriptionId?: number | null;
    maxProfessionals: number;
    maxSecretaries: number;
    createdAt?: string;
}

interface UserClinicAccess extends Clinic {
    role: string;
    isActive: boolean;
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
    inviteCode?: string;
}

interface ClinicData {
    clinic: Clinic | null;
    clinics?: UserClinicAccess[];
    activeClinicId?: number | null;
    activeRole?: string | null;
    patientCount?: number;
    members: ClinicMember[];
    invitations: ClinicInvitation[];
    isAdmin: boolean;
    requiresClinicSetup?: boolean;
    canCreateClinic?: boolean;
}

const normalizePlanName = (planName?: string | null) =>
    (planName || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

const hasClinicAccessByPlan = (plan?: { name?: string | null; features?: unknown } | null) => {
    const normalizedName = normalizePlanName(plan?.name);
    const normalizedFeatureText = normalizePlanName(
        Array.isArray(plan?.features)
            ? plan.features.join(" ")
            : typeof plan?.features === "string"
                ? plan.features
                : ""
    );

    const hasAccessByName =
        normalizedName.includes("team") ||
        normalizedName.includes("business") ||
        normalizedName.includes("hospital") ||
        normalizedName.includes("clinica");

    const hasAccessByFeatures =
        normalizedFeatureText.includes("equipe") ||
        normalizedFeatureText.includes("profissionais") ||
        normalizedFeatureText.includes("secretaria") ||
        normalizedFeatureText.includes("secretario") ||
        normalizedFeatureText.includes("clinica");

    return hasAccessByName || hasAccessByFeatures;
};

const MyClinic = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [, navigate] = useLocation();
    const queryClient = useQueryClient();
    const iosBillingRestricted = isAppStoreRestrictedIOSAppShell();

    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isCreateClinicDialogOpen, setIsCreateClinicDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteCodeInput, setInviteCodeInput] = useState('');
    const [inviteRole, setInviteRole] = useState<'member' | 'secretary'>('member');
    const [clinicName, setClinicName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedClinicName, setEditedClinicName] = useState('');

    const { data: clinicData, isLoading, refetch: refetchClinic } = useQuery<ClinicData>({
        queryKey: ['/api/my-clinic', user?.id ?? null, user?.clinicId ?? null],
        enabled: !!user,
    });

    const { data: subscriptionData } = useQuery<any>({
        queryKey: ['/api/user-subscription'],
        enabled: !!user,
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
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            queryClient.invalidateQueries({ queryKey: ['/api/my-clinic'] });
            queryClient.invalidateQueries({ queryKey: ['/api/profiles'] });
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

    const selectClinicMutation = useMutation({
        mutationFn: async (clinicId: number) => {
            const res = await apiRequest('POST', '/api/my-clinic/select', { clinicId });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.message || 'Erro ao selecionar clínica');
            }
            return res.json();
        },
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['/api/user'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/my-clinic'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/profiles'] }),
            ]);

            toast({
                title: 'Clínica selecionada',
                description: 'O contexto de pacientes da clínica ativa foi atualizado.',
            });
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
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

    const acceptInviteCodeMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await apiRequest('POST', '/api/clinic-invitations/accept-code', { code });
            if (!res.ok) {
                const e = await res.json();
                throw new Error(e.message || 'Erro ao aceitar convite por código');
            }
            return res.json();
        },
        onSuccess: async () => {
            setInviteCodeInput('');
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['/api/user'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/my-invitations'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/my-clinic'] }),
                queryClient.invalidateQueries({ queryKey: ['/api/profiles'] }),
            ]);
            toast({
                title: 'Convite aceito',
                description: 'Você foi vinculado à clínica com sucesso.',
            });
            refetchClinic();
        },
        onError: (error: Error) => {
            toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        }
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
    const isClinicPlan = hasClinicAccessByPlan(currentPlan);
    const clinic = clinicData?.clinic;
    const accessibleClinics = clinicData?.clinics ?? [];
    const canCreateClinic = clinicData?.canCreateClinic !== false;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-background">
                <BrandLoader className="h-8 w-8 animate-spin text-muted-foreground" />
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
                            Disponível nos planos <span className="font-semibold text-foreground">Vita Team</span>, <span className="font-semibold text-foreground">Vita Business</span> e <span className="font-semibold text-foreground">Hospitais</span>.
                        </p>
                        {iosBillingRestricted ? (
                            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                                Planos de clínica e upgrades estão indisponíveis no app iOS neste momento.
                            </p>
                        ) : (
                            <Button
                                onClick={() => navigate('/subscription')}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base rounded-xl"
                                size="lg"
                            >
                                Ver Planos
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="border-2 border-dashed border-border">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-16 h-16 bg-muted rounded-2xl border border-border flex items-center justify-center mb-5">
                            <Building className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Criar Clínica Pessoal</h3>
                        <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                            Toda conta profissional precisa estar vinculada a uma clínica. Crie sua clínica pessoal para iniciar com segurança.
                        </p>
                        {!isClinicPlan && (
                            <p className="text-xs text-muted-foreground mb-6 max-w-md">
                                Seu plano atual permite uma clínica pessoal (1 profissional). Para convidar equipe, faça upgrade para um plano de clínica.
                            </p>
                        )}
                        {!canCreateClinic && (
                            <p className="text-xs text-destructive mb-4 max-w-md">
                                Sua conta já possui uma clínica administrada. Se ela não aparece, atualize a sessão ou contate o suporte.
                            </p>
                        )}
                        <Button onClick={() => setIsCreateClinicDialogOpen(true)} disabled={!canCreateClinic} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-6">
                            <Building className="h-4 w-4 mr-2" />
                            Criar Minha Clínica
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Entrar por Código de Convite
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Para secretárias e profissionais convidados. Use o código gerado pela clínica (enviado por email ou compartilhado pelo administrador).
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="inviteCode" className="text-foreground">Código do Convite</Label>
                        <Input
                            id="inviteCode"
                            placeholder="Ex: A1B2C3D4E5"
                            value={inviteCodeInput}
                            onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                            className="border-border focus:border-primary uppercase tracking-wider"
                            maxLength={10}
                        />
                    </div>
                    <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => acceptInviteCodeMutation.mutate(inviteCodeInput)}
                        disabled={!inviteCodeInput.trim() || acceptInviteCodeMutation.isPending}
                    >
                        {acceptInviteCodeMutation.isPending && <BrandLoader className="h-4 w-4 mr-2 animate-spin" />}
                        Entrar na Clínica
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        O código funciona apenas para convites pendentes enviados ao seu email cadastrado.
                    </p>
                </CardContent>
            </Card>
        </div>
    );

    const renderClinicContent = () => {
        if (!clinic || !clinicData) return null;
        const professionalCount = clinicData.members.filter(m => m.clinicRole === 'admin' || m.clinicRole === 'member').length;
        return (
            <>
                {/* Clinic header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                            <Building className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">{clinic.name}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-sm text-muted-foreground">
                                    {professionalCount} / {clinic.maxProfessionals} profissionais
                                </span>
                                {clinicData.isAdmin && (
                                    <Badge className="bg-primary text-primary-foreground text-[10px] rounded-md">
                                        <Crown className="h-3 w-3 mr-1" />Admin
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    {accessibleClinics.length > 1 && (
                        <div className="w-full md:w-[340px]">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Clínica ativa</Label>
                            <Select
                                value={String(clinic.id)}
                                onValueChange={(value) => {
                                    const nextClinicId = Number(value);
                                    if (!Number.isFinite(nextClinicId) || nextClinicId === clinic.id) return;
                                    selectClinicMutation.mutate(nextClinicId);
                                }}
                                disabled={selectClinicMutation.isPending}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecionar clínica" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accessibleClinics.map((accessibleClinic) => (
                                        <SelectItem key={accessibleClinic.id} value={String(accessibleClinic.id)}>
                                            {accessibleClinic.name} ({accessibleClinic.role === 'admin' ? 'Admin' : accessibleClinic.role === 'secretary' ? 'Secretaria' : 'Profissional'})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <Tabs defaultValue="equipe" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted border border-border rounded-xl h-11">
                        <TabsTrigger value="equipe" className="flex items-center gap-2 text-xs sm:text-sm rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            <Users className="h-4 w-4" /><span className="hidden sm:inline">Equipe</span>
                        </TabsTrigger>
                        <TabsTrigger value="config" className="flex items-center gap-2 text-xs sm:text-sm rounded-lg text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                            <Settings className="h-4 w-4" /><span className="hidden sm:inline">Configurações</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB: Equipe */}
                    <TabsContent value="equipe" className="space-y-6 mt-6">
                        {(() => {
                            const professionals = clinicData.members.filter(m => m.clinicRole === 'admin' || m.clinicRole === 'member');
                            const secretaries = clinicData.members.filter(m => m.clinicRole === 'secretary');
                            const pendingInvites = clinicData.invitations.filter(i => i.status === 'pending');
                            const patientCount = clinicData.patientCount ?? 0;

                            const profLimit = clinic.maxProfessionals;
                            const secLimit = clinic.maxSecretaries;

                            return (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                                                        <p className="text-sm text-muted-foreground">Secretaria</p>
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
                                                        <p className="text-sm text-muted-foreground">Pacientes</p>
                                                        <p className="text-2xl font-bold text-foreground">{patientCount}</p>
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
                                                    <UserPlus className="h-4 w-4 mr-2" />Convidar
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
                                                        <p>{secLimit > 0 ? 'Nenhum cadastro.' : 'Seu plano atual não inclui vagas de secretaria.'}</p>
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
                                                                    {invite.inviteCode && (
                                                                        <span className="text-[11px] text-muted-foreground block">Código: {invite.inviteCode}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                                                                    Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                                                                </Badge>
                                                                {clinicData.isAdmin && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                                                                        onClick={() => cancelInvitationMutation.mutate(invite.id)}
                                                                        disabled={cancelInvitationMutation.isPending}
                                                                        title="Cancelar convite"
                                                                    >
                                                                        {cancelInvitationMutation.isPending ? <BrandLoader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                                    </Button>
                                                                )}
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
                                                {updateClinicMutation.isPending ? <BrandLoader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-foreground">Limite de Secretárias</Label>
                                    <div className="p-3 bg-muted rounded-xl border border-border">
                                        <span className="font-medium text-foreground">{clinic.maxSecretaries} secretárias</span>
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
        if (clinic) return renderClinicContent();
        return renderCreateClinic();
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-background">
            <PatientHeader
                title="Minha Clínica"
                description="Gerencie sua equipe, agenda e configurações da clínica."
                showTitleAsMain={true}
                fullWidth={true}
                icon={<Building className="h-6 w-6" />}
            />
            <div className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8">
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
                                    {createClinicMutation.isPending && <BrandLoader className="h-4 w-4 mr-2 animate-spin" />}
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
                                    {inviteMemberMutation.isPending && <BrandLoader className="h-4 w-4 mr-2 animate-spin" />}
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
