import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";

export default function HealthTrendsNew() {
  return (
    <>
      <Sidebar />
      <MobileHeader />
      <div className="flex flex-col min-h-screen lg:pl-64">
        <main className="flex-1 p-4 lg:p-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tendências de Saúde
              </h1>
              <p className="text-lg text-gray-600">
                Página em desenvolvimento - versão simplificada funcionando
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Status da Página</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-600 font-medium">
                  ✓ Página carregando com sucesso
                </p>
                <p className="text-gray-600 mt-2">
                  A página básica está funcionando. Vou adicionar as funcionalidades gradualmente.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </>
  );
}