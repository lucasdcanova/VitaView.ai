import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BrandLoader } from "@/components/ui/brand-loader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  StoreKit,
  buildStableAppAccountToken,
  type StoreKitProduct,
  type StoreKitTransaction,
} from "@/lib/storekit";
import { useToast } from "@/hooks/use-toast";

interface IOSStoreKitPurchaseProps {
  productId: string;
  userId: number;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const formatSubscriptionPeriod = (product: StoreKitProduct | null): string | null => {
  if (!product) return null;
  const unit = product.subscriptionPeriodUnit?.toLowerCase();
  const value = product.subscriptionPeriodValue;
  if (unit && typeof value === "number" && value > 0) {
    const map: Record<string, [string, string]> = {
      day: ["dia", "dias"],
      week: ["semana", "semanas"],
      month: ["mês", "meses"],
      year: ["ano", "anos"],
    };
    const labels = map[unit];
    if (labels) {
      return `${value} ${value === 1 ? labels[0] : labels[1]}`;
    }
  }
  const display = (product?.displayName || "").toLowerCase();
  if (display.includes("anual") || display.includes("annual") || display.includes("yearly") || display.includes("year")) {
    return "1 ano";
  }
  if (display.includes("semestral") || display.includes("6 month") || display.includes("six month")) {
    return "6 meses";
  }
  if (display.includes("mensal") || display.includes("monthly") || display.includes("month")) {
    return "1 mês";
  }
  return null;
};

const syncTransaction = async (transaction: StoreKitTransaction) => {
  await apiRequest("POST", "/api/app-store/sync-subscription", {
    transactionId: transaction.transactionId,
    signedTransactionInfo: transaction.signedTransactionInfo,
  });
};

export const IOSStoreKitPurchase = ({
  productId,
  userId,
  onCancel,
  onSuccess,
}: IOSStoreKitPurchaseProps) => {
  const { toast } = useToast();
  const [product, setProduct] = useState<StoreKitProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadProduct = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const { products } = await StoreKit.getProducts({ productIds: [productId] });
        if (!mounted) return;

        setProduct(products[0] ?? null);
        if (!products[0]) {
          setError("O produto ainda não está disponível na App Store.");
        }
      } catch (loadError) {
        if (!mounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar o produto da App Store."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadProduct();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const appAccountToken = await buildStableAppAccountToken(userId);
      const result = await StoreKit.purchase({
        productId,
        appAccountToken,
      });

      if (result.status === "cancelled") {
        return;
      }

      if (result.status === "pending") {
        toast({
          title: "Compra pendente",
          description: "A Apple ainda está processando essa assinatura.",
        });
        return;
      }

      if (!result.transaction) {
        throw new Error("A App Store não retornou a transação da assinatura.");
      }

      await syncTransaction(result.transaction);
      await queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/subscription/limits"] });

      toast({
        title: "Assinatura ativada",
        description: "Seu plano foi atualizado com sucesso.",
      });
      onSuccess?.();
    } catch (purchaseError) {
      toast({
        title: "Erro ao concluir assinatura",
        description:
          purchaseError instanceof Error
            ? purchaseError.message
            : "Não foi possível concluir a compra no iPhone.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      const { transactions } = await StoreKit.restorePurchases();
      for (const transaction of transactions) {
        await syncTransaction(transaction);
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/user-subscription"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/subscription/limits"] });

      toast({
        title: "Compras restauradas",
        description:
          transactions.length > 0
            ? "As assinaturas ativas foram sincronizadas."
            : "Nenhuma assinatura ativa foi encontrada para este Apple ID.",
      });
      onSuccess?.();
    } catch (restoreError) {
      toast({
        title: "Erro ao restaurar compras",
        description:
          restoreError instanceof Error
            ? restoreError.message
            : "Não foi possível restaurar as compras.",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[180px] items-center justify-center">
        <BrandLoader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <div className="font-semibold text-base text-foreground">{product?.displayName}</div>
          {formatSubscriptionPeriod(product) && (
            <div className="mt-1 text-xs text-muted-foreground">
              Duração: {formatSubscriptionPeriod(product)}
            </div>
          )}
          <div className="mt-2 text-2xl font-semibold text-foreground">
            {product?.displayPrice}
            {formatSubscriptionPeriod(product) && (
              <span className="text-sm font-normal text-muted-foreground"> / {formatSubscriptionPeriod(product)}</span>
            )}
          </div>
          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            <p>
              O pagamento será cobrado na sua conta Apple ID na confirmação da compra.
            </p>
            <p>
              A assinatura é renovada automaticamente, a menos que seja cancelada com pelo menos 24 horas de antecedência ao final do período atual. Sua conta Apple ID será cobrada pela renovação no mesmo valor dentro das 24 horas anteriores ao final do período atual.
            </p>
            <p>
              Você pode gerenciar suas assinaturas e desativar a renovação automática nos Ajustes da sua conta Apple após a compra.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={Boolean(error) || isPurchasing}
          onClick={handlePurchase}
        >
          {isPurchasing ? (
            <>
              <BrandLoader className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Assinar no iPhone"
          )}
        </Button>
        <Button variant="outline" disabled={isPurchasing} onClick={handleRestore}>
          Restaurar compras
        </Button>
        <Button variant="ghost" disabled={isPurchasing} onClick={onCancel}>
          Voltar
        </Button>
      </div>

      <div className="pt-2 text-center text-[11px] text-muted-foreground">
        Ao continuar, você concorda com os{" "}
        <Link
          href="/termos"
          className="underline font-medium text-foreground hover:text-primary"
        >
          Termos de Uso (EULA)
        </Link>
        {" "}e a{" "}
        <Link
          href="/privacidade"
          className="underline font-medium text-foreground hover:text-primary"
        >
          Política de Privacidade
        </Link>
        .
      </div>
    </div>
  );
};
