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

type PlanCategory = 'individual' | 'clinic' | 'hospital' | null;

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("subscription");

  // States for Plans Logic
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>(null);
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

  // Filter plans based on selected category
  const getPlansForCategory = (category: PlanCategory) => {
    switch (category) {
      case 'individual':
        return allPlans.filter(plan =>
          plan.name === 'Gratuito' ||
          plan.name === 'Individual' ||
          plan.name === 'Familiar'
        );
      case 'clinic':
        return allPlans.filter(plan =>
          plan.name === 'Gratuito' ||
          plan.name.includes('Consultório') ||
          plan.name.includes('médico')
        );
      case 'hospital':
        return allPlans.filter(plan =>
          plan.name === 'Gratuito' ||
          plan.name.includes('Hospitalar') ||
          plan.name.includes('Plano')
        );
      default:
        return [];
    }
  };

  const plans = selectedCategory ? getPlansForCategory(selectedCategory) : [];
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
    setActiveTab("subscription");
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

  const categories = [
    {
      id: 'individual' as PlanCategory,
      title: 'Individual e Familiar',
      description: 'Planos para uso pessoal e familiar',
      icon: Users,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'clinic' as PlanCategory,
      title: 'Consultório Médico',
      description: 'Soluções para consultórios e clínicas',
      icon: Building,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      id: 'hospital' as PlanCategory,
      title: 'Hospitalar e Planos de Saúde',
      description: 'Soluções para hospitais e operadoras',
      icon: Hospital,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      <div className="flex flex-1 relative">
        <Sidebar />
        <main className="flex-1 bg-gray-50 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Minha Assinatura</h1>
            <p className="text-gray-500 mb-8">Gerencie seu plano, pagamentos e limites de uso.</p>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                <TabsTrigger value="subscription">Meu Plano</TabsTrigger>
                <TabsTrigger value="plans">Alterar Plano</TabsTrigger>
              </TabsList>

              <TabsContent value="subscription" className="space-y-6">
                {!hasActiveSubscription ? (
                  <Card className="border-dashed border-2">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Nenhuma assinatura ativa</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                          Você está usando a versão gratuita ou não possui uma assinatura ativa.
                          Assine um plano para desbloquear recursos premium.
                        </p>
                        <Button onClick={() => setActiveTab("plans")}>
                          Ver planos disponíveis
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Subscription Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle>Plano Atual</CardTitle>
                              <CardDescription>Detalhes da sua assinatura</CardDescription>
                            </div>
                            <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                              {subscription?.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div>
                            <h3 className="text-2xl font-bold text-primary mb-1">{currentPlan?.name}</h3>
                            <p className="text-muted-foreground">{currentPlan?.description}</p>
                          </div>

                          <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-muted-foreground">Valor</span>
                              <span className="font-medium">
                                {currentPlan?.price === 0 ? 'Grátis' : `R$ ${(currentPlan?.price || 0) / 100},00/${currentPlan?.interval === 'month' ? 'mês' : 'ano'}`}
                              </span>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                              <span className="text-muted-foreground">Renovação</span>
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
                        <CardFooter className="flex justify-between border-t pt-6">
                          <Button variant="outline" onClick={() => setActiveTab("plans")}>
                            Mudar de plano
                          </Button>

                          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
                                <span className="font-medium">Uploads (este mês)</span>
                              </div>
                            </div>

                            <div className="space-y-4 mt-4">
                              {limitsData?.profiles?.map((profile: any) => {
                                const profileId = profile.id.toString();
                                const uploadsUsed = (subscription?.uploadsCount as Record<string, number>)?.[profileId] || 0;
                                const uploadsTotal = currentPlan?.maxUploadsPerProfile || 0;
                                const percentage = uploadsTotal > 0 ? (uploadsUsed / uploadsTotal) * 100 : 0;

                                return (
                                  <div key={profile.id} className="space-y-1">
                                    <div className="flex justify-between items-center text-sm">
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
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Payment History Placeholder */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <History className="h-5 w-5 text-primary" />
                          <CardTitle>Histórico de Pagamentos</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border">
                          <div className="grid grid-cols-4 p-4 border-b bg-muted/50 text-sm font-medium">
                            <div>Data</div>
                            <div>Descrição</div>
                            <div>Valor</div>
                            <div>Status</div>
                          </div>
                          <div className="p-4 text-sm">
                            <div className="grid grid-cols-4 py-3 border-b last:border-0">
                              <div>{subscription?.currentPeriodStart && format(new Date(subscription.currentPeriodStart), 'dd/MM/yyyy')}</div>
                              <div>Assinatura - {currentPlan?.name}</div>
                              <div>{currentPlan?.price === 0 ? 'Grátis' : `R$ ${(currentPlan?.price || 0) / 100},00`}</div>
                              <div>
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            Gerenciar cartão de crédito
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="plans" className="space-y-8">
                {/* Banner Promocional */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl p-8 shadow-lg relative overflow-hidden">
                  <div className="relative z-10 text-center">
                    <h2 className="text-3xl font-bold mb-2">PROMOÇÃO DE LANÇAMENTO</h2>
                    <p className="text-xl font-medium mb-4 opacity-90">
                      Planos Individual e Familiar com <span className="text-yellow-300 font-bold">DESCONTO ESPECIAL</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                        Individual: R$19,00/mês
                      </span>
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                        Familiar: R$34,00/mês
                      </span>
                    </div>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
                </div>

                {/* Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    const isSelected = selectedCategory === category.id;
                    return (
                      <Card
                        key={category.id}
                        className={`cursor-pointer transition-all duration-300 border-2 ${isSelected
                            ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                            : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <CardHeader className="text-center">
                          <div className={`mx-auto mb-4 p-4 rounded-full shadow-sm transition-colors ${isSelected ? 'bg-primary text-white' : 'bg-white text-primary'
                            }`}>
                            <IconComponent className="h-8 w-8" />
                          </div>
                          <CardTitle className="text-xl">{category.title}</CardTitle>
                          <CardDescription className="text-base mt-2">
                            {category.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center pb-6">
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            className="w-full"
                          >
                            {isSelected ? 'Categoria Selecionada' : 'Ver Planos'}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Plans List */}
                {selectedCategory && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" ref={plansRef}>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Planos {categories.find(cat => cat.id === selectedCategory)?.title}
                      </h2>
                      <Button variant="ghost" onClick={() => setSelectedCategory(null)}>
                        Limpar filtro
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {plans.map((plan) => {
                        const isCurrentPlan = currentPlan?.id === plan.id && hasActiveSubscription;

                        return (
                          <Card key={plan.id} className={`flex flex-col relative overflow-hidden ${isCurrentPlan ? 'border-green-500 border-2 shadow-md' :
                              plan.name === 'Individual' ? 'border-primary shadow-md' : ''
                            }`}>
                            {isCurrentPlan && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                ATUAL
                              </div>
                            )}

                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{plan.name}</CardTitle>
                                {plan.name === 'Individual' && !isCurrentPlan && (
                                  <Badge className="bg-primary">Popular</Badge>
                                )}
                              </div>
                              <CardDescription className="mt-2">{plan.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-grow">
                              <div className="mb-6">
                                {(plan.name === 'Individual' || plan.name === 'Familiar') && plan.price > 0 ? (
                                  <div className="space-y-1">
                                    <div className="flex items-baseline gap-2">
                                      <span className="text-lg text-muted-foreground line-through">
                                        R${(plan.price / 100).toFixed(2)}
                                      </span>
                                      <span className="text-3xl font-bold text-green-600">
                                        R${plan.name === 'Individual' ? '19,00' : '34,00'}
                                      </span>
                                      <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                                    </div>
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                      Economize R${((plan.price / 100) - (plan.name === 'Individual' ? 19 : 34)).toFixed(2)}/mês
                                    </Badge>
                                  </div>
                                ) : (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold">
                                      {plan.price === 0 ? 'Grátis' : `R$${(plan.price / 100).toFixed(2)}`}
                                    </span>
                                    {plan.price > 0 && (
                                      <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <ul className="space-y-3">
                                {(Array.isArray(plan.features) ? plan.features : []).map((feature: string, index: number) => (
                                  <li key={index} className="flex items-start text-sm">
                                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-600">{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>

                            <CardFooter>
                              {plan.name === 'Gratuito' ? (
                                <Button className="w-full" variant="outline" disabled>
                                  {isCurrentPlan ? 'Seu plano atual' : 'Plano Básico'}
                                </Button>
                              ) : selectedCategory === 'clinic' || selectedCategory === 'hospital' ? (
                                <Button className="w-full" variant="outline">
                                  Falar com Consultor
                                </Button>
                              ) : (
                                <Button
                                  className={`w-full ${isCurrentPlan ? 'bg-green-600 hover:bg-green-700' : 'bg-[#1E3A5F] hover:bg-[#48C9B0]'}`}
                                  disabled={isCurrentPlan}
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
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
                    {(selectedPlan.name === 'Individual' || selectedPlan.name === 'Familiar')
                      ? `R$ ${selectedPlan.name === 'Individual' ? '19,00' : '34,00'}`
                      : selectedPlan.price === 0 ? 'Grátis' : `R$ ${(selectedPlan.price / 100).toFixed(2)}`
                    }
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