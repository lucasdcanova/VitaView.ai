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

// Log para debug detalhado
console.log('=== Debug Stripe ===');
console.log('Stripe Public Key existe:', !!stripePublicKey);
console.log('Stripe Public Key length:', stripePublicKey?.length);
console.log('Stripe Public Key começa com pk_:', stripePublicKey?.startsWith('pk_'));
console.log('Ambiente:', import.meta.env.MODE);

if (!stripePublicKey) {
  console.error('VITE_STRIPE_PUBLIC_KEY não está definida nas variáveis de ambiente');
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

// Validar formato da chave
if (!stripePublicKey.startsWith('pk_')) {
  console.error('Chave pública do Stripe tem formato inválido. Deve começar com pk_');
}

// Enhanced Stripe loading with CSP support
let stripePromise: Promise<any> | null = null;

const initializeStripe = async () => {
  if (stripePromise) return stripePromise;
  
  try {
    console.log('🔄 Inicializando Stripe com suporte CSP...');
    
    // First, ensure Stripe.js is loaded via our CSP-compliant loader
    await ExternalScriptLoader.loadStripeJS();
    
    // Then initialize with loadStripe
    stripePromise = loadStripe(stripePublicKey);
    
    const stripe = await stripePromise;
    if (stripe) {
      console.log('✅ Stripe carregado com sucesso via ExternalScriptLoader');
    } else {
      console.error('❌ Stripe retornou null - verifique a chave pública:', stripePublicKey);
    }
    
    return stripe;
  } catch (error) {
    console.error('❌ Erro ao carregar Stripe.js:', error);
    console.group('🔍 Diagnóstico de problemas Stripe:');
    console.error('1. Bloqueio CSP - script-src não permite js.stripe.com');
    console.error('2. Chave pública inválida:', stripePublicKey);
    console.error('3. Rede/firewall bloqueando stripe.com');
    console.error('4. Erro de CORS ou headers de segurança');
    console.error('5. CDN Stripe indisponível');
    console.groupEnd();
    
    // Try fallback initialization
    try {
      console.log('🔄 Tentando inicialização fallback do Stripe...');
      stripePromise = loadStripe(stripePublicKey);
      return await stripePromise;
    } catch (fallbackError) {
      console.error('❌ Fallback também falhou:', fallbackError);
      throw error;
    }
  }
};

// Initialize Stripe
try {
  stripePromise = initializeStripe();
} catch (error) {
  console.error('❌ Falha crítica na inicialização do Stripe:', error);
  stripePromise = Promise.reject(error);
}

interface CheckoutFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CheckoutForm = ({ onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/subscription-management',
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
    } else {
      toast({
        title: "Pagamento realizado com sucesso",
        description: "Sua assinatura foi ativada!",
      });
      setIsLoading(false);
      onSuccess?.();
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
          className="bg-[#1E3A5F] hover:bg-[#48C9B0] text-white"
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
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        const response = await apiRequest('POST', '/api/create-payment-intent', { planId });
        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('Não foi possível obter o token de pagamento');
        }
      } catch (error) {
        toast({
          title: "Erro ao iniciar pagamento",
          description: error instanceof Error ? error.message : "Ocorreu um erro ao preparar o pagamento.",
          variant: "destructive",
        });
        onCancel?.();
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [planId, toast, onCancel]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Não foi possível iniciar o pagamento. Tente novamente mais tarde.</p>
        <Button onClick={onCancel} className="mt-4" variant="outline">Voltar</Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: 'pt-BR' }}>
      <CheckoutForm onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
};