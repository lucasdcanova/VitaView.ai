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
import { Loader2, Stethoscope, Plus, Trash2, Edit, Star, MoreVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const MEDICAL_SPECIALTIES = [
  "Alergia e Imunologia",
  "Anestesiologia",
  "Angiologia",
  "Cardiologia",
  "Cirurgia Geral",
  "Cirurgia Plástica",
  "Clínica Médica",
  "Dermatologia",
  "Endocrinologia e Metabologia",
  "Gastroenterologia",
  "Geriatria",
  "Ginecologia e Obstetrícia",
  "Hematologia e Hemoterapia",
  "Infectologia",
  "Medicina de Família e Comunidade",
  "Nefrologia",
  "Neurologia",
  "Oftalmologia",
  "Ortopedia e Traumatologia",
  "Otorrinolaringologia",
  "Pediatria",
  "Pneumologia",
  "Psiquiatria",
  "Radiologia e Diagnóstico por Imagem",
  "Reumatologia",
  "Urologia"
];

const PROFESSIONAL_TYPES = [
  { value: "doctor", label: "Médico", council: "CRM" },
  { value: "nurse", label: "Enfermeiro", council: "COREN" },
  { value: "physiotherapist", label: "Fisioterapeuta", council: "CREFITO" },
  { value: "nutritionist", label: "Nutricionista", council: "CRN" },
  { value: "psychologist", label: "Psicólogo", council: "CRP" },
  { value: "other", label: "Outro", council: "Documento" },
];

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

const doctorSchema = z.object({
  name: z.string().min(1, "Nome do profissional é obrigatório"),
  crm: z.string().min(1, "Número do registro é obrigatório"),
  specialty: z.string().optional(),
  professionalType: z.string().min(1, "Tipo de profissional é obrigatório"),
  isDefault: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;
type DoctorFormValues = z.infer<typeof doctorSchema>;

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
        description: error.message || "Ocorreu um erro ao atualizar o perfil. Tente novamente.",
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

  // Doctor management state and hooks
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);

  const doctorForm = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      crm: "",
      specialty: "",
      professionalType: "doctor",
      isDefault: false,
    },
  });

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const createDoctorMutation = useMutation({
    mutationFn: (data: DoctorFormValues) => apiRequest("POST", "/api/doctors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Profissional cadastrado",
        description: "O profissional foi adicionado com sucesso.",
      });
      setIsDoctorDialogOpen(false);
      doctorForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar médico",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const updateDoctorMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DoctorFormValues }) =>
      apiRequest("PUT", `/api/doctors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Profissional atualizado",
        description: "Os dados do profissional foram atualizados com sucesso.",
      });
      setIsDoctorDialogOpen(false);
      setEditingDoctor(null);
      doctorForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar médico",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteDoctorMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/doctors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Profissional removido",
        description: "O profissional foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover médico",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const setDefaultDoctorMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PUT", `/api/doctors/${id}/set-default`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Profissional padrão definido",
        description: "Este profissional foi definido como padrão.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao definir médico padrão",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const onDoctorSubmit = (values: DoctorFormValues) => {
    if (editingDoctor) {
      updateDoctorMutation.mutate({ id: editingDoctor.id, data: values });
    } else {
      createDoctorMutation.mutate(values);
    }
  };

  const handleEditDoctor = (doctor: any) => {
    setEditingDoctor(doctor);
    doctorForm.reset({
      name: doctor.name,
      crm: doctor.crm,
      specialty: doctor.specialty || "",
      professionalType: doctor.professionalType || "doctor",
      isDefault: doctor.isDefault,
    });
    setIsDoctorDialogOpen(true);
  };

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    doctorForm.reset({
      name: "",
      crm: "",
      specialty: "",
      professionalType: "doctor",
      isDefault: false,
    });
    setIsDoctorDialogOpen(true);
  };

  // Medical conditions state


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
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

        <main className="flex-1">
          <div className="p-4 md:p-6">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Conta profissional</h1>
              <p className="text-gray-600">Gerencie seus dados como profissional de saúde e ajuste preferências da plataforma</p>
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

                <Tabs defaultValue="personal">
                  <TabsList className="border-b border-gray-200 w-full justify-start rounded-none bg-transparent pb-px mb-6">
                    <TabsTrigger
                      value="personal"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent"
                    >
                      Dados Pessoais
                    </TabsTrigger>
                    <TabsTrigger
                      value="doctors"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-primary-600 border-b-2 border-transparent rounded-none bg-transparent ml-8"
                    >
                      Meus Profissionais
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
                                  <Input {...field} name={field.name} autoComplete="given-name" />
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
                                  <Input type="email" {...field} name={field.name} autoComplete="email" />
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
                                  <Input {...field} name={field.name} autoComplete="tel" />
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
                                  <Input type="date" {...field} name={field.name} autoComplete="bday" />
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
                                  name={field.name}
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
                                  <Input {...field} name={field.name} autoComplete="address-line1" />
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

                  {/* Doctors Tab */}
                  <TabsContent value="doctors">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">Profissionais de Saúde</h3>
                          <p className="text-sm text-gray-500">Gerencie os profissionais responsáveis pelos seus tratamentos</p>
                        </div>
                        <Button onClick={handleAddDoctor} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Profissional
                        </Button>
                      </div>

                      {doctorsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        </div>
                      ) : doctors.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900">Nenhum profissional cadastrado</h3>
                          <p className="text-gray-500 mb-4">Adicione seus médicos, nutricionistas ou fisioterapeutas para facilitar o acompanhamento</p>
                          <Button variant="outline" onClick={handleAddDoctor}>
                            Cadastrar primeiro profissional
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {doctors.map((doctor) => (
                            <div key={doctor.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Stethoscope className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {doctor.professionalType === 'doctor' && !doctor.name.startsWith('Dr') ? `Dr(a). ${doctor.name}` : doctor.name}
                                    </h4>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="outline" className="text-xs font-normal">
                                        {PROFESSIONAL_TYPES.find(t => t.value === (doctor.professionalType || 'doctor'))?.label || 'Profissional'}
                                      </Badge>
                                      <p className="text-sm text-gray-500">
                                        {PROFESSIONAL_TYPES.find(t => t.value === (doctor.professionalType || 'doctor'))?.council || 'Registro'}: {doctor.crm}
                                      </p>
                                    </div>
                                    {doctor.specialty && (
                                      <p className="text-sm text-gray-500">{doctor.specialty}</p>
                                    )}
                                    {doctor.isDefault && (
                                      <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                        <Star className="h-3 w-3 mr-1 fill-blue-700" />
                                        Principal
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleEditDoctor(doctor)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Editar
                                    </DropdownMenuItem>
                                    {!doctor.isDefault && (
                                      <DropdownMenuItem onClick={() => setDefaultDoctorMutation.mutate(doctor.id)}>
                                        <Star className="h-4 w-4 mr-2" />
                                        Definir como padrão
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => {
                                        if (confirm("Tem certeza que deseja remover este médico?")) {
                                          deleteDoctorMutation.mutate(doctor.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Remover
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Dialog open={isDoctorDialogOpen} onOpenChange={setIsDoctorDialogOpen}>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{editingDoctor ? "Editar Profissional" : "Adicionar Profissional"}</DialogTitle>
                            <DialogDescription>
                              Cadastre o profissional de saúde para facilitar o registro de informações.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...doctorForm}>
                            <form onSubmit={doctorForm.handleSubmit(onDoctorSubmit)} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={doctorForm.control}
                                  name="professionalType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Tipo de Profissional</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {PROFESSIONAL_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={doctorForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nome Completo *</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Nome do profissional" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <FormField
                                  control={doctorForm.control}
                                  name="crm"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>
                                        {PROFESSIONAL_TYPES.find(t => t.value === doctorForm.watch('professionalType'))?.council || 'Registro'} *
                                      </FormLabel>
                                      <FormControl>
                                        <Input placeholder="123456/UF" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={doctorForm.control}
                                  name="specialty"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Especialidade</FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione a especialidade" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="max-h-[200px]">
                                          {MEDICAL_SPECIALTIES.map((specialty) => (
                                            <SelectItem key={specialty} value={specialty}>
                                              {specialty}
                                            </SelectItem>
                                          ))}
                                          <SelectItem value="Outra">Outra</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <FormField
                                control={doctorForm.control}
                                name="isDefault"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>
                                        Profissional Principal
                                      </FormLabel>
                                      <p className="text-sm text-muted-foreground">
                                        Este profissional será sugerido como primeira opção.
                                      </p>
                                    </div>
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDoctorDialogOpen(false)}>
                                  Cancelar
                                </Button>
                                <Button type="submit" disabled={createDoctorMutation.isPending || updateDoctorMutation.isPending}>
                                  {(createDoctorMutation.isPending || updateDoctorMutation.isPending) && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  )}
                                  Salvar
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
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
                                    <Input type="password" {...field} name={field.name} autoComplete="current-password" />
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
                                    <Input type="password" {...field} name={field.name} autoComplete="new-password" />
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
                                    <Input type="password" {...field} name={field.name} autoComplete="new-password" />
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
                          setSettings({ ...settings, emailNotifications: checked })
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
                          setSettings({ ...settings, pushNotifications: checked })
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
                          setSettings({ ...settings, examReminders: checked })
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
                          setSettings({ ...settings, shareDoctors: checked })
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
                          setSettings({ ...settings, anonymousData: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <hr className="my-6 border-gray-200" />

                <h2 className="text-lg font-semibold mb-4 text-gray-800">Idioma e Região</h2>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
                    <Select defaultValue="pt-BR">
                      <SelectTrigger id="language-select">
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
                    <label htmlFor="units-select" className="block text-sm font-medium text-gray-700 mb-1">Unidades de medida</label>
                    <Select defaultValue="metric">
                      <SelectTrigger id="units-select">
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
