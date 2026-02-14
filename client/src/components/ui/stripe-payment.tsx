import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import ExternalScriptLoader from '../../utils/load-external-scripts';
import { Elements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripeEnabled = Boolean(stripePublicKey && stripePublicKey.startsWith('pk_'));

if (!stripePublicKey) {
  console.warn('VITE_STRIPE_PUBLIC_KEY não está definida nas variáveis de ambiente. Pagamentos serão desativados.');
} else if (!stripePublicKey.startsWith('pk_')) {
  console.warn('Chave pública do Stripe tem formato inválido. Deve começar com pk_. Pagamentos serão desativados.');
}

// Enhanced Stripe loading with CSP support
let stripePromise: Promise<any> | null = null;

const initializeStripe = async () => {
  if (!stripeEnabled) return null;
  if (stripePromise) return stripePromise;

  try {
    // First, ensure Stripe.js is loaded via our CSP-compliant loader
    await ExternalScriptLoader.loadStripeJS();

    // Then initialize with loadStripe
    stripePromise = loadStripe(stripePublicKey);

    return await stripePromise;
  } catch (error) {
    console.error('Erro ao carregar Stripe.js:', error);

    // Try fallback initialization
    try {
      stripePromise = loadStripe(stripePublicKey);
      return await stripePromise;
    } catch (fallbackError) {
      throw error;
    }
  }
};

// Initialize Stripe
if (stripeEnabled) {
  try {
    stripePromise = initializeStripe();
  } catch (error) {
    console.error('Falha crítica na inicialização do Stripe:', error);
    stripePromise = Promise.reject(error);
  }
}

interface CheckoutFormProps {
  planId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CheckoutForm = ({ planId, onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  console.log('[CheckoutForm] Rendered - stripe:', !!stripe, 'elements:', !!elements);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/subscription',
        },
        redirect: 'if_required',
      });

      if (error) {
        toast({
          title: "Erro no pagamento",
          description: error.message || "Ocorreu um erro ao processar o pagamento.",
          variant: "destructive",
        });
        setIsLoading(false);
        onCancel?.();
        return;
      }

      // Payment succeeded — now activate the subscription in our database
      if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          const activateResponse = await apiRequest('POST', '/api/activate-subscription', {
            planId,
            paymentIntentId: paymentIntent.id,
          });

          if (!activateResponse.ok) {
            const errorData = await activateResponse.json();
            throw new Error(errorData.message || 'Erro ao ativar assinatura');
          }

          toast({
            title: "Assinatura ativada!",
            description: "Seu plano foi atualizado com sucesso.",
          });
          onSuccess?.();
        } catch (activateError) {
          toast({
            title: "Pagamento confirmado",
            description: "O pagamento foi processado, mas houve um erro ao ativar o plano. Entre em contato com o suporte.",
            variant: "destructive",
          });
          onCancel?.();
        }
      } else {
        toast({
          title: "Pagamento em processamento",
          description: "Seu pagamento está sendo processado. O plano será ativado em breve.",
        });
        onSuccess?.();
      }
    } catch (err) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o pagamento.",
        variant: "destructive",
      });
      onCancel?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-4 justify-end mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isLoading}
          className="bg-[#212121] hover:bg-[#424242] text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            'Confirmar Pagamento'
          )}
        </Button>
      </div>
    </form>
  );
};

interface StripePaymentProps {
  planId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const StripePayment = ({ planId, onSuccess, onCancel }: StripePaymentProps) => {
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('[StripePayment] Component mounted, planId:', planId);
    console.log('[StripePayment] Stripe enabled:', stripeEnabled);
    console.log('[StripePayment] Stripe public key:', stripePublicKey ? 'Present' : 'Missing');

    if (!stripeEnabled) {
      console.log('[StripePayment] Stripe disabled, stopping');
      setError('Stripe não está configurado. Por favor, configure a chave pública do Stripe.');
      setIsLoading(false);
      return;
    }

    const fetchPaymentIntent = async () => {
      try {
        console.log('[StripePayment] Fetching payment intent for planId:', planId);
        setError(null);
        setIsLoading(true);

        const response = await apiRequest('POST', '/api/create-payment-intent', { planId });
        console.log('[StripePayment] API response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('[StripePayment] API error:', errorData);
          throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('[StripePayment] Payment intent response:', data);

        if (data.clientSecret) {
          console.log('[StripePayment] ClientSecret received:', data.clientSecret.substring(0, 20) + '...');
          setClientSecret(data.clientSecret);
          setError(null);
        } else {
          throw new Error(data.message || 'Não foi possível obter o token de pagamento');
        }
      } catch (error) {
        console.error('[StripePayment] Error fetching payment intent:', error);
        const message = error instanceof Error ? error.message : "Ocorreu um erro ao preparar o pagamento.";
        setError(message);
        toast({
          title: 'Erro ao iniciar pagamento',
          description: message,
          variant: 'destructive'
        });
      } finally {
        console.log('[StripePayment] Loading complete');
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [planId, toast]);

  console.log('[StripePayment] Render - stripeEnabled:', stripeEnabled, 'isLoading:', isLoading, 'error:', error, 'hasClientSecret:', !!clientSecret);

  if (!stripeEnabled) {
    console.log('[StripePayment] Rendering: Stripe disabled message');
    return (
      <div className="text-center py-6 space-y-4">
        <div className="text-red-500 font-medium text-lg">
          ⚠️ Pagamentos Temporariamente Indisponíveis
        </div>
        <p className="text-sm text-muted-foreground">
          A configuração do Stripe está ausente. Entre em contato com o suporte.
        </p>
        <Button onClick={onCancel} className="mt-4" variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  if (isLoading) {
    console.log('[StripePayment] Rendering: Loading spinner');
    return (
      <div className="flex flex-col justify-center items-center min-h-[200px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparando pagamento...</p>
      </div>
    );
  }

  if (error || !clientSecret) {
    console.log('[StripePayment] Rendering: Error state', { error, hasClientSecret: !!clientSecret });
    return (
      <div className="text-center py-6 space-y-4">
        <div className="text-red-500 font-medium">
          {error || 'Não foi possível iniciar o pagamento. Tente novamente mais tarde.'}
        </div>
        <div className="space-y-2">
          <Button onClick={onCancel} className="w-full" variant="outline">
            Voltar
          </Button>
          <Button
            onClick={() => window.location.reload()}
            className="w-full"
            variant="ghost"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  console.log('[StripePayment] Rendering: Stripe Elements with clientSecret');
  return (
    <div className="py-2">
      <Elements stripe={stripePromise} options={{ clientSecret, locale: 'pt-BR' }}>
        <CheckoutForm planId={planId} onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  );
};
