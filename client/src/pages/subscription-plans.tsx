import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CheckCircle, ArrowLeft, Users, Building, Hospital } from 'lucide-react';
import { useLocation } from 'wouter';
import type { SubscriptionPlan } from '@shared/schema';

type PlanCategory = 'individual' | 'clinic' | 'hospital' | null;

export default function SubscriptionPlansPage() {
  const [location, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<PlanCategory>(null);
  
  const { data: user } = useQuery({ queryKey: ['/api/user'] });
  const { data: subscriptionPlans = [] } = useQuery<SubscriptionPlan[]>({ queryKey: ['/api/subscription-plans'] });
  const { data: userSubscription } = useQuery({ queryKey: ['/api/user-subscription'] });

  // Filter out duplicate plans by name, keeping the most recent one
  const uniquePlans = subscriptionPlans.reduce((acc, plan) => {
    const existingPlan = acc.find(p => p.name === plan.name);
    if (!existingPlan || new Date(plan.createdAt) > new Date(existingPlan.createdAt)) {
      const filteredAcc = acc.filter(p => p.name !== plan.name);
      filteredAcc.push(plan);
      return filteredAcc;
    }
    return acc;
  }, [] as SubscriptionPlan[]);

  const allPlans = uniquePlans.filter(plan => plan.isActive);

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

  const hasActiveSubscription = userSubscription?.subscription && userSubscription?.plan;

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Escolha seu Plano</h1>
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

      <p className="text-lg text-muted-foreground mb-8">
        Selecione a categoria que melhor se adequa às suas necessidades:
      </p>
      
      {/* Categories Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          return (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : category.color
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <CardHeader className="text-center">
                <div className={`mx-auto mb-4 p-3 rounded-full shadow-sm ${
                  isSelected ? 'bg-primary/10' : 'bg-white'
                }`}>
                  <IconComponent className={`h-8 w-8 ${
                    isSelected ? 'text-primary' : 'text-primary'
                  }`} />
                </div>
                <CardTitle className="text-xl">{category.title}</CardTitle>
                <CardDescription className="text-base">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  className="w-full"
                  variant={isSelected ? "default" : "outline"}
                >
                  {isSelected ? 'Selecionado' : 'Ver Planos'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plans Section - Show when category is selected */}
      {selectedCategory && (
        <div className="border-t pt-8">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold">
              Planos - {categories.find(cat => cat.id === selectedCategory)?.title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="text-muted-foreground"
            >
              Limpar seleção
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                       selectedCategory === 'clinic' || selectedCategory === 'hospital' ? 'Sob consulta' :
                       `R$${(plan.price / 100).toFixed(2)}`}
                    </span>
                    {plan.price > 0 && selectedCategory === 'individual' && (
                      <span className="text-sm text-muted-foreground">/{plan.interval === 'month' ? 'mês' : 'ano'}</span>
                    )}
                  </div>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardContent className="pt-0">
                  {plan.name === 'Gratuito' ? (
                    <Button 
                      className="w-full" 
                      variant="outline"
                      disabled={hasActiveSubscription}
                    >
                      {hasActiveSubscription ? 'Plano Atual' : 'Plano Atual'}
                    </Button>
                  ) : selectedCategory === 'clinic' || selectedCategory === 'hospital' ? (
                    <Button className="w-full" variant="outline">
                      Entrar em Contato
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      disabled={hasActiveSubscription}
                    >
                      {hasActiveSubscription ? 'Indisponível' : 'Assinar Agora'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}