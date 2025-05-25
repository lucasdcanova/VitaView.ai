import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  UserIcon
} from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

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
    planId: number;
  };
  plan?: {
    name: string;
    price: number;
    interval: string;
  };
}

export default function AdminPanel() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithSubscription | null>(null);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);
  const [isUserDeleteOpen, setIsUserDeleteOpen] = useState(false);
  const [isChangePlanOpen, setIsChangePlanOpen] = useState(false);

  // Consulta para obter a lista de usuários
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<UserWithSubscription[]>({ 
    queryKey: ['/api/admin/users'],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Consulta para obter a lista de planos de assinatura
  const { data: subscriptionPlans = [], isLoading: isLoadingPlans } = useQuery<AdminPlan[]>({ 
    queryKey: ['/api/subscription-plans'],
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

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
      <h1 className="text-3xl font-bold mb-2">Painel de Administração</h1>
      <p className="text-muted-foreground mb-6">Gerencie usuários, planos e configurações do sistema</p>
      
      <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span>Planos</span>
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
                        <TableHead>Status</TableHead>
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
                            {plan.isActive ? (
                              <Badge variant="default" className="bg-green-600">Ativo</Badge>
                            ) : (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
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
        
        {/* Aba de Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Gerencie configurações gerais da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-10">
                Configurações do sistema serão implementadas em breve
              </p>
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
          <DialogContent className="sm:max-w-[500px]">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptionPlans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`cursor-pointer hover:border-primary transition-all duration-200 ${
                      selectedUser.subscription?.planId === plan.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleChangePlan(plan.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-semibold text-lg mb-2">
                        {plan.price === 0 
                          ? "Grátis" 
                          : `R$${(plan.price / 100).toFixed(2)}/${plan.interval === 'month' ? 'mês' : 'ano'}`
                        }
                      </div>
                      <ul className="text-sm space-y-1">
                        <li>{plan.maxProfiles} perfis</li>
                        <li>{plan.maxUploadsPerProfile} uploads por perfil</li>
                      </ul>
                    </CardContent>
                  </Card>
                ))}
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
    </div>
  );
}