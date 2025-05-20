import QuickSummary from "@/components/ui/quick-summary";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function QuickSummaryPage() {
  const { user } = useAuth();

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary-900">Gerador de Resumo Rápido</h1>
        <p className="text-lg text-gray-600 mt-2">
          Obtenha um resumo instantâneo dos seus exames médicos com um clique
        </p>
      </div>

      {!user ? (
        <Card>
          <CardHeader>
            <CardTitle>Faça login para continuar</CardTitle>
            <CardDescription>
              Você precisa estar autenticado para usar o gerador de resumo rápido
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate("/auth")}>
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      ) : (
        <QuickSummary />
      )}

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-800">Como funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold shrink-0">
              1
            </div>
            <div>
              <h3 className="font-medium text-amber-900">Carregue seu documento</h3>
              <p className="text-amber-700">Arraste e solte qualquer exame médico em formato PDF ou imagem (JPG, PNG)</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold shrink-0">
              2
            </div>
            <div>
              <h3 className="font-medium text-amber-900">Processamento inteligente</h3>
              <p className="text-amber-700">Nossa IA extrairá e interpretará os dados médicos do seu documento automaticamente</p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold shrink-0">
              3
            </div>
            <div>
              <h3 className="font-medium text-amber-900">Resumo instantâneo</h3>
              <p className="text-amber-700">Receba um resumo claro com os principais parâmetros, valores e recomendações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}