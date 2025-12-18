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
  History
} from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
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
  interval: string;
  features: string[] | string; // Can be array or string depending on API
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
      title: 'Profissional de Saúde',
      description: 'Planos a partir de R$ 99/mês',
      icon: Users,
      color: 'bg-gray-50 border-gray-200 hover:bg-white'
    },
    {
      id: 'clinic' as PlanCategory,
      title: 'Clínica Multiprofissional',
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
        return normalizedPlans.filter(plan =>
          plan.normalizedName === 'gratuito' ||
          plan.normalizedName === 'profissional de saúde'
        );
      case 'clinic':
        return normalizedPlans.filter(plan =>
          plan.normalizedName === 'gratuito' ||
          plan.normalizedName === 'clínica multiprofissional'
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
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                      <h2 className="text-xl font-semibold mb-2">Plano Básico (Gratuito)</h2>
                      <p className="text-muted-foreground mb-6 max-w-md">
                        Você possui o plano básico com limite de <strong>20 pacientes</strong>, <strong>10 uploads</strong> por perfil mensais e <strong>1 página por upload</strong>.
                      </p>
                      <div className="grid grid-cols-3 gap-4 w-full max-w-lg mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg border text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Pacientes</div>
                          <div className="text-xl font-bold">20</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Uploads / Perfil</div>
                          <div className="text-xl font-bold">10</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg border text-center">
                          <div className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Páginas / Upload</div>
                          <div className="text-xl font-bold">1</div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Assine um plano profissional para desbloquear recursos ilimitados de IA e gestão.
                      </p>
                    </div>
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
                      plan.name === 'Profissional de Saúde' ? 'border-gray-200 shadow-sm' : ''
                      }`}>
                      {isCurrentPlan && (
                        <div className="absolute top-0 right-0 bg-[#212121] text-white text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
                          ATUAL
                        </div>
                      )}

                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{plan.name}</CardTitle>
                          {plan.name === 'Profissional de Saúde' && !isCurrentPlan && (
                            <Badge className="bg-[#212121] text-white">Popular</Badge>
                          )}
                        </div>
                        <CardDescription className="mt-2 text-sm">{plan.description}</CardDescription>
                      </CardHeader>

                      <CardContent className="flex-grow">
                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold">
                              {plan.price === 0 ? 'Grátis' :
                                plan.name === 'Hospitais' ? 'Sob consulta' :
                                  `R$${(plan.price / 100).toFixed(2)}`}
                            </span>
                            {plan.price > 0 && plan.name !== 'Hospitais' && (
                              <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
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
                        ) : selectedCategory === 'clinic' || selectedCategory === 'hospital' ? (
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
                    {selectedPlan.price === 0 ? 'Grátis' : `R$ ${(selectedPlan.price / 100).toFixed(2)}`}
                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </div>
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