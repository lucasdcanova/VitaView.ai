import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  Users,
  UploadCloud,
  AlertTriangle,
  Check,
  Building,
  Hospital,
  CreditCard,
  History,
  Mail,
  UserPlus,
  Trash2,
  Crown
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { StripePayment } from '@/components/ui/stripe-payment';

// Interfaces
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  maxProfiles: number;
  maxUploadsPerProfile: number;
  price: number;
  promoPrice?: number | null;
  promoDescription?: string | null;
  interval: string;
  features: string[] | string; // Can be array or string depending on API
  trialPeriodDays?: number | null;
  isActive: boolean;
  createdAt: string;
}

interface Subscription {
  id: number;
  userId: number;
  planId: number;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  canceledAt: string | null;
  profilesCreated: number;
  uploadsCount: Record<string, number>;
}

interface UserSubscription {
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
}

// Clinic-related interfaces
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

type PlanCategory = 'solo' | 'clinic' | 'hospital' | null;

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for Plans Logic
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>('solo');
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const plansRef = useRef<HTMLDivElement>(null);

  // Clinic management states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateClinicDialogOpen, setIsCreateClinicDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [clinicName, setClinicName] = useState('');

  // Queries
  const { data: subscriptionData, isLoading: isLoadingSubscription, refetch } = useQuery<UserSubscription>({
    queryKey: ['/api/user-subscription'],
    enabled: !!user,
  });

  const { data: limitsData } = useQuery({
    queryKey: ['/api/subscription/limits'],
    enabled: !!user,
  });

  const { data: subscriptionPlans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans']
  });

  // Clinic data query
  const { data: clinicData, refetch: refetchClinic } = useQuery<ClinicData>({
    queryKey: ['/api/my-clinic'],
    enabled: !!user,
  });

  // Clinic mutations
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
      setIsCreateClinicDialogOpen(false);
      setClinicName('');
      refetchClinic();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  const inviteMemberMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest('POST', `/api/clinics/${clinicData?.clinic?.id}/invite`, { email });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Erro ao enviar convite');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Convite enviado!', description: `Um convite foi enviado para ${inviteEmail}` });
      setIsInviteDialogOpen(false);
      setInviteEmail('');
      refetchClinic();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

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
      refetchClinic();
    },
    onError: (error: Error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  });

  // Process Plans Data
  const uniquePlans = subscriptionPlans.reduce((acc, plan) => {
    const existingPlan = acc.find(p => p.name === plan.name);
    if (!existingPlan || new Date(plan.createdAt) > new Date(existingPlan.createdAt)) {
      const filteredAcc = acc.filter(p => p.name !== plan.name);
      filteredAcc.push(plan);
      return filteredAcc;
    }
    return acc;
  }, [] as SubscriptionPlan[]);

  const plansWithFeaturesArray = uniquePlans.map(plan => ({
    ...plan,
    features: Array.isArray(plan.features) ? plan.features : []
  }));

  const allPlans = plansWithFeaturesArray.filter(plan => plan.isActive);

  const categories = [
    {
      id: 'solo' as PlanCategory,
      title: 'Vita Pro',
      description: 'Planos a partir de R$ 99/mês',
      icon: Users,
      color: 'bg-gray-50 border-gray-200 hover:bg-white'
    },
    {
      id: 'clinic' as PlanCategory,
      title: 'Vita Team',
      description: 'Planos a partir de R$ 299/mês',
      icon: Building,
      color: 'bg-gray-50 border-gray-200 hover:bg-white'
    },
    {
      id: 'hospital' as PlanCategory,
      title: 'Hospitais',
      description: 'Soluções Enterprise sob consulta',
      icon: Hospital,
      color: 'bg-gray-50 border-gray-200 hover:bg-white'
    }
  ];

  // Filter plans based on selected category
  const getPlansForCategory = (category: PlanCategory) => {
    if (!category) return [];

    const normalizedPlans = allPlans.map(p => ({
      ...p,
      normalizedName: (p.name || "").toLowerCase().trim()
    }));

    switch (category) {
      case 'solo':
      case 'solo':
        return normalizedPlans.filter(plan =>
          plan.normalizedName === 'gratuito' ||
          plan.normalizedName === 'vita pro'
        );
      case 'clinic':
      case 'clinic':
        return normalizedPlans.filter(plan =>
          plan.normalizedName === 'gratuito' ||
          plan.normalizedName === 'vita team' ||
          plan.normalizedName === 'vita business'
        );
      case 'hospital':
        return normalizedPlans.filter(plan =>
          plan.normalizedName === 'gratuito' ||
          plan.normalizedName === 'hospitais'
        );
      default:
        return [];
    }
  };

  const plans = getPlansForCategory(selectedCategory);
  const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

  // Mutation to cancel subscription
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/cancel-subscription');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao cancelar assinatura');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada com sucesso.',
        variant: 'default',
      });
      setCancelDialogOpen(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/limits'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  // Auth check
  useEffect(() => {
    if (!user && !isLoadingSubscription) {
      navigate('/auth');
    }
  }, [user, isLoadingSubscription, navigate]);

  // Scroll to plans when category selected
  useEffect(() => {
    if (selectedCategory && plansRef.current) {
      // Small delay to ensure layout is ready
      setTimeout(() => {
        plansRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [selectedCategory]);

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    await cancelSubscriptionMutation.mutateAsync();
  };

  const handleStartPayment = (planId: number) => {
    setSelectedPlanId(planId);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    toast({
      title: 'Assinatura realizada!',
      description: 'Seu plano foi atualizado com sucesso.',
    });
    refetch();
  };

  if (isLoadingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  const hasActiveSubscription = subscriptionData?.subscription && subscriptionData.subscription.status === 'active';
  const currentPlan = subscriptionData?.plan;
  const subscription = subscriptionData?.subscription;

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 bg-gray-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-12">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900">Assinatura e Planos</h1>
              <p className="text-gray-500">Gerencie seu plano atual e explore novas opções.</p>
            </div>

            {/* SECTION 1: Current Plan & Usage */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Meu Plano Atual
              </h2>

              {!hasActiveSubscription ? (
                <Card className="border-dashed border-2">
                  <CardContent className="py-4 px-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      {/* Left: Plan info */}
                      <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                        <div>
                          <h2 className="text-lg font-semibold">Plano Básico (Gratuito)</h2>
                          <p className="text-sm text-muted-foreground">
                            Limite de <strong>20 pacientes</strong>, <strong>10 uploads</strong>/perfil e <strong>1 página</strong>/upload
                          </p>
                        </div>
                      </div>

                      {/* Right: Stats */}
                      <div className="flex gap-3">
                        <div className="bg-gray-50 px-4 py-2 rounded-lg border text-center min-w-[70px]">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold">Pacientes</div>
                          <div className="text-lg font-bold">20</div>
                        </div>
                        <div className="bg-gray-50 px-4 py-2 rounded-lg border text-center min-w-[70px]">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold">Uploads</div>
                          <div className="text-lg font-bold">10</div>
                        </div>
                        <div className="bg-gray-50 px-4 py-2 rounded-lg border text-center min-w-[70px]">
                          <div className="text-[9px] text-muted-foreground uppercase font-bold">Páginas</div>
                          <div className="text-lg font-bold">1</div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center md:text-right mt-3">
                      Assine um plano profissional para desbloquear recursos ilimitados.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{currentPlan?.name}</CardTitle>
                          <CardDescription>Detalhes da sua assinatura</CardDescription>
                        </div>
                        <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                          {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b text-sm">
                          <span className="text-muted-foreground">Valor</span>
                          <span className="font-medium">
                            {currentPlan?.price === 0 ? 'Grátis' : `R$ ${(currentPlan?.price || 0) / 100},00/${currentPlan?.interval === 'month' ? 'mês' : 'ano'}`}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b text-sm">
                          <span className="text-muted-foreground">Próxima Renovação</span>
                          <span className="font-medium flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {subscription?.currentPeriodEnd && format(new Date(subscription.currentPeriodEnd), 'PPP', { locale: ptBR })}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3 text-sm text-muted-foreground uppercase tracking-wider">Recursos Inclusos</h4>
                        <ul className="space-y-2">
                          {Array.isArray(currentPlan?.features) && currentPlan?.features.map((feature, index) => (
                            <li key={index} className="flex items-start text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-4">
                      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            Cancelar assinatura
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Cancelar assinatura</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja cancelar sua assinatura? Você perderá acesso aos recursos premium ao final do período atual.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isProcessing}>
                              Manter assinatura
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleCancelSubscription}
                              disabled={isProcessing}
                            >
                              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirmar cancelamento'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  </Card>

                  {/* Usage Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Uso e Limites</CardTitle>
                      <CardDescription>Acompanhe a utilização dos recursos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 mr-2 text-primary" />
                            <span className="font-medium">Perfis de Pacientes</span>
                          </div>
                          <span className="text-sm font-medium">
                            {subscription?.profilesCreated} / {currentPlan?.maxProfiles === -1 ? '∞' : currentPlan?.maxProfiles}
                          </span>
                        </div>
                        {currentPlan?.maxProfiles !== -1 && (
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{
                                width: `${Math.min(((subscription?.profilesCreated || 0) / (currentPlan?.maxProfiles || 1)) * 100, 100)}%`
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center">
                            <UploadCloud className="h-5 w-5 mr-2 text-primary" />
                            <span className="font-medium">Uploads por Perfil (este mês)</span>
                          </div>
                        </div>

                        <div className="space-y-4 mt-4 max-h-[160px] overflow-y-auto pr-2">
                          {((limitsData as any)?.profiles || [])?.map((profile: any) => {
                            const profileId = profile.id.toString();
                            const uploadsUsed = (subscription?.uploadsCount as Record<string, number>)?.[profileId] || 0;
                            const uploadsTotal = currentPlan?.maxUploadsPerProfile || 0;
                            const percentage = uploadsTotal > 0 ? (uploadsUsed / uploadsTotal) * 100 : 0;

                            return (
                              <div key={profile.id} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span>{profile.name}</span>
                                  <span className="text-muted-foreground">
                                    {uploadsUsed} / {uploadsTotal === -1 ? '∞' : uploadsTotal}
                                  </span>
                                </div>
                                {uploadsTotal !== -1 && (
                                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 transition-all duration-500"
                                      style={{ width: `${Math.min(percentage, 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {((limitsData as any)?.profiles || []).length === 0 && (
                            <p className="text-xs text-center text-muted-foreground py-4">Nenhum paciente cadastrado</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </section>

            {/* SECTION 2: Clinic Management (only for clinic plans) */}
            {hasActiveSubscription && currentPlan?.name?.toLowerCase().includes('clínica') && (
              <section className="space-y-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5 text-primary" />
                  Gestão da Clínica
                  {clinicData?.isAdmin && (
                    <Badge className="bg-amber-500 text-white ml-2">
                      <Crown className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </h2>

                {/* If no clinic exists, show create clinic prompt */}
                {!clinicData?.clinic ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Building className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Configure sua Clínica</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          Você possui um plano Vita Team ou Vita Business. Configure sua clínica para
                          começar a convidar outros profissionais.
                        </p>
                        <Button
                          onClick={() => setIsCreateClinicDialogOpen(true)}
                          className="bg-[#212121] hover:bg-[#424242]"
                        >
                          <Building className="h-4 w-4 mr-2" />
                          Criar Minha Clínica
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Profissionais</p>
                              <p className="text-2xl font-bold">
                                {clinicData.members.length} / {clinicData.clinic.maxProfessionals}
                              </p>
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
                              <p className="text-2xl font-bold">{clinicData.invitations.length}</p>
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
                              <p className="text-2xl font-bold">
                                {Math.max(0, clinicData.clinic.maxProfessionals - clinicData.members.length)}
                              </p>
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
                          <CardTitle>{clinicData.clinic.name}</CardTitle>
                          <CardDescription>Profissionais vinculados à clínica</CardDescription>
                        </div>
                        {clinicData.isAdmin && clinicData.members.length < clinicData.clinic.maxProfessionals && (
                          <Button onClick={() => setIsInviteDialogOpen(true)} size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Convidar
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {clinicData.members.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
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
                              {clinicData.isAdmin && member.clinicRole !== 'admin' && (
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

                          {clinicData.members.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                              <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                              <p>Nenhum membro na equipe ainda</p>
                              <p className="text-sm">Convide profissionais para colaborar</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Pending Invitations */}
                    {clinicData.invitations.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Convites Pendentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {clinicData.invitations.map((invite) => (
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
                  </>
                )}

                {/* Create Clinic Dialog */}
                <Dialog open={isCreateClinicDialogOpen} onOpenChange={setIsCreateClinicDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Clínica</DialogTitle>
                      <DialogDescription>
                        Defina um nome para sua clínica. Você poderá convidar até {currentPlan?.name?.includes('+') ? '5+' : '5'} profissionais.
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
                      <Button variant="outline" onClick={() => setIsCreateClinicDialogOpen(false)}>
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
                        <Label htmlFor="inviteEmail">Email do profissional</Label>
                        <Input
                          id="inviteEmail"
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
              </section>
            )}


            {/* SECTION 3: Plan Catalog */}
            <section className="space-y-8" ref={plansRef}>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Planos Disponíveis
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const IconComponent = category.icon;
                  const isSelected = selectedCategory === category.id;
                  return (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all duration-300 border-2 ${isSelected
                        ? 'border-[#212121] bg-white shadow-lg scale-[1.02]'
                        : 'border-transparent hover:border-gray-200 hover:bg-white'
                        }`}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <CardHeader className="text-center pb-2">
                        <div className={`mx-auto mb-4 p-3 rounded-full shadow-sm transition-colors ${isSelected ? 'bg-[#212121] text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{category.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {category.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-center pb-4">
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#212121]' : 'text-gray-400'}`}>
                          {isSelected ? 'Selecionado' : 'Clique para ver'}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {plans.map((plan) => {
                  const isCurrentPlan = currentPlan?.id === plan.id && hasActiveSubscription;

                  return (
                    <Card key={plan.id} className={`flex flex-col relative overflow-hidden ${isCurrentPlan ? 'border-[#212121] border-2 shadow-md' :
                      plan.name === 'Vita Pro' ? 'border-gray-200 shadow-sm' : ''
                      }`}>
                      {isCurrentPlan && (
                        <div className="absolute top-0 right-0 bg-[#212121] text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                          ATUAL
                        </div>
                      )}

                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col gap-1">
                            <CardTitle className="text-xl">{plan.name}</CardTitle>
                            {plan.trialPeriodDays && plan.trialPeriodDays > 0 ? (
                              <Badge className="w-fit bg-green-600 text-white text-[10px] uppercase font-bold px-2 py-0.5">
                                1 Mês Grátis
                              </Badge>
                            ) : plan.promoPrice ? (
                              <Badge className="w-fit bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5">
                                Promoção
                              </Badge>
                            ) : null}
                          </div>
                          {plan.name === 'Vita Pro' && !isCurrentPlan && (
                            <Badge className="bg-[#212121] text-white">Popular</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-2 text-sm">{plan.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="flex-grow">
                        <div className="mb-6">
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold">
                                {plan.trialPeriodDays && plan.trialPeriodDays > 0 ? '1 Mês Grátis' :
                                  plan.promoPrice ? `R$${(plan.promoPrice / 100).toFixed(2)}` :
                                    plan.price === 0 ? 'Grátis' :
                                      plan.name === 'Hospitais' ? 'Sob consulta' :
                                        `R$${(plan.price / 100).toFixed(2)}`}
                              </span>
                              {(plan.price > 0 || plan.promoPrice) && plan.name !== 'Hospitais' && !(plan.trialPeriodDays && plan.trialPeriodDays > 0) && (
                                <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                              )}
                            </div>
                            {plan.trialPeriodDays && plan.trialPeriodDays > 0 && plan.price > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  Depois R$ {(plan.price / 100).toFixed(2)}/{plan.interval === 'month' ? 'mês' : 'ano'}
                                </span>
                              </div>
                            )}
                            {plan.promoPrice && !plan.trialPeriodDays && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground line-through">
                                  R$${(plan.price / 100).toFixed(2)}
                                </span>
                                <span className="text-xs font-semibold text-red-500">
                                  {plan.promoDescription || 'no primeiro mês'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <ul className="space-y-3">
                          {(Array.isArray(plan.features) ? plan.features : []).map((feature: string, index: number) => (
                            <li key={index} className="flex items-start text-sm">
                              <Check className="h-4 w-4 text-[#212121] mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>

                      <CardFooter>
                        {plan.name === 'Gratuito' ? (
                          <Button className="w-full text-xs" variant="outline" disabled>
                            {isCurrentPlan ? 'Seu plano atual' : 'Plano Básico'}
                          </Button>
                        ) : selectedCategory === 'hospital' ? (
                          <Button className="w-full bg-[#212121] hover:bg-[#424242] text-white text-xs">
                            Falar com Consultor
                          </Button>
                        ) : (
                          <Button
                            className={`w-full text-xs ${isCurrentPlan ? 'bg-gray-100 text-gray-500' : 'bg-[#212121] hover:bg-[#424242] text-white'}`}
                            disabled={!!(isCurrentPlan)}
                            onClick={() => handleStartPayment(plan.id)}
                          >
                            {isCurrentPlan ? 'Plano Ativo' : 'Assinar Agora'}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* SECTION 4: Payment History */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Pagamentos
              </h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 p-4 border-b bg-muted/50 text-xs font-medium">
                      <div>Data</div>
                      <div>Descrição</div>
                      <div>Valor</div>
                      <div>Status</div>
                    </div>
                    <div className="p-4 text-xs">
                      {hasActiveSubscription ? (
                        <div className="grid grid-cols-4 py-3">
                          <div>{subscription?.currentPeriodStart && format(new Date(subscription.currentPeriodStart), 'dd/MM/yyyy')}</div>
                          <div>Assinatura - {currentPlan?.name}</div>
                          <div>{currentPlan?.price === 0 ? 'Grátis' : `R$ ${(currentPlan?.price || 0) / 100},00`}</div>
                          <div>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Nenhum pagamento registrado</p>
                      )}
                    </div>
                  </div>
                  {hasActiveSubscription && (
                    <div className="mt-4 flex justify-end">
                      <Button variant="outline" size="sm" className="gap-2 text-xs">
                        <CreditCard className="h-4 w-4" />
                        Gerenciar meios de pagamento
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>

      {/* Stripe Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Finalizar Assinatura</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                    <Badge variant="outline" className="bg-white">
                      {selectedPlan.interval === 'month' ? 'Mensal' : 'Anual'}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {selectedPlan.promoPrice ? `R$ ${(selectedPlan.promoPrice / 100).toFixed(2)}` :
                      selectedPlan.price === 0 ? 'Grátis' :
                        selectedPlan.trialPeriodDays && selectedPlan.trialPeriodDays > 0 ? '1 Mês Grátis' :
                          `R$ ${(selectedPlan.price / 100).toFixed(2)}`}
                    {!selectedPlan.trialPeriodDays && <span className="text-sm font-normal text-muted-foreground">/mês</span>}
                  </div>
                  {selectedPlan.trialPeriodDays && selectedPlan.trialPeriodDays > 0 ? (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Cancele a qualquer momento antes do fim do período de teste.
                    </div>
                  ) : selectedPlan.promoPrice && (
                    <div className="text-xs text-red-500 font-medium mt-1">
                      Preço promocional válido para o 1º mês
                    </div>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedPlanId && (
            <StripePayment
              planId={selectedPlanId}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setIsPaymentDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionManagement;