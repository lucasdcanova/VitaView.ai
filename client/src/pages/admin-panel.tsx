import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Users,
  CreditCard,
  Settings,
  Edit,
  Trash,
  MoreVertical,
  Shield,
  UserIcon,
  ArrowLeft,
  Bug,
  Eye,
  CheckCircle2,
  LineChart,
  Activity,
  Mic
} from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

// AI Usage Stats Interface
interface AIUsageStat {
  userId: number;
  username: string;
  fullName: string | null;
  planName: string | null;
  aiRequests: number;
  transcriptionMinutes: number;
  examAnalyses: number;
}

// AI Usage Tab Component
function AIUsageTab() {
  const { data: usageStats = [], isLoading } = useQuery<AIUsageStat[]>({
    queryKey: ['/api/admin/usage-stats'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const getUsageColor = (value: number, limit: number) => {
    const percentage = value / limit;
    if (percentage >= 1) return "text-red-500 font-bold";
    if (percentage >= 0.8) return "text-yellow-600 font-semibold";
    return "text-green-600";
  };

  const getUsageBadge = (value: number, limit: number) => {
    const percentage = limit > 0 ? value / limit : 0;
    if (percentage >= 1) return <Badge variant="destructive">Excedido</Badge>;
    if (percentage >= 0.8) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Alto Uso</Badge>;
    return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Normal</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Monitoramento de Uso de IA (Fair Use)
        </CardTitle>
        <CardDescription>
          Acompanhe o consumo de recursos de IA e transcrição por usuário neste mês (Limites Elásticos)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : usageStats.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum dado de uso registrado este mês
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="text-right">Req. IA</TableHead>
                  <TableHead className="text-right">Transcrição (min)</TableHead>
                  <TableHead className="text-right">Análises Exame</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageStats.map((stat) => (
                  <TableRow key={stat.userId}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{stat.fullName || stat.username}</span>
                        <span className="text-xs text-muted-foreground">ID: {stat.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {stat.planName ? (
                        <Badge variant="secondary">{stat.planName}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Gratuito</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.aiRequests}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.transcriptionMinutes}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {stat.examAnalyses}
                    </TableCell>
                    <TableCell className="text-center">
                      {/* Lógica simplificada de status baseada em requisições (pode ser refinada por plano) */}
                      {getUsageBadge(stat.aiRequests, stat.planName ? 5000 : 50)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Interface para usuários
interface AdminUser {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  birthDate: string | null;
  gender: string | null;
  phoneNumber: string | null;
  address: string | null;
  activeProfileId: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  role?: string;
}

// Interface para planos
interface AdminPlan {
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
  createdAt: string;
}

// Interface para exibição de usuário com detalhes do plano
interface UserWithSubscription extends AdminUser {
  subscription?: {
    id: number;
    status: string;
    currentPeriodEnd: string;
    currentPeriodStart: string;
    createdAt: string;
    planId: number;
  };
  plan?: {
    name: string;
    price: number;
    interval: string;
  };
}

// Bug Report Interface
interface BugReport {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  status: 'new' | 'seen' | 'resolved';
  created_at: string;
}

// Bug Reports Tab Component
function BugReportsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bugReports = [], isLoading } = useQuery<BugReport[]>({
    queryKey: ['/api/admin/bug-reports'],
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/bug-reports/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/bug-reports'] });
      toast({
        title: "Status atualizado",
        description: "O status do relatório foi atualizado.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="destructive">Novo</Badge>;
      case 'seen':
        return <Badge variant="secondary">Visto</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-600">Resolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Relatórios de Bugs
        </CardTitle>
        <CardDescription>
          Visualize e gerencie os relatórios de bugs enviados pelos usuários
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : bugReports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum relatório de bug recebido
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead className="max-w-[300px]">Descrição</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bugReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {formatDate(report.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{report.user_name || 'Anônimo'}</span>
                        {report.user_email && (
                          <span className="text-xs text-muted-foreground">{report.user_email}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="truncate" title={report.description}>
                        {report.description}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[150px]">
                      {report.page_url ? (
                        <span className="text-xs text-muted-foreground truncate block" title={report.page_url}>
                          {report.page_url.replace(/^https?:\/\/[^/]+/, '')}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'seen' })}
                            disabled={report.status === 'seen'}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Marcar como Visto
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'resolved' })}
                            disabled={report.status === 'resolved'}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Marcar como Resolvido
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Financial KPI Dashboard Component
function FinancialDashboardTab() {
  const { data: kpis, isLoading, error } = useQuery<{
    financial: { mrr: number; arr: number; churnRate: number; arpu: number; arppu: number; ltv: number; newMrr: number; netRevenue: number };
    operational: { mau: number; totalUsers: number; newUsers: number };
    ai: {
      totalCost: number;
      costPerAveUser: number;
      costToRevenueRatio: number;
      features: { feature: string; cost: number; usageCount: number }[]
    };
  }>({
    queryKey: ['/api/admin/financial-kpi'],
    staleTime: 1000 * 60 * 15, // 15 minutes
  });

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
        <p className="font-bold flex items-center gap-2">
          ⚠️ Erro ao carregar dados financeiros
        </p>
        <p className="mt-1 text-sm">{(error as Error).message}</p>
        <p className="text-xs text-gray-500 mt-2">Verifique se você tem permissão ou se o servidor está rodando.</p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val * 5.7);
  };

  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  }

  const formatPercent = (val: number) => {
    return `${val.toFixed(2)}%`;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!kpis) return <div>Erro ao carregar dados financeiros</div>;

  return (
    <div className="space-y-6">
      {/* Section 1: Executive KPIs */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-gray-800">KPI Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Row 1: High Level */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600 font-semibold uppercase">MRR (Recorrente)</p>
              <h3 className="text-2xl font-bold text-blue-900">{formatCurrency(kpis.financial.mrr)}</h3>
              <p className="text-xs text-blue-700 mt-1">Novos (30d): {formatCurrency(kpis.financial.newMrr)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-600 font-semibold uppercase">MAU (Ativos/Mes)</p>
              <h3 className="text-2xl font-bold text-green-900">{kpis.operational.mau}</h3>
              <p className="text-xs text-green-700 mt-1">Novos Usuários: +{kpis.operational.newUsers}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
              <p className="text-sm text-orange-600 font-semibold uppercase">Churn Mensal</p>
              <h3 className="text-2xl font-bold text-orange-900">{formatPercent(kpis.financial.churnRate)}</h3>
              <p className="text-xs text-orange-700 mt-1">Meta: &le; 3%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-600 font-semibold uppercase">LTV (Estimado)</p>
              <h3 className="text-2xl font-bold text-purple-900">{formatCurrency(kpis.financial.ltv)}</h3>
              <p className="text-xs text-purple-700 mt-1">ARPU / Churn</p>
            </div>
          </div>

          {/* Row 2: Secondary Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-600 font-semibold uppercase">ARPPU (Pagantes)</p>
              <h3 className="text-xl font-bold text-gray-900">{formatCurrency(kpis.financial.arppu)}</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-600 font-semibold uppercase">ARPU (Geral)</p>
              <h3 className="text-xl font-bold text-gray-900">{formatCurrency(kpis.financial.arpu)}</h3>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-600 font-semibold uppercase">Receita Líquida (Est.)</p>
              <h3 className="text-xl font-bold text-indigo-900">{formatCurrency(kpis.financial.netRevenue)}</h3>
              <p className="text-xs text-indigo-700 mt-1">MRR - Custos IA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 opacity-60">
              <p className="text-sm text-gray-600 font-semibold uppercase">CAC (Mkt)</p>
              <h3 className="text-xl font-bold text-gray-900">-</h3>
              <p className="text-xs text-gray-500 mt-1">Não trackeado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 2: AI Costs & Economics */}
        <Card>
          <CardHeader className="bg-amber-50/50 pb-2 border-b border-amber-100">
            <CardTitle className="text-base font-bold text-amber-900">Custos e Estimativas da IA</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Custo Total Mensal (IA)</TableCell>
                  <TableCell className="text-right text-red-600 font-bold">{formatUSD(kpis.ai.totalCost)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Custo IA / Receita (%)</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={kpis.ai.costToRevenueRatio > 20 ? "destructive" : "secondary"} className={kpis.ai.costToRevenueRatio <= 20 ? "bg-green-100 text-green-800" : ""}>
                      {formatPercent(kpis.ai.costToRevenueRatio)}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Custo IA por Usuário Ativo</TableCell>
                  <TableCell className="text-right">{formatUSD(kpis.ai.costPerAveUser)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Margem da IA (%)</TableCell>
                  <TableCell className="text-right text-gray-400 italic">N/A (Requer atribuição)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Section 3: Feature Breakdown */}
        <Card>
          <CardHeader className="bg-slate-50/50 pb-2 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">Uso por Feature (Top Cost)</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 max-h-[300px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead className="text-right">Custo</TableHead>
                  <TableHead className="text-right">Uso (Qtd)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.ai.features.map((feat, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium capitalize">{feat.feature?.replace(/_/g, ' ') || 'Outros'}</TableCell>
                    <TableCell className="text-right">{formatUSD(feat.cost)}</TableCell>
                    <TableCell className="text-right">{feat.usageCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<AdminPlan | null>(null);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [isUserDeleteOpen, setIsUserDeleteOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);
  const [isPlanEditOpen, setIsPlanEditOpen] = useState(false);

  // Consulta para obter a lista de usuários
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserWithSubscription[]>({
    queryKey: ['/api/admin/users'],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Consulta para obter a lista de planos de assinatura
  const { data: allSubscriptionPlans = [], isLoading: isLoadingPlans } = useQuery<AdminPlan[]>({
    queryKey: ['/api/subscription-plans'],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Remover planos duplicados baseado no nome e configurações
  const subscriptionPlans = allSubscriptionPlans.filter((plan, index, self) =>
    index === self.findIndex(p =>
      p.name === plan.name &&
      p.maxProfiles === plan.maxProfiles &&
      p.maxUploadsPerProfile === plan.maxUploadsPerProfile &&
      p.price === plan.price
    )
  );

  // Função para contar usuários ativos por plano
  const getUserCountForPlan = (planId: number): number => {
    return users.filter(user =>
      user.subscription?.planId === planId &&
      user.subscription?.status === 'active'
    ).length;
  };

  // Verificar se o usuário atual é um administrador
  const { data: currentUser } = useQuery({ queryKey: ['/api/user'] });

  // Redirecionar se o usuário não for um administrador
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      toast({
        title: "Acesso não autorizado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  }, [currentUser, navigate, toast]);

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsers = users.filter(user => {
    if (!user.username && !user.fullName && !user.email) return false;

    const searchableFields = [
      user.username || '',
      user.fullName || '',
      user.email || '',
    ].map(field => field.toLowerCase());

    return searchableFields.some(field => field.includes(searchTerm.toLowerCase()));
  });

  // Função para editar usuário
  const handleEditUser = async (userData: Partial<AdminUser>) => {
    if (!selectedUser) return;

    try {
      const response = await apiRequest('PATCH', `/api/admin/users/${selectedUser.id}`, userData);
      if (response.ok) {
        toast({
          title: "Usuário atualizado",
          description: "As informações do usuário foram atualizadas com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        setIsUserEditOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao atualizar usuário");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar usuário",
        variant: "destructive",
      });
    }
  };

  // Função para excluir usuário
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await apiRequest('DELETE', `/api/admin/users/${selectedUser.id}`);
      if (response.ok) {
        toast({
          title: "Usuário excluído",
          description: "O usuário foi removido com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        setIsUserDeleteOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir usuário");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir usuário",
        variant: "destructive",
      });
    }
  };

  // Função para alterar o plano do usuário
  const handleChangePlan = async (planId: number) => {
    if (!selectedUser) return;

    try {
      const response = await apiRequest('POST', `/api/admin/users/${selectedUser.id}/change-plan`, { planId });
      if (response.ok) {
        toast({
          title: "Plano alterado",
          description: "O plano do usuário foi alterado com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        setIsChangePlanOpen(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar plano");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar plano",
        variant: "destructive",
      });
    }
  };

  // Função para conceder papel de administrador
  const handleToggleAdminRole = async (user: UserWithSubscription) => {
    if (!user.role) return;

    const newRole = user.role === 'admin' ? 'user' : 'admin';

    try {
      const response = await apiRequest('PATCH', `/api/admin/users/${user.id}`, { role: newRole });
      if (response.ok) {
        toast({
          title: newRole === 'admin' ? "Administrador adicionado" : "Administrador removido",
          description: `O usuário agora ${newRole === 'admin' ? 'é' : 'não é mais'} um administrador.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar papel do usuário");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar papel do usuário",
        variant: "destructive",
      });
    }
  };

  // Função para ativar/desativar plano
  const handleTogglePlanStatus = async (plan: AdminPlan) => {
    try {
      const response = await apiRequest('PATCH', `/api/admin/plans/${plan.id}`, {
        isActive: !plan.isActive
      });
      if (response.ok) {
        toast({
          title: plan.isActive ? "Plano desativado" : "Plano ativado",
          description: `O plano ${plan.name} foi ${plan.isActive ? 'desativado' : 'ativado'} com sucesso.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao alterar status do plano");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao alterar status do plano",
        variant: "destructive",
      });
    }
  };

  // Função para editar plano
  const handleEditPlan = async (planData: Partial<AdminPlan>) => {
    if (!selectedPlan) return;

    try {
      const response = await apiRequest('PATCH', `/api/admin/plans/${selectedPlan.id}`, planData);
      if (response.ok) {
        toast({
          title: "Plano atualizado",
          description: "O plano foi atualizado com sucesso.",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscription-plans'] });
        setIsPlanEditOpen(false);
        setSelectedPlan(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao editar plano");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao editar plano",
        variant: "destructive",
      });
    }
  };

  // Renderizar apenas quando o usuário for carregado para evitar flashes de interface
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-2">Painel de Administração</h1>
      <p className="text-muted-foreground mb-6">Gerencie usuários, planos e configurações do sistema</p>

      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6 lg:w-[800px]">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Planos</span>
          </TabsTrigger>
          <TabsTrigger value="ai-usage" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Uso de IA</span>
          </TabsTrigger>
          <TabsTrigger value="recados" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            <span>Recados</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            <span>Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba de Usuários */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                  <CardDescription>
                    Visualize, edite ou remova usuários do sistema
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por nome, email..."
                    className="pl-8 w-full md:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Nenhum usuário encontrado para a busca" : "Nenhum usuário cadastrado"}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Início Plano</TableHead>
                        <TableHead>Renovação</TableHead>
                        <TableHead>Papel</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.fullName || user.username}
                          </TableCell>
                          <TableCell>{user.email || "—"}</TableCell>
                          <TableCell>
                            {user.plan ? (
                              <span>{user.plan.name}</span>
                            ) : (
                              <span className="text-muted-foreground">Gratuito</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {user.subscription?.createdAt
                              ? new Date(user.subscription.createdAt).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {user.subscription?.currentPeriodEnd
                              ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {user.role === 'admin' ? (
                              <Badge variant="default" className="bg-[#1E3A5F]">
                                Admin
                              </Badge>
                            ) : (
                              <Badge variant="outline">Usuário</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsUserEditOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar usuário
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsChangePlanOpen(true);
                                  }}
                                >
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Alterar plano
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleToggleAdminRole(user)}
                                >
                                  {user.role === 'admin' ? (
                                    <>
                                      <UserIcon className="mr-2 h-4 w-4" />
                                      Remover admin
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="mr-2 h-4 w-4" />
                                      Tornar admin
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsUserDeleteOpen(true);
                                  }}
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Excluir usuário
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Planos */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Planos de Assinatura</CardTitle>
              <CardDescription>
                Visualize e edite os planos disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPlans ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : subscriptionPlans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum plano cadastrado
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Perfis Máximos</TableHead>
                        <TableHead>Uploads por Perfil</TableHead>
                        <TableHead>Usuários Ativos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>
                            {plan.price === 0
                              ? "Grátis"
                              : `R$${(plan.price / 100).toFixed(2)}/${plan.interval === 'month' ? 'mês' : 'ano'}`
                            }
                          </TableCell>
                          <TableCell>{plan.maxProfiles}</TableCell>
                          <TableCell>{plan.maxUploadsPerProfile}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{getUserCountForPlan(plan.id)}</span>
                              <span className="text-muted-foreground text-sm">usuários</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {plan.isActive ? (
                              <Badge variant="default" className="bg-green-600">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Abrir menu</span>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedPlan(plan);
                                    setIsPlanEditOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar plano
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleTogglePlanStatus(plan)}
                                >
                                  {plan.isActive ? (
                                    <>
                                      <Settings className="mr-2 h-4 w-4" />
                                      Desativar plano
                                    </>
                                  ) : (
                                    <>
                                      <Settings className="mr-2 h-4 w-4" />
                                      Ativar plano
                                    </>
                                  )}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Uso de IA */}
        <TabsContent value="ai-usage" className="space-y-4">
          <AIUsageTab />
        </TabsContent>

        {/* Aba de Recados (Bug Reports) */}
        <TabsContent value="recados" className="space-y-4">
          <BugReportsTab />
        </TabsContent>

        {/* Aba Financeira */}
        <TabsContent value="finance" className="space-y-4">
          <FinancialDashboardTab />
        </TabsContent>

        {/* Aba de Configurações */}
        <TabsContent value="settings" className="space-y-4">
          {/* Configurações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais da Plataforma</CardTitle>
              <CardDescription>
                Configure informações básicas e branding da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Aplicação</label>
                  <Input defaultValue="VitaView AI" placeholder="Nome da aplicação" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email de Contato</label>
                  <Input defaultValue="contato@vitaview.ai" placeholder="Email de contato" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Instagram</label>
                  <Input defaultValue="@vitaview.ai" placeholder="Instagram handle" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL do Logo</label>
                  <Input placeholder="URL da imagem do logo" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mensagem de Boas-vindas</label>
                <Input defaultValue="Bem-vindo ao VitaView AI - Sua plataforma de análise médica inteligente" placeholder="Mensagem exibida na página inicial" />
              </div>
              <Button>Salvar Configurações Gerais</Button>
            </CardContent>
          </Card>

          {/* Configurações de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Usuários</CardTitle>
              <CardDescription>
                Defina limites e políticas para usuários da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limite Global de Upload (MB)</label>
                  <Input type="number" defaultValue="50" placeholder="50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tamanho Máximo por Arquivo (MB)</label>
                  <Input type="number" defaultValue="10" placeholder="10" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tempo de Sessão (minutos)</label>
                  <Input type="number" defaultValue="30" placeholder="30" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tamanho Mínimo da Senha</label>
                  <Input type="number" defaultValue="8" placeholder="8" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tentativas de Login</label>
                  <Input type="number" defaultValue="5" placeholder="5" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="require-email-verification" defaultChecked className="rounded" />
                <label htmlFor="require-email-verification" className="text-sm font-medium">
                  Exigir verificação de email para novos usuários
                </label>
              </div>
              <Button>Salvar Configurações de Usuários</Button>
            </CardContent>
          </Card>

          {/* Configurações de IA */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de IA e Análise</CardTitle>
              <CardDescription>
                Configure provedores de IA e limites de processamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provedor de IA Principal</label>
                  <select className="w-full p-2 border rounded" defaultValue="openai">
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="anthropic">Claude (Anthropic)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Modelo de IA</label>
                  <select className="w-full p-2 border rounded" defaultValue="gpt-4">
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limite de Tokens por Análise</label>
                  <Input type="number" defaultValue="4000" placeholder="4000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeout de Análise (segundos)</label>
                  <Input type="number" defaultValue="120" placeholder="120" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Máx. Páginas por PDF</label>
                  <Input type="number" defaultValue="10" placeholder="10" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Chave da API OpenAI</label>
                <Input type="password" placeholder="sk-..." />
              </div>
              <Button>Salvar Configurações de IA</Button>
            </CardContent>
          </Card>

          {/* Configurações de Email */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Email e Notificações</CardTitle>
              <CardDescription>
                Configure servidor SMTP e templates de email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Servidor SMTP</label>
                  <Input placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Porta SMTP</label>
                  <Input type="number" defaultValue="587" placeholder="587" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email do Remetente</label>
                  <Input placeholder="noreply@vitaview.ai" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Remetente</label>
                  <Input defaultValue="VitaView AI" placeholder="VitaView AI" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Usuário SMTP</label>
                  <Input placeholder="usuario@gmail.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Senha SMTP</label>
                  <Input type="password" placeholder="senha ou app password" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="enable-email-notifications" defaultChecked className="rounded" />
                  <label htmlFor="enable-email-notifications" className="text-sm font-medium">
                    Ativar notificações por email
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="enable-welcome-email" defaultChecked className="rounded" />
                  <label htmlFor="enable-welcome-email" className="text-sm font-medium">
                    Enviar email de boas-vindas para novos usuários
                  </label>
                </div>
              </div>
              <Button>Salvar Configurações de Email</Button>
            </CardContent>
          </Card>

          {/* Configurações de Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Sistema</CardTitle>
              <CardDescription>
                Gerencie backup, logs e manutenção do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequência de Backup</label>
                  <select className="w-full p-2 border rounded" defaultValue="daily">
                    <option value="hourly">A cada hora</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Retenção de Logs (dias)</label>
                  <Input type="number" defaultValue="30" placeholder="30" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">URL de Backup (S3/Cloud)</label>
                  <Input placeholder="s3://bucket/backup/" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nível de Log</label>
                  <select className="w-full p-2 border rounded" defaultValue="info">
                    <option value="error">Apenas Erros</option>
                    <option value="warn">Avisos e Erros</option>
                    <option value="info">Informativo</option>
                    <option value="debug">Debug Completo</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="enable-maintenance-mode" className="rounded" />
                  <label htmlFor="enable-maintenance-mode" className="text-sm font-medium">
                    Ativar modo de manutenção
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="enable-auto-backup" defaultChecked className="rounded" />
                  <label htmlFor="enable-auto-backup" className="text-sm font-medium">
                    Ativar backup automático
                  </label>
                </div>
              </div>
              <div className="flex gap-2">
                <Button>Salvar Configurações</Button>
                <Button variant="outline">Executar Backup Agora</Button>
                <Button variant="destructive">Limpar Logs Antigos</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição de Usuário */}
      {selectedUser && (
        <Dialog open={isUserEditOpen} onOpenChange={setIsUserEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>
                Faça alterações nas informações do usuário
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="fullName" className="text-right text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="fullName"
                  defaultValue={selectedUser.fullName || ""}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={selectedUser.email || ""}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="password" className="text-right text-sm font-medium">
                  Nova Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nova senha (opcional)"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUserEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleEditUser({
                fullName: (document.getElementById('fullName') as HTMLInputElement).value,
                email: (document.getElementById('email') as HTMLInputElement).value,
                password: (document.getElementById('password') as HTMLInputElement).value || undefined
              })}>
                Salvar alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Exclusão de Usuário */}
      {selectedUser && (
        <Dialog open={isUserDeleteOpen} onOpenChange={setIsUserDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Excluir Usuário</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário e todos os seus dados.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>
                Tem certeza que deseja excluir o usuário <strong>{selectedUser.fullName || selectedUser.username}</strong>?
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUserDeleteOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser}>
                Sim, excluir usuário
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de Alteração de Plano */}
      {selectedUser && (
        <Dialog open={isChangePlanOpen} onOpenChange={setIsChangePlanOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Alterar Plano</DialogTitle>
              <DialogDescription>
                Selecione um novo plano para o usuário {selectedUser.fullName || selectedUser.username}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Plano atual: <strong>{selectedUser.plan?.name || "Gratuito"}</strong>
              </p>

              <div className="grid grid-cols-3 gap-3">
                {/* Group plans by base name */}
                {(() => {
                  const planGroups: Record<string, typeof subscriptionPlans> = {};
                  const planOrder = ['gratuito', 'vita pro', 'vita team', 'vita business', 'hospitais'];

                  subscriptionPlans.forEach((plan) => {
                    const baseName = plan.name
                      .replace(/ mensal| semestral| anual/i, '')
                      .trim()
                      .toLowerCase();
                    if (!planGroups[baseName]) {
                      planGroups[baseName] = [];
                    }
                    planGroups[baseName].push(plan);
                  });

                  return planOrder
                    .filter(name => planGroups[name])
                    .map((baseName) => {
                      const group = planGroups[baseName];
                      const monthly = group.find(p => p.interval === 'month');
                      const semiannual = group.find(p => p.interval === '6month');
                      const annual = group.find(p => p.interval === 'year');
                      const representativePlan = monthly || group[0];
                      const isCurrentPlan = group.some(p => selectedUser.subscription?.planId === p.id);
                      const displayName = representativePlan.name
                        .replace(/ mensal| semestral| anual/i, '')
                        .trim();

                      return (
                        <Card
                          key={baseName}
                          className={`transition-all duration-200 ${isCurrentPlan ? 'border-primary bg-primary/5' : ''}`}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-semibold">{displayName}</CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {representativePlan.price === 0
                                ? "Grátis"
                                : `A partir de R$${(representativePlan.price / 100).toFixed(0)}/mês`
                              }
                            </p>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-2">
                            <div className="space-y-1.5">
                              {monthly && (
                                <Button
                                  variant={selectedUser.subscription?.planId === monthly.id ? "default" : "outline"}
                                  size="sm"
                                  className="w-full text-xs h-8 justify-between"
                                  onClick={() => handleChangePlan(monthly.id)}
                                >
                                  <span>Mensal</span>
                                  <span className="font-normal">{monthly.price === 0 ? 'Grátis' : `R$${(monthly.price / 100).toFixed(0)}`}</span>
                                </Button>
                              )}
                              {semiannual && (
                                <Button
                                  variant={selectedUser.subscription?.planId === semiannual.id ? "default" : "outline"}
                                  size="sm"
                                  className="w-full text-xs h-8 justify-between"
                                  onClick={() => handleChangePlan(semiannual.id)}
                                >
                                  <span>Semestral</span>
                                  <span className="font-normal">{`R$${(semiannual.price / 100).toFixed(0)}`}</span>
                                </Button>
                              )}
                              {annual && (
                                <Button
                                  variant={selectedUser.subscription?.planId === annual.id ? "default" : "outline"}
                                  size="sm"
                                  className="w-full text-xs h-8 justify-between"
                                  onClick={() => handleChangePlan(annual.id)}
                                >
                                  <span>Anual</span>
                                  <span className="font-normal">{`R$${(annual.price / 100).toFixed(0)}`}</span>
                                </Button>
                              )}
                              {!monthly && !semiannual && !annual && (
                                <Button
                                  variant={isCurrentPlan ? "default" : "outline"}
                                  size="sm"
                                  className="w-full text-xs h-8"
                                  onClick={() => handleChangePlan(representativePlan.id)}
                                >
                                  Selecionar
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    });
                })()}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsChangePlanOpen(false)}>
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Edição de Plano */}
      <Dialog open={isPlanEditOpen} onOpenChange={setIsPlanEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
            <DialogDescription>
              Edite as informações do plano de assinatura
            </DialogDescription>
          </DialogHeader>
          {selectedPlan && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const planData = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                maxProfiles: parseInt(formData.get('maxProfiles') as string),
                maxUploadsPerProfile: parseInt(formData.get('maxUploadsPerProfile') as string),
                price: Math.round(parseFloat(formData.get('price') as string) * 100), // Converter para centavos
              };
              handleEditPlan(planData);
            }}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right">Nome</label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedPlan.name}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="description" className="text-right">Descrição</label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={selectedPlan.description}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="maxProfiles" className="text-right">Max Perfis</label>
                  <Input
                    id="maxProfiles"
                    name="maxProfiles"
                    type="number"
                    defaultValue={selectedPlan.maxProfiles}
                    className="col-span-3"
                    required
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="maxUploadsPerProfile" className="text-right">Max Uploads</label>
                  <Input
                    id="maxUploadsPerProfile"
                    name="maxUploadsPerProfile"
                    type="number"
                    defaultValue={selectedPlan.maxUploadsPerProfile}
                    className="col-span-3"
                    required
                    min="1"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="price" className="text-right">Preço (R$)</label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={(selectedPlan.price / 100).toFixed(2)}
                    className="col-span-3"
                    required
                    min="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
