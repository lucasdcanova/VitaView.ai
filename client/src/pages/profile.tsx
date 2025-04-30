import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { updateUserProfile } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import MobileNav from "@/components/layout/mobile-nav";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const profileSchema = z.object({
  fullName: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  email: z.string().email({ message: "Email inválido" }),
  phoneNumber: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
});

const securitySchema = z.object({
  currentPassword: z.string().min(1, { message: "Senha atual é obrigatória" }),
  newPassword: z.string().min(6, { message: "Nova senha deve ter pelo menos 6 caracteres" }),
  confirmPassword: z.string().min(1, { message: "Confirmação de senha é obrigatória" }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;

export default function Profile() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");
  const { user } = useAuth();
  const { toast } = useToast();
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      birthDate: user?.birthDate || "",
      gender: user?.gender || "",
      address: user?.address || "",
    },
  });
  
  const securityForm = useForm<SecurityFormValues>({
    resolver: zodResolver(securitySchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const updateProfileMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message || "Ocorreu um erro ao atualizar o perfil.",
        variant: "destructive",
      });
    },
  });
  
  const updatePasswordMutation = useMutation({
    mutationFn: (data: SecurityFormValues) => updateUserProfile({ password: data.newPassword }),
    onSuccess: () => {
      securityForm.reset();
      toast({
        title: "Senha atualizada",
        description: "Sua senha foi atualizada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar senha",
        description: error.message || "Ocorreu um erro ao atualizar a senha.",
        variant: "destructive",
      });
    },
  });
  
  const onProfileSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(values);
  };
  
  const onSecuritySubmit = (values: SecurityFormValues) => {
    updatePasswordMutation.mutate(values);
  };
  
  // Medical conditions state
  const [conditions, setConditions] = useState({
    hypertension: false,
    diabetes: false,
    asthma: true,
    highCholesterol: false
  });
  
  // Settings and notification preferences state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    examReminders: false,
    shareDoctors: true,
    anonymousData: false
  });

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 relative">
        <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <main className="flex-1">
          <div className="p-4 md:p-6">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
              <p className="text-gray-600">Gerencie suas informações pessoais e preferências</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Information */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-4xl font-semibold mb-4 sm:mb-0 sm:mr-6">
                    {user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{user?.fullName || user?.username}</h2>
                    <p className="text-gray-500">{user?.email}</p>
                    <div className="mt-2 flex items-center">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400" fill="currentColor" viewBox="0 0 8 8">
                          <circle cx="4" cy="4" r="3" />
                        </svg>
                        Conta verificada
                      </span>
                      <span className="ml-2 text-xs text-gray-500">Membro desde {new Date(user?.createdAt || Date.now()).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                
                <Tabs defaultValue="personal" value={activeTab} onValueChange={(value) => setActiveTab(value)}>
                  <TabsList className="border-b border-gray-200 w-full justify-start rounded-none bg-transparent pb-px mb-6">
                    <TabsTrigger 
                      value="personal"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent"
                    >
                      Dados Pessoais
                    </TabsTrigger>
                    <TabsTrigger 
                      value="medical"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent ml-8"
                    >
                      Histórico Médico
                    </TabsTrigger>
                    <TabsTrigger 
                      value="security"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent ml-8"
                    >
                      Segurança
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Personal Data Tab */}
                  <TabsContent value="personal">
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={profileForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="birthDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Data de Nascimento</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={profileForm.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gênero</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione o gênero" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="female">Feminino</SelectItem>
                                    <SelectItem value="male">Masculino</SelectItem>
                                    <SelectItem value="other">Outro</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefiro não informar</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-6">
                          <FormField
                            control={profileForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Endereço</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                          <Button type="button" variant="outline" className="mr-3">
                            Cancelar
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                              </>
                            ) : (
                              "Salvar alterações"
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </TabsContent>
                  
                  {/* Medical History Tab */}
                  <TabsContent value="medical">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Condições médicas</h3>
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Checkbox 
                              id="condition1" 
                              checked={conditions.hypertension}
                              onCheckedChange={(checked) => 
                                setConditions({...conditions, hypertension: checked === true})
                              }
                            />
                            <label htmlFor="condition1" className="ml-3 text-sm text-gray-700">Hipertensão</label>
                          </div>
                          <div className="flex items-center">
                            <Checkbox 
                              id="condition2" 
                              checked={conditions.diabetes}
                              onCheckedChange={(checked) => 
                                setConditions({...conditions, diabetes: checked === true})
                              }
                            />
                            <label htmlFor="condition2" className="ml-3 text-sm text-gray-700">Diabetes</label>
                          </div>
                          <div className="flex items-center">
                            <Checkbox 
                              id="condition3" 
                              checked={conditions.asthma}
                              onCheckedChange={(checked) => 
                                setConditions({...conditions, asthma: checked === true})
                              }
                            />
                            <label htmlFor="condition3" className="ml-3 text-sm text-gray-700">Asma</label>
                          </div>
                          <div className="flex items-center">
                            <Checkbox 
                              id="condition4" 
                              checked={conditions.highCholesterol}
                              onCheckedChange={(checked) => 
                                setConditions({...conditions, highCholesterol: checked === true})
                              }
                            />
                            <label htmlFor="condition4" className="ml-3 text-sm text-gray-700">Colesterol alto</label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Alergias</h3>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-0.5 text-sm font-medium text-red-800">
                            Penicilina
                            <button type="button" className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-red-400 hover:bg-red-200 hover:text-red-500 focus:outline-none">
                              <span className="sr-only">Remove</span>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </span>
                          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-0.5 text-sm font-medium text-red-800">
                            Amendoim
                            <button type="button" className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-red-400 hover:bg-red-200 hover:text-red-500 focus:outline-none">
                              <span className="sr-only">Remove</span>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </span>
                          <Button variant="outline" size="sm" className="text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full">
                            + Adicionar alergia
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Medicamentos atuais</h3>
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <svg className="h-5 w-5 text-gray-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-800">Loratadina 10mg</p>
                              <p className="text-xs text-gray-500">1 comprimido diário pela manhã</p>
                            </div>
                            <button className="ml-auto text-gray-400 hover:text-gray-500">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                          <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-700 px-0">
                            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            Adicionar medicamento
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <Button type="button">
                          Salvar histórico médico
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Security Tab */}
                  <TabsContent value="security">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Alterar senha</h3>
                        <Form {...securityForm}>
                          <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                            <FormField
                              control={securityForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Senha atual</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={securityForm.control}
                              name="newPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nova senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={securityForm.control}
                              name="confirmPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Confirmar nova senha</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <Button 
                              type="submit" 
                              disabled={updatePasswordMutation.isPending}
                            >
                              {updatePasswordMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Atualizando...
                                </>
                              ) : (
                                "Atualizar senha"
                              )}
                            </Button>
                          </form>
                        </Form>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Verificação em duas etapas</h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Proteja sua conta com verificação em duas etapas</p>
                            <p className="text-xs text-gray-500 mt-1">Recomendamos fortemente ativar esta camada extra de segurança.</p>
                          </div>
                          <div className="flex items-center">
                            <Switch id="two-factor" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Dispositivos conectados</h3>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-gray-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-800">iPhone 13 Pro</p>
                                <p className="text-xs text-gray-500">Último acesso: Hoje, 10:23</p>
                              </div>
                            </div>
                            <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-700">
                              Desconectar
                            </Button>
                          </div>
                          
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <svg className="h-5 w-5 text-gray-500 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-800">MacBook Pro</p>
                                <p className="text-xs text-gray-500">Último acesso: Ontem, 18:45</p>
                              </div>
                            </div>
                            <Button variant="link" size="sm" className="text-primary-600 hover:text-primary-700">
                              Desconectar
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-lg font-medium text-red-600 mb-3">Zona de perigo</h3>
                        <p className="text-sm text-gray-600 mb-4">Depois de excluir sua conta, todos os seus dados serão permanentemente removidos.</p>
                        <Button variant="destructive">
                          Excluir minha conta
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              {/* Settings and Preferences */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-1">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Configurações</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Notificações por email</h3>
                      <p className="text-xs text-gray-500 mt-1">Receba atualizações sobre suas análises</p>
                    </div>
                    <div className="flex items-center">
                      <Switch 
                        id="email-notifications" 
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => 
                          setSettings({...settings, emailNotifications: checked})
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Notificações push</h3>
                      <p className="text-xs text-gray-500 mt-1">Receba alertas no seu dispositivo</p>
                    </div>
                    <div className="flex items-center">
                      <Switch 
                        id="push-notifications" 
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => 
                          setSettings({...settings, pushNotifications: checked})
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Lembretes de exames</h3>
                      <p className="text-xs text-gray-500 mt-1">Lembretes para repetir seus exames</p>
                    </div>
                    <div className="flex items-center">
                      <Switch 
                        id="exam-reminders" 
                        checked={settings.examReminders}
                        onCheckedChange={(checked) => 
                          setSettings({...settings, examReminders: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <hr className="my-6 border-gray-200" />
                
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Privacidade</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Compartilhar dados com médicos</h3>
                      <p className="text-xs text-gray-500 mt-1">Permite compartilhar suas análises com profissionais de saúde</p>
                    </div>
                    <div className="flex items-center">
                      <Switch 
                        id="share-doctors" 
                        checked={settings.shareDoctors}
                        onCheckedChange={(checked) => 
                          setSettings({...settings, shareDoctors: checked})
                        }
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Dados anônimos para pesquisa</h3>
                      <p className="text-xs text-gray-500 mt-1">Compartilha dados anônimos para melhorar o sistema</p>
                    </div>
                    <div className="flex items-center">
                      <Switch 
                        id="anonymous-data" 
                        checked={settings.anonymousData}
                        onCheckedChange={(checked) => 
                          setSettings({...settings, anonymousData: checked})
                        }
                      />
                    </div>
                  </div>
                </div>
                
                <hr className="my-6 border-gray-200" />
                
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Idioma e Região</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                    <Select defaultValue="pt-BR">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label htmlFor="units" className="block text-sm font-medium text-gray-700 mb-1">Unidades de medida</label>
                    <Select defaultValue="metric">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o sistema de unidades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Sistema métrico</SelectItem>
                        <SelectItem value="imperial">Sistema imperial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button type="button">
                    Salvar configurações
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
