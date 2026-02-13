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
  Crown,
  ArrowRight,
  Sparkles
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
type BillingPeriod = 'month' | '6month' | 'year';

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // States for Plans Logic
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>('clinic');
  // billingPeriod removed
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<'month' | '6month' | 'year'>('year');
  const [selectedIntervals, setSelectedIntervals] = useState<Record<string, string>>({});
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
      id: 'clinic' as PlanCategory,
      title: 'Vita Team',
      description: 'Planos a partir de R$ 149/mês',
      icon: Building,
      color: 'bg-gray-50 border-gray-200 hover:bg-white'
    },
    {
      id: 'solo' as PlanCategory,
      title: 'Vita Business',
      description: 'Gestão completa para clínicas',
      icon: Users,
      color: 'bg-gray-50 border-gray-200 hover:bg-white'
    },
    {
      id: 'hospital' as PlanCategory,
      title: 'Vita Enterprise',
      description: 'Soluções para hospitais',
      icon: Hospital,
      color: 'bg-gray-50 border-gray-200 hover:bg-white'
    }
  ];

  // Group plans based on selected category
  const getPlanGroups = (category: PlanCategory) => {
    if (!category) return [];

    const normalizedPlans = allPlans.map(p => ({
      ...p,
      normalizedName: (p.name || "").toLowerCase().trim(),
      baseName: (p.name || "").toLowerCase().replace(' semestral', '').replace(' anual', '').replace(' mensal', '').trim()
    }));

    // Get base plan names for each category
    let basePlanNames: string[] = [];
    switch (category) {
      case 'clinic':
        basePlanNames = ['vita team'];
        break;
      case 'solo':
        basePlanNames = ['vita business'];
        break;
      case 'hospital':
        basePlanNames = ['hospitais'];
        break;
      default:
        return [];
    }

    // Filter and group
    const categoryPlans = normalizedPlans.filter(plan => basePlanNames.includes(plan.baseName));

    const groups: Record<string, typeof categoryPlans> = {};
    categoryPlans.forEach(plan => {
      if (!groups[plan.baseName]) groups[plan.baseName] = [];
      groups[plan.baseName].push(plan);
    });

    return Object.values(groups).sort((a, b) => {
      const order = basePlanNames;
      const nameA = a[0].baseName;
      const nameB = b[0].baseName;
      return order.indexOf(nameA) - order.indexOf(nameB);
    });
  };

  const planGroups = getPlanGroups(selectedCategory);

  // Find selected plan details (for payment dialog)
  const selectedPlan = allPlans.find(plan => plan.id === selectedPlanId);

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

  const handleStartPayment = async (planId: number) => {
    // Verificar se é plano gratuito
    const plan = allPlans.find(p => p.id === planId);
    if (plan && plan.price === 0) {
      // Ativar plano gratuito diretamente, sem Stripe
      setIsProcessing(true);
      try {
        const res = await apiRequest('POST', '/api/activate-subscription', { planId });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Erro ao ativar plano');
        }
        toast({
          title: 'Plano ativado!',
          description: 'Seu plano gratuito foi ativado com sucesso.',
        });
        refetch();
        queryClient.invalidateQueries({ queryKey: ['/api/subscription/limits'] });
      } catch (error: any) {
        toast({
          title: 'Erro',
          description: error.message || 'Erro ao ativar plano gratuito.',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    setSelectedPlanId(planId);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setIsPaymentDialogOpen(false);
    setSelectedPlanId(null);
    toast({
      title: 'Assinatura realizada!',
      description: 'Seu plano foi atualizado com sucesso.',
    });
    refetch();
    queryClient.invalidateQueries({ queryKey: ['/api/subscription/limits'] });
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



            {/* SECTION 1: Plans for Independent Professionals */}
            <section className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Meu Plano Atual
              </h2>

              {!hasActiveSubscription ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Free Plan Card - Updated with complete features list */}
                  <Card className="border-dashed border-2 md:col-span-1 relative">
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold">Plano Atual</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle>Plano Gratuito</CardTitle>
                      <CardDescription>Para organizar sua rotina</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2 text-sm">
                        {(Array.isArray(currentPlan?.features) ? currentPlan.features as string[] : []).map((feature: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className={`h-4 w-4 mr-2 mt-0.5 ${feature.includes('(') ? 'text-gray-400' : 'text-green-500'}`} />
                            <span className={feature.includes('(') ? 'text-muted-foreground' : ''} dangerouslySetInnerHTML={{ __html: feature }} />
                          </li>
                        ))}
                        {(!currentPlan?.features || currentPlan.features.length === 0) && (
                          <>
                            <li className="flex items-start"><CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-gray-400" /> <span className="text-muted-foreground">Anamnese Básica sem IA</span></li>
                            <li className="flex items-start"><CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-gray-400" /> <span className="text-muted-foreground">Prescrição Digital Limitada (10/mês)</span></li>
                            <li className="flex items-start"><CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-gray-400" /> <span className="text-muted-foreground">Protocolos Clínicos Padrão</span></li>
                            <li className="flex items-start"><CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-gray-400" /> <span className="text-muted-foreground">Agenda Básica</span></li>
                            <li className="flex items-start"><CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-gray-400" /> <span className="text-muted-foreground">Gerenciamento de Pacientes Limitado (20)</span></li>
                            <li className="flex items-start"><CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-gray-400" /> <span className="text-muted-foreground">Upload de Exames Limitado (10/mês)</span></li>
                            <li className="flex items-start"><CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-gray-400" /> <span className="text-muted-foreground">Relatórios Básicos</span></li>
                          </>
                        )}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <div className="w-full text-center text-xs text-muted-foreground">
                        Plano atual
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Vita Pro Card - NEW 2-COLUMN LAYOUT */}
                  <Card className="md:col-span-2 border-primary/20 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      RECOMENDADO
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                      {/* LEFT COLUMN: Features */}
                      <div className="p-6 bg-gray-50/50 border-r border-gray-100 flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">Vita Pro</h3>
                          <p className="text-sm text-gray-500 mb-6">Ideal para profissionais independentes</p>

                          <div className="space-y-3">
                            <ul className="space-y-2">
                              {[
                                "Anamnese com <strong>IA</strong> e Gravação de Voz",
                                "Prescrição <strong>Ilimitada</strong> com Alerta de Interações",
                                "Protocolos de Exames <strong>Personalizáveis</strong>",
                                "Análise de Exames com <strong>IA</strong>",
                                "Gráficos de <strong>Evolução</strong> de Exames",
                                "Upload de Exames <strong>Ilimitados</strong>",
                                "<strong>Vita Assist</strong> – Assistente Inteligente",
                                "Relatórios <strong>Completos</strong>"
                              ].map((item, i) => (
                                <li key={i} className="flex items-start text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span dangerouslySetInnerHTML={{ __html: item }} />
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-6 md:mt-0 pt-4 md:pt-0">
                          <p className="text-xs text-muted-foreground">
                            * Recursos de IA sujeitos a política de uso justo.
                          </p>
                        </div>
                      </div>

                      {/* RIGHT COLUMN: Pricing & Action */}
                      <div className="p-6 flex flex-col justify-center items-center text-center bg-white">
                        <h3 className="text-2xl font-bold text-green-600 mb-1">1º Mês Grátis</h3>
                        <p className="text-sm text-gray-500 mb-6">Depois R$ 63,20/mês <br />(no plano anual)</p>

                        <div className="w-full max-w-xs space-y-3 mb-6">

                          <div className="bg-gray-50 p-1 rounded-lg border">
                            {['Anual', 'Semestral', 'Mensal'].map((period) => {
                              const isSelected = selectedInterval === (period === 'Anual' ? 'year' : period === 'Semestral' ? '6month' : 'month');
                              const discount = period === 'Anual' ? '-20%' : period === 'Semestral' ? '-10%' : '';
                              const price = period === 'Anual' ? 'R$ 63,20' : period === 'Semestral' ? 'R$ 71,10' : 'R$ 79,00';

                              // Find actual plans from data
                              const targetPlan = (subscriptionPlans || []).find((p: any) => p.name.includes("Vita Pro") && p.interval === (period === 'Anual' ? 'year' : period === 'Semestral' ? '6month' : 'month'));

                              return (
                                <div
                                  key={period}
                                  onClick={() => {
                                    if (targetPlan) setSelectedPlanId(targetPlan.id);
                                    setSelectedInterval(period === 'Anual' ? 'year' : period === 'Semestral' ? '6month' : 'month');
                                  }}
                                  className={`
                                                     flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all text-sm mb-1 last:mb-0
                                                     ${isSelected ? 'bg-white shadow-sm border border-green-200 ring-1 ring-green-100' : 'hover:bg-gray-100'}
                                                 `}
                                >
                                  <div className="flex items-center">
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-2 ${isSelected ? 'border-green-500' : 'border-gray-300'}`}>
                                      {isSelected && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                    </div>
                                    <span className={isSelected ? 'font-medium text-gray-900' : 'text-gray-600'}>{period}</span>
                                  </div>
                                  <div className="flex items-center">
                                    {discount && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded mr-2">{discount} OFF</span>}
                                    <span className={`font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>{price}/mês</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Button
                          size="lg"
                          className="w-full max-w-xs bg-gray-900 hover:bg-black text-white"
                          onClick={() => {
                            // Find the selected plan ID based on interval
                            const plan = (subscriptionPlans || []).find((p: any) => p.name.includes("Vita Pro") && p.interval === selectedInterval);
                            if (plan) handleStartPayment(plan.id);
                          }}
                        >
                          Escolher este Plano
                        </Button>
                        <p className="text-[10px] text-gray-400 mt-4">
                          Cobrado {selectedInterval === 'year' ? 'anualmente' : selectedInterval === '6month' ? 'semestralmente' : 'mensalmente'}. Cancele a qualquer momento.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* ... existing active plan view ... */}
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
                          <span className="font-medium text-lg">
                            {currentPlan?.price === 0
                              ? 'Grátis'
                              : currentPlan?.interval === '6month'
                                ? `6x de R$ ${((currentPlan?.price ? currentPlan.price / 100 : 0) / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês`
                                : currentPlan?.interval === 'year'
                                  ? `12x de R$ ${((currentPlan?.price ? currentPlan.price / 100 : 0) / 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês`
                                  : `R$ ${(currentPlan?.price ? currentPlan.price / 100 : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mês`
                            }
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
                              <span dangerouslySetInnerHTML={{ __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end border-t pt-4">
                      {/* ... dialog ... */}
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

                  {/* Smart Upsell Card */}
                  <Card className="bg-gradient-to-br from-gray-50 to-white border-dashed border-2">
                    <CardContent className="pt-6 h-full flex flex-col justify-center">
                      {(() => {
                        // Determine upsell suggestion
                        const planName = currentPlan?.name || '';
                        const baseName = planName.replace(/ mensal| semestral| anual/i, '').trim().toLowerCase();
                        const currentInterval = currentPlan?.interval || 'month';
                        const currentPrice = currentPlan?.price || 0;

                        // Find plans of same tier with different intervals
                        const sameTierPlans = subscriptionPlans.filter(p =>
                          p.name.replace(/ mensal| semestral| anual/i, '').trim().toLowerCase() === baseName && p.isActive
                        );
                        const semiannualPlan = sameTierPlans.find(p => p.interval === '6month');
                        const annualPlan = sameTierPlans.find(p => p.interval === 'year');

                        // Determine next tier upgrade
                        const tierOrder = ['gratuito', 'vita pro', 'vita team', 'vita business', 'hospitais'];
                        const currentTierIndex = tierOrder.indexOf(baseName);
                        const nextTierName = currentTierIndex >= 0 && currentTierIndex < tierOrder.length - 1
                          ? tierOrder[currentTierIndex + 1]
                          : null;
                        const nextTierMonthly = nextTierName
                          ? subscriptionPlans.find(p =>
                            p.name.replace(/ mensal| semestral| anual/i, '').trim().toLowerCase() === nextTierName
                            && p.interval === 'month' && p.isActive
                          )
                          : null;

                        // Case 1: Monthly plan → suggest semiannual or annual
                        if (currentInterval === 'month' && currentPrice > 0 && (semiannualPlan || annualPlan)) {
                          const monthlyTotal12 = currentPrice * 12;
                          const savingsAnnual = annualPlan ? Math.round(((monthlyTotal12 - annualPlan.price) / monthlyTotal12) * 100) : 0;
                          const annualMonthlyEquivalent = annualPlan ? annualPlan.price / 12 : 0;

                          const monthlyTotal6 = currentPrice * 6;
                          const savingsSemi = semiannualPlan ? Math.round(((monthlyTotal6 - semiannualPlan.price) / monthlyTotal6) * 100) : 0;

                          return (
                            <div className="space-y-5">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                  <CreditCard className="h-6 w-6 text-green-700" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900 leading-tight">Economize no seu plano!</h3>
                                  <p className="text-sm text-green-700 font-medium">Melhore suas condições agora.</p>
                                </div>
                              </div>

                              <p className="text-sm text-gray-600">
                                Você está pagando <strong>R${(currentPrice / 100).toFixed(2)}/mês</strong>.
                              </p>

                              <div className="space-y-3">
                                {/* Option 1: Annual (Best Value) */}
                                {annualPlan && (
                                  <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">
                                      RECOMENDADO
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      Economize <span className="font-bold text-green-700">{savingsAnnual}%</span> mudando para o anual:
                                    </p>
                                    <Button
                                      size="lg"
                                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold h-auto py-3 shadow-md transition-all hover:scale-[1.01]"
                                      onClick={() => handleStartPayment(annualPlan.id)}
                                    >
                                      <div className="flex flex-col items-center w-full">
                                        <div className="flex items-center justify-center gap-2 w-full">
                                          <span>Mudar para Anual</span>
                                        </div>
                                        <span className="text-[10px] font-normal opacity-90 mt-1">
                                          R$ {(annualMonthlyEquivalent / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                                        </span>
                                      </div>
                                    </Button>
                                  </div>
                                )}

                                {/* Option 2: Semiannual */}
                                {semiannualPlan && (
                                  <Button
                                    variant="outline"
                                    className="w-full justify-between h-auto py-3 border-gray-200 hover:bg-gray-50"
                                    onClick={() => handleStartPayment(semiannualPlan.id)}
                                  >
                                    <div className="text-left">
                                      <div className="font-medium text-gray-700">Plano Semestral</div>
                                      <div className="text-xs text-muted-foreground">6x de R$ {(semiannualPlan.price / 100 / 6).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>
                                    </div>
                                    <Badge variant="secondary" className="bg-green-100 text-green-800 border-none">-{savingsSemi}%</Badge>
                                  </Button>
                                )}

                                {/* Option 3: Upgrade to Business (Only for Vita Team) */}
                                {(baseName === 'vita team' || baseName === 'vita pro') && nextTierMonthly && (
                                  <div className="mt-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg">
                                    <p className="text-sm text-white font-semibold mb-1 flex items-center gap-1.5">
                                      <Sparkles className="h-4 w-4 text-yellow-400" />
                                      Leve sua clínica ao próximo nível
                                    </p>
                                    <p className="text-xs text-gray-400 mb-3">{baseName === 'vita pro' ? 'Gerencie sua equipe, relatórios consolidados e conta administradora.' : 'Profissionais ilimitados, gestão financeira e suporte premium.'}</p>
                                    <Button
                                      size="lg"
                                      className="w-full justify-between h-auto py-3 bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-md transition-all hover:scale-[1.01]"
                                      onClick={() => handleStartPayment(nextTierMonthly.id)}
                                    >
                                      <div className="text-left">
                                        <div className="font-bold text-sm">Upgrade para {nextTierMonthly.name.replace(/ mensal| semestral| anual/i, '').trim()}</div>
                                        <div className="text-xs text-gray-500 font-normal">A partir de R$ {(nextTierMonthly.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>
                                      </div>
                                      <div className="p-1.5 bg-gray-900 rounded-full">
                                        <ArrowRight className="h-4 w-4 text-white" />
                                      </div>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        // Case 2: Semiannual plan → suggest annual
                        if (currentInterval === '6month' && annualPlan) {
                          const semiTotal = currentPrice * 2; // 2 semesters = 1 year
                          const savingsAnnual = Math.round(((semiTotal - annualPlan.price) / semiTotal) * 100);
                          const savingsValue = (semiTotal - annualPlan.price) / 100;
                          const annualMonthlyEquivalent = annualPlan.price / 12;

                          // Calculate the "difference" to complete the annual plan
                          const upgradeDifference = Math.max(0, annualPlan.price - currentPrice);

                          return (
                            <div className="space-y-5">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-full">
                                  <Crown className="h-6 w-6 text-green-700" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900 leading-tight">Fidelize e Economize</h3>
                                  <p className="text-sm text-green-700 font-medium">Garanta {savingsAnnual}% de desconto no anual.</p>
                                </div>
                              </div>

                              <div className="bg-white rounded-lg p-4 border border-green-100 shadow-sm space-y-3">
                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <span className="text-sm text-gray-500">Sua economia anual:</span>
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none text-sm font-bold px-2">
                                    R$ {savingsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </Badge>
                                </div>

                                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                                  <span className="text-sm text-gray-500">Valor para completar o ano:</span>
                                  <span className="font-bold text-green-700 text-lg">
                                    R$ {(upgradeDifference / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>

                                <Button
                                  size="lg"
                                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold text-base py-6 shadow-md transition-all hover:scale-[1.02]"
                                  onClick={() => handleStartPayment(annualPlan.id)}
                                >
                                  <div className="flex flex-col items-center w-full">
                                    <div className="flex items-center justify-center gap-2 w-full">
                                      <span>Upgrade para Anual</span>
                                      <span className="flex items-center justify-center bg-green-800 text-white text-[10px] px-2 h-5 rounded-full font-bold">-{savingsAnnual}%</span>
                                    </div>
                                    <span className="text-xs font-normal opacity-90 mt-1">
                                      Equivalente a <strong>R$ {(annualMonthlyEquivalent / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</strong>
                                    </span>
                                  </div>
                                </Button>
                                <p className="text-[10px] text-center text-gray-400">
                                  Ao assinar, você migra para o ciclo anual pagando a diferença
                                </p>
                              </div>

                              {/* Option 3: Upgrade to Business (Only for Vita Team) */}
                              {(baseName === 'vita team' || baseName === 'vita pro') && nextTierMonthly && (
                                <div className="mt-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg">
                                  <p className="text-sm text-white font-semibold mb-1 flex items-center gap-1.5">
                                    <Sparkles className="h-4 w-4 text-yellow-400" />
                                    Leve sua clínica ao próximo nível
                                  </p>
                                  <p className="text-xs text-gray-400 mb-3">{baseName === 'vita pro' ? 'Gerencie sua equipe, relatórios consolidados e conta administradora.' : 'Profissionais ilimitados, gestão financeira e suporte premium.'}</p>
                                  <Button
                                    size="lg"
                                    className="w-full justify-between h-auto py-3 bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-md transition-all hover:scale-[1.01]"
                                    onClick={() => handleStartPayment(nextTierMonthly.id)}
                                  >
                                    <div className="text-left">
                                      <div className="font-bold text-sm">Upgrade para {nextTierMonthly.name.replace(/ mensal| semestral| anual/i, '').trim()}</div>
                                      <div className="text-xs text-gray-500 font-normal">A partir de R$ {(nextTierMonthly.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>
                                    </div>
                                    <div className="p-1.5 bg-gray-900 rounded-full">
                                      <ArrowRight className="h-4 w-4 text-white" />
                                    </div>
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        // Case 3: Annual plan or no interval savings → suggest next tier
                        if (nextTierMonthly) {
                          return (
                            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-4 shadow-lg">
                              <p className="text-sm text-white font-semibold mb-1 flex items-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-yellow-400" />
                                Leve sua clínica ao próximo nível
                              </p>
                              <p className="text-xs text-gray-400 mb-3">{baseName === 'vita pro' ? 'Gerencie sua equipe, relatórios consolidados e conta administradora.' : 'Profissionais ilimitados, gestão financeira e suporte premium.'}</p>
                              <Button
                                size="lg"
                                className="w-full justify-between h-auto py-3 bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-md transition-all hover:scale-[1.01]"
                                onClick={() => handleStartPayment(nextTierMonthly.id)}
                              >
                                <div className="text-left">
                                  <div className="font-bold text-sm">Upgrade para {nextTierMonthly.name.replace(/ mensal| semestral| anual/i, '').trim()}</div>
                                  <div className="text-xs text-gray-500 font-normal">A partir de R$ {(nextTierMonthly.price / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês</div>
                                </div>
                                <div className="p-1.5 bg-gray-900 rounded-full">
                                  <ArrowRight className="h-4 w-4 text-white" />
                                </div>
                              </Button>
                            </div>
                          );
                        }

                        // Case 4: Already on the highest plan
                        return (
                          <div className="space-y-5 text-center py-4">
                            <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-2">
                              <Crown className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg text-gray-900">Plano Completo</h3>
                              <p className="text-sm text-gray-500 mt-2">
                                Você já tem acesso a todos os recursos exclusivos da plataforma. Aproveite!
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              )}
            </section >

            {/* SECTION 2: Clinic Management → redirects to /minha-clinica */}
            {
              hasActiveSubscription && (currentPlan?.name?.toLowerCase().includes('team') || currentPlan?.name?.toLowerCase().includes('business')) && (
                <section className="space-y-4">
                  <Card className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#212121] rounded-xl flex items-center justify-center">
                            <Building className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Minha Clínica</h3>
                            <p className="text-sm text-gray-500">Gerencie equipe, agenda e configurações</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => navigate('/minha-clinica')}
                          variant="outline"
                          className="gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Acessar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              )
            }


            {/* SECTION 3: Plans for Clinics */}
            <section className="space-y-8" ref={plansRef}>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Clínicas Multiprofissionais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Vita Team */}
                <Card className="flex flex-col border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle className="text-xl">Vita Team</CardTitle>
                    <CardDescription className="mt-2 text-sm">Para pequenas clínicas e equipes</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <div>
                      {(() => {
                        const annualPlan = (subscriptionPlans || []).find((p: any) => p.name.toLowerCase().includes('vita team') && p.interval === 'year' && p.isActive);
                        const lowestMonthly = annualPlan ? (annualPlan.price / 100 / 12) : 149;
                        return (
                          <>
                            <span className="text-xs text-muted-foreground">A partir de </span>
                            <span className="text-3xl font-bold">R$ {lowestMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            <span className="text-sm text-muted-foreground">/mês</span>
                          </>
                        );
                      })()}
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Até <strong>5</strong> profissionais",
                        "Todas as features do <strong>Vita Pro</strong>",
                        "Gestão de equipe centralizada",
                        "Agenda compartilhada",
                        "Relatórios da clínica"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-xs" dangerouslySetInnerHTML={{ __html: feature }} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full text-xs font-bold h-10 bg-[#212121] hover:bg-[#424242] text-white"
                      onClick={() => {
                        const plan = (subscriptionPlans || []).find((p: any) => p.name.toLowerCase().includes('vita team') && p.interval === 'month');
                        if (plan) handleStartPayment(plan.id);
                      }}
                    >
                      Escolher Vita Team
                    </Button>
                  </CardFooter>
                </Card>

                {/* Vita Business */}
                <Card className="flex flex-col border-primary/20 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl">Vita Business</CardTitle>
                    <CardDescription className="mt-2 text-sm">Gestão completa para clínicas</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <div>
                      {(() => {
                        const annualPlan = (subscriptionPlans || []).find((p: any) => p.name.toLowerCase().includes('vita business') && p.interval === 'year' && p.isActive);
                        const lowestMonthly = annualPlan ? (annualPlan.price / 100 / 12) : 299;
                        return (
                          <>
                            <span className="text-xs text-muted-foreground">A partir de </span>
                            <span className="text-3xl font-bold">R$ {lowestMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                            <span className="text-sm text-muted-foreground">/mês</span>
                          </>
                        );
                      })()}
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Até <strong>15</strong> profissionais",
                        "Tudo do <strong>Vita Team</strong>",
                        "Análise de dados populacional",
                        "Integração HL7/FHIR",
                        "Suporte prioritário"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-xs" dangerouslySetInnerHTML={{ __html: feature }} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full text-xs font-bold h-10 bg-[#212121] hover:bg-[#424242] text-white"
                      onClick={() => {
                        const plan = (subscriptionPlans || []).find((p: any) => p.name.toLowerCase().includes('vita business') && p.interval === 'month');
                        if (plan) handleStartPayment(plan.id);
                      }}
                    >
                      Escolher Vita Business
                    </Button>
                  </CardFooter>
                </Card>

                {/* Vita Enterprise */}
                <Card className="flex flex-col border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <CardHeader>
                    <CardTitle className="text-xl">Vita Enterprise</CardTitle>
                    <CardDescription className="mt-2 text-sm">Soluções para hospitais e redes</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    <div>
                      <span className="text-3xl font-bold">Sob Consulta</span>
                    </div>
                    <ul className="space-y-2">
                      {[
                        "Profissionais <strong>ilimitados</strong>",
                        "Tudo do <strong>Vita Business</strong>",
                        "Gestor de conta dedicado",
                        "SLA de suporte 24/7",
                        "Customizações sob demanda"
                      ].map((feature, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 text-xs" dangerouslySetInnerHTML={{ __html: feature }} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full text-xs font-bold h-10 bg-[#212121] hover:bg-[#424242] text-white">
                      Falar com Consultor
                    </Button>
                  </CardFooter>
                </Card>
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
          </div >
        </main >
      </div >

      {/* Stripe Payment Dialog */}
      < Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen} >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Finalizar Assinatura</DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{selectedPlan.name}</span>
                    <Badge variant="outline" className="bg-white">
                      {selectedPlan.interval === 'month' ? 'Mensal' : selectedPlan.interval === '6month' ? 'Semestral' : 'Anual'}
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
      </Dialog >
    </div >
  );
};

export default SubscriptionManagement;