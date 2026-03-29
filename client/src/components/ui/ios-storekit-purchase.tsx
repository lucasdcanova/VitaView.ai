import { useEffect, useState } from "react";
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
          <div className="font-medium text-foreground">{product?.displayName}</div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {product?.displayPrice}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            A assinatura será cobrada e gerenciada pela sua conta Apple.
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
    </div>
  );
};
