import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2, Calendar, Users, UploadCloud, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  maxProfiles: number;
  maxUploadsPerProfile: number;
  price: number;
  interval: string;
  features: string[];
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

const SubscriptionManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Buscar assinatura atual do usuário
  const { data: subscriptionData, isLoading, refetch } = useQuery<UserSubscription>({
    queryKey: ['/api/user-subscription'],
    enabled: !!user,
  });

  // Verificar limites da assinatura
  const { data: limitsData } = useQuery({
    queryKey: ['/api/subscription/limits'],
    enabled: !!user,
  });

  // Mutação para cancelar assinatura
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
        description: 'Sua assinatura foi cancelada com sucesso. Você ainda pode usar os recursos até o final do período atual.',
        variant: 'default',
      });
      setCancelDialogOpen(false);
      // Atualizar dados da assinatura
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

  // Verificar se o usuário está autenticado
  React.useEffect(() => {
    if (!user && !isLoading) {
      toast({
        title: 'Acesso restrito',
        description: 'Você precisa estar logado para gerenciar sua assinatura.',
        variant: 'destructive',
      });
      navigate('/auth');
    }
  }, [user, isLoading, navigate, toast]);

  const handleCancelSubscription = async () => {
    setIsProcessing(true);
    await cancelSubscriptionMutation.mutateAsync();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  // Se o usuário não tem assinatura ativa
  if (!subscriptionData?.subscription || subscriptionData.subscription.status !== 'active') {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Gerenciar Assinatura</h1>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Nenhuma assinatura ativa</h2>
              <p className="text-muted-foreground text-center mb-6">
                Você não possui uma assinatura ativa no momento. 
                Assine um plano para aproveitar todas as funcionalidades do Hemolog.
              </p>
              <Button onClick={() => navigate('/subscription-plans')}>
                Ver planos disponíveis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { subscription, plan } = subscriptionData;
  const limits = limitsData?.limits;

  // Formatar datas
  const startDate = new Date(subscription.currentPeriodStart);
  const endDate = new Date(subscription.currentPeriodEnd);
  const formattedStartDate = format(startDate, 'PPP', { locale: ptBR });
  const formattedEndDate = format(endDate, 'PPP', { locale: ptBR });

  // Calcular dias restantes
  const today = new Date();
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Calcular uso de perfis
  const profilesUsed = subscription.profilesCreated;
  const profilesTotal = plan?.maxProfiles || 0;
  const profilesPercentage = profilesTotal > 0 ? (profilesUsed / profilesTotal) * 100 : 0;

  // Verificar se a assinatura está prestes a acabar (menos de 5 dias)
  const isExpiringSoon = daysLeft <= 5 && daysLeft > 0;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6">Gerenciar Assinatura</h1>
      
      {isExpiringSoon && (
        <Alert className="mb-6 border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-800">Assinatura expirando em breve</AlertTitle>
          <AlertDescription className="text-amber-700">
            Sua assinatura expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}. A renovação será automática caso você não cancele.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Plano</CardTitle>
            <CardDescription>Informações sobre seu plano atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <span className="bg-primary/10 text-primary p-2 rounded-full mr-2">
                    <CheckCircle className="h-5 w-5" />
                  </span>
                  {plan?.name || 'Plano Atual'}
                </h3>
                <p className="text-muted-foreground mt-1">{plan?.description}</p>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Preço</span>
                  <span className="font-medium">
                    {plan?.price === 0 ? 'Grátis' : `R$ ${(plan?.price || 0) / 100},00/${plan?.interval === 'month' ? 'mês' : 'ano'}`}
                  </span>
                </div>
                
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Período</span>
                  <span className="font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    {formattedStartDate} até {formattedEndDate}
                  </span>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Características do plano:</h4>
                <ul className="space-y-1">
                  {plan?.features?.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  )) || 'Carregando recursos...'}
                </ul>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button variant="outline" onClick={() => navigate('/subscription-plans')}>
              Ver outros planos
            </Button>
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">Cancelar assinatura</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar assinatura</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja cancelar sua assinatura? Você ainda poderá usar todos os recursos
                    até o final do período atual ({formattedEndDate}).
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={isProcessing}>
                    Voltar
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelSubscription}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : 
                      'Confirmar cancelamento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Utilização</CardTitle>
            <CardDescription>Acompanhe o uso da sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-primary" />
                    <span>Perfis utilizados</span>
                  </div>
                  <span className="text-sm font-medium">
                    {profilesUsed} / {profilesTotal === -1 ? '∞' : profilesTotal}
                  </span>
                </div>
                
                {profilesTotal > 0 && (
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${Math.min(profilesPercentage, 100)}%` }}
                    ></div>
                  </div>
                )}
                
                {profilesTotal === -1 && (
                  <div className="text-sm text-muted-foreground">
                    Seu plano permite perfis ilimitados.
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-medium mb-3 flex items-center">
                  <UploadCloud className="h-5 w-5 mr-2 text-primary" />
                  Uploads por perfil
                </h3>
                
                {plan?.maxUploadsPerProfile === -1 ? (
                  <div className="text-sm">
                    Seu plano permite uploads ilimitados para cada perfil.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Lista de perfis com uso de uploads */}
                    {limitsData?.profiles?.map((profile: any) => {
                      const profileId = profile.id.toString();
                      const uploadsUsed = (subscription.uploadsCount as Record<string, number>)[profileId] || 0;
                      const uploadsTotal = plan?.maxUploadsPerProfile || 0;
                      const uploadsPercentage = uploadsTotal > 0 ? (uploadsUsed / uploadsTotal) * 100 : 0;
                      
                      return (
                        <div key={profile.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{profile.name}</span>
                            <span className="text-sm font-medium">
                              {uploadsUsed} / {uploadsTotal}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${Math.min(uploadsPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                    
                    {(!limitsData?.profiles || limitsData.profiles.length === 0) && (
                      <div className="text-sm text-muted-foreground">
                        Nenhum perfil encontrado. Crie perfis para gerenciar uploads.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6">
            <Button variant="default" onClick={() => navigate('/profile')}>
              Gerenciar perfis
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Histórico de pagamentos</CardTitle>
          <CardDescription>Veja o histórico completo de pagamentos da sua assinatura</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="grid grid-cols-4 p-4 border-b bg-muted/50">
              <div className="font-medium">Data</div>
              <div className="font-medium">Descrição</div>
              <div className="font-medium">Valor</div>
              <div className="font-medium">Status</div>
            </div>
            <div className="p-4">
              {/* Esta seria a seção ideal para listar o histórico de pagamentos */}
              {/* Por enquanto, exibimos apenas o pagamento inicial */}
              <div className="grid grid-cols-4 py-2">
                <div>{formattedStartDate}</div>
                <div>Assinatura - {plan?.name}</div>
                <div>{plan?.price === 0 ? 'Grátis' : `R$ ${(plan?.price || 0) / 100},00`}</div>
                <div className="flex items-center">
                  <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                  Pago
                </div>
              </div>
              
              {/* Mensagem para implementação futura do histórico completo */}
              <div className="text-sm text-muted-foreground mt-4">
                O histórico detalhado de pagamentos estará disponível em breve.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;