import { useState, useEffect, useMemo } from 'react';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripeEnabled = Boolean(stripePublicKey && stripePublicKey.startsWith('pk_'));
const stripePromise = stripeEnabled ? loadStripe(stripePublicKey as string) : Promise.resolve(null);

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
        return;
      }

      if (!paymentIntent) {
        toast({
          title: "Pagamento em processamento",
          description: "Seu pagamento está sendo processado. O plano será ativado em breve.",
        });
        onSuccess?.();
        return;
      }

      if (paymentIntent.status !== 'succeeded') {
        toast({
          title: "Pagamento em processamento",
          description: "A confirmação do pagamento ainda está em andamento.",
        });
        return;
      }

      try {
        await apiRequest('POST', '/api/activate-subscription', {
          planId,
          paymentIntentId: paymentIntent.id,
        });

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
      }
    } catch (err) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o pagamento.",
        variant: "destructive",
      });
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
  const [retryToken, setRetryToken] = useState(0);

  const elementOptions = useMemo(() => ({
    clientSecret,
    locale: 'pt-BR' as const,
  }), [clientSecret]);

  useEffect(() => {
    let mounted = true;

    if (!stripeEnabled) {
      setError('Stripe não está configurado. Por favor, configure a chave pública do Stripe.');
      setIsLoading(false);
      return;
    }

    const fetchPaymentIntent = async () => {
      try {
        if (mounted) {
          setError(null);
          setIsLoading(true);
        }

        const response = await apiRequest('POST', '/api/create-payment-intent', { planId });
        const data = await response.json();

        if (!data.clientSecret) {
          throw new Error(data.message || 'Não foi possível obter o token de pagamento');
        }

        if (mounted) {
          setClientSecret(data.clientSecret);
          setError(null);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Ocorreu um erro ao preparar o pagamento.";
        if (mounted) {
          setError(message);
          toast({
            title: 'Erro ao iniciar pagamento',
            description: message,
            variant: 'destructive'
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPaymentIntent();
    return () => {
      mounted = false;
    };
  }, [planId, retryToken, toast]);

  if (!stripeEnabled) {
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
    return (
      <div className="flex flex-col justify-center items-center min-h-[200px] space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Preparando pagamento...</p>
      </div>
    );
  }

  if (error || !clientSecret) {
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
            onClick={() => setRetryToken((current) => current + 1)}
            className="w-full"
            variant="ghost"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <Elements stripe={stripePromise} options={elementOptions}>
        <CheckoutForm
          planId={planId}
          onSuccess={onSuccess}
          onCancel={onCancel}
        />
      </Elements>
    </div>
  );
};
