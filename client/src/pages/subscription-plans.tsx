import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

// Componentes do Stripe
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Carregando a chave pública do Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Interface para Plano de Assinatura
interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  maxProfiles: number;
  maxUploadsPerProfile: number;
  price: number;
  interval: string;
  stripePriceId: string | null;
  features: string[];
  isActive: boolean;
}

// Componente para o formulário de pagamento
const PaymentForm = ({ plan, onSuccess, onCancel }: { plan: SubscriptionPlan, onSuccess: () => void, onCancel: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createSubscriptionMutation = useMutation({
    mutationFn: async (planId: number) => {
      const res = await apiRequest('POST', '/api/create-subscription', { planId });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Erro ao criar assinatura');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Se for plano gratuito, apenas notificar sucesso
      if (data.type === 'free') {
        toast({
          title: 'Assinatura ativada',
          description: 'Seu plano gratuito foi ativado com sucesso!',
          variant: 'default',
        });
        onSuccess();
        return;
      }

      // Para planos pagos, configurar cliente do Stripe
      setIsProcessing(true);
      toast({
        title: 'Processando pagamento',
        description: 'Por favor, aguarde enquanto configuramos seu pagamento...',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao assinar',
        description: error.message,
        variant: 'destructive',
      });
      setErrorMessage(error.message);
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage('Carregando componentes de pagamento...');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Iniciar processo de assinatura
      const result = await createSubscriptionMutation.mutateAsync(plan.id);
      
      // Se for plano gratuito, já está finalizado
      if (result.type === 'free') return;
      
      // Para planos pagos, confirmar método de pagamento
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Elemento de cartão não encontrado');
      }
      
      const { error, setupIntent } = await stripe.confirmCardSetup(result.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Hemolog User',
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao processar pagamento');
      }
      
      // Atualizar informações do Stripe no usuário
      await apiRequest('POST', '/api/update-stripe-info', {
        stripeCustomerId: result.customerId,
        stripeSubscriptionId: setupIntent?.payment_method || null
      });
      
      toast({
        title: 'Assinatura realizada',
        description: 'Seu plano foi ativado com sucesso!',
        variant: 'default',
      });
      
      // Invalidar cache para atualizar informações de assinatura
      queryClient.invalidateQueries({ queryKey: ['/api/user-subscription'] });
      
      onSuccess();
    } catch (err: any) {
      console.error('Erro no pagamento:', err);
      setErrorMessage(err.message || 'Ocorreu um erro ao processar o pagamento');
      toast({
        title: 'Erro no pagamento',
        description: err.message || 'Ocorreu um erro ao processar o pagamento',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Renderização para plano gratuito (sem necessidade de cartão)
  if (plan.price === 0) {
    return (
      <form onSubmit={handleSubmit}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar plano gratuito</DialogTitle>
            <DialogDescription>
              Você está ativando o plano gratuito. Lembre-se que este plano possui limitações.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <h3 className="font-medium">Detalhes do plano:</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="text-sm">{feature}</li>
              ))}
            </ul>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    );
  }

  // Renderização para planos pagos (com cartão de crédito)
  return (
    <form onSubmit={handleSubmit}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assinar {plan.name}</DialogTitle>
          <DialogDescription>
            Insira os dados do seu cartão para completar a assinatura.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="font-medium mb-4">Detalhes do plano:</h3>
          <div className="mb-4">
            <p className="mb-1"><strong>Preço:</strong> R$ {(plan.price / 100).toFixed(2)}/{plan.interval === 'month' ? 'mês' : 'ano'}</p>
            <div className="text-sm">
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {plan.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-md p-3">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
            
            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {errorMessage}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isProcessing || !stripe}>
            {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</> : 'Assinar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  );
};

// Componente principal da página
const SubscriptionPlans = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Buscar planos de assinatura disponíveis
  const { data: allPlans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscription-plans'],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Filtrar planos duplicados mantendo apenas um de cada nome
  const plans = React.useMemo(() => {
    if (!allPlans) return [];
    
    const uniquePlans = new Map<string, SubscriptionPlan>();
    
    allPlans.forEach(plan => {
      if (!uniquePlans.has(plan.name) || uniquePlans.get(plan.name)!.id < plan.id) {
        uniquePlans.set(plan.name, plan);
      }
    });
    
    return Array.from(uniquePlans.values());
  }, [allPlans]);

  // Buscar assinatura atual do usuário
  const { data: userSubscription } = useQuery({
    queryKey: ['/api/user-subscription'],
    enabled: !!user,
  });

  // Manipuladores de eventos
  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPaymentDialogOpen(false);
    // Redirecionar para a página de dashboard após assinatura bem-sucedida
    navigate('/');
  };

  const handleCancel = () => {
    setPaymentDialogOpen(false);
    setSelectedPlan(null);
  };

  // Verificar se o usuário já tem uma assinatura ativa
  const hasActiveSubscription = userSubscription?.subscription?.status === 'active';

  // Se o usuário não estiver autenticado, redirecionar para login
  React.useEffect(() => {
    if (!user && !isLoading) {
      toast({
        title: 'Acesso restrito',
        description: 'Você precisa estar logado para visualizar os planos de assinatura.',
        variant: 'destructive',
      });
      navigate('/auth');
    }
  }, [user, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Planos de Assinatura</h1>
        <Card>
          <CardContent className="pt-6">
            <p>Nenhum plano de assinatura disponível no momento.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Planos de Assinatura</h1>
      </div>
      
      {hasActiveSubscription && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <p>
            Você já possui uma assinatura ativa: <strong>{userSubscription?.plan?.name}</strong>.
            Para trocar de plano, primeiro cancele sua assinatura atual.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={`flex flex-col ${plan.name === 'Individual' ? 'border-primary' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{plan.name}</CardTitle>
                {plan.name === 'Individual' && (
                  <Badge variant="outline" className="bg-primary text-primary-foreground">Popular</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="mb-4">
                <span className="text-3xl font-bold">
                  {plan.price === 0 ? 'Grátis' : 
                   plan.name.includes('Consultório') || plan.name.includes('Hospitalar') || plan.name.includes('médico') ? 'Sob consulta' :
                   `R$${(plan.price / 100).toFixed(2)}`}
                </span>
                {plan.price > 0 && !plan.name.includes('Consultório') && !plan.name.includes('Hospitalar') && !plan.name.includes('médico') && (
                  <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                )}
              </div>
              
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleSelectPlan(plan)} 
                className="w-full"
                disabled={hasActiveSubscription}
                variant={plan.name === 'Individual' ? 'default' : 'outline'}
              >
                {plan.price === 0 ? 'Começar Grátis' : 'Assinar'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {paymentDialogOpen && selectedPlan && (
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <Elements stripe={stripePromise}>
            <PaymentForm 
              plan={selectedPlan} 
              onSuccess={handlePaymentSuccess} 
              onCancel={handleCancel} 
            />
          </Elements>
        </Dialog>
      )}
    </div>
  );
};

export default SubscriptionPlans;