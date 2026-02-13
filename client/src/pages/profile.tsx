import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { useMutation } from "@tanstack/react-query";
import { updateUserProfile } from "@/lib/api";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Loader2, Stethoscope, Plus, Trash2, Edit, Star, MoreVertical, ImagePlus, HelpCircle } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  crm: z.string().optional(),
  specialty: z.string().optional(),
  rqe: z.string().optional(),
  address: z.string().optional(),
  professionalPhoto: z.string().optional(),
  clinicName: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  instagram: z.string().optional(),
  languages: z.string().optional(),
  consultationMode: z.string().optional(),
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
const secretarySchema = z.object({
  fullName: z.string().min(3, "Nome da secretária é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type SecretaryFormValues = z.infer<typeof secretarySchema>;

export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const professionalProfile =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, any>).professionalProfile
      : null;



  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phoneNumber: user?.phoneNumber || "",
      crm: user?.crm || "",
      specialty: user?.specialty || "",
      rqe: (user as any)?.rqe || "",
      address: user?.address || "",
      professionalPhoto: professionalProfile?.professionalPhoto || "",
      clinicName: professionalProfile?.clinicName || "",
      bio: professionalProfile?.bio || "",
      website: professionalProfile?.website || "",
      linkedin: professionalProfile?.linkedin || "",
      instagram: professionalProfile?.instagram || "",
      languages: professionalProfile?.languages || "",
      consultationMode: professionalProfile?.consultationMode || "",
    },
  });

  // Reset form when user data changes (e.g., after loading from API)
  useEffect(() => {
    if (user) {
      const prefs = user.preferences && typeof user.preferences === "object"
        ? (user.preferences as Record<string, any>).professionalProfile
        : null;
      profileForm.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        crm: user.crm || "",
        specialty: user.specialty || "",
        rqe: (user as any).rqe || "",
        address: user.address || "",
        professionalPhoto: prefs?.professionalPhoto || "",
        clinicName: prefs?.clinicName || "",
        bio: prefs?.bio || "",
        website: prefs?.website || "",
        linkedin: prefs?.linkedin || "",
        instagram: prefs?.instagram || "",
        languages: prefs?.languages || "",
        consultationMode: prefs?.consultationMode || "",
      });
    }
  }, [user, profileForm]);

  const professionalPhoto = profileForm.watch("professionalPhoto");
  const clinicName = profileForm.watch("clinicName");

  // Profile photo URL from server (separate from the form field)
  const profilePhotoUrl = user?.profilePhotoUrl
    ? `/api/users/profile-photo/${user.id}?t=${Date.now()}`
    : professionalPhoto || null;

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/users/profile-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Erro ao enviar foto');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Foto atualizada", description: "Sua foto de perfil foi atualizada com sucesso." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar foto", description: error.message, variant: "destructive" });
    },
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('DELETE', '/api/users/profile-photo');
      return res;
    },
    onSuccess: () => {
      profileForm.setValue('professionalPhoto', '');
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Foto removida", description: "Sua foto de perfil foi removida." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover foto", description: error.message, variant: "destructive" });
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
    const {
      fullName,
      email,
      phoneNumber,
      crm,
      specialty,
      rqe,
      address,
      clinicName,
      bio,
      website,
      linkedin,
      instagram,
      languages,
      consultationMode,
    } = values;

    const basePreferences =
      user?.preferences && typeof user.preferences === "object"
        ? (user.preferences as Record<string, any>)
        : {};

    const nextPreferences = {
      ...basePreferences,
      professionalProfile: {
        ...(basePreferences as Record<string, any>).professionalProfile,
        clinicName,
        bio,
        website,
        linkedin,
        instagram,
        languages,
        consultationMode,
      },
    };

    updateProfileMutation.mutate({
      fullName,
      email,
      phoneNumber,
      crm,
      specialty,
      rqe,
      address,
      preferences: nextPreferences,
    });
  };

  const onSecuritySubmit = (values: SecurityFormValues) => {
    updatePasswordMutation.mutate(values);
  };

  // Doctor management state and hooks
  const [isDoctorDialogOpen, setIsDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [isSecretaryDialogOpen, setIsSecretaryDialogOpen] = useState(false);

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

  const secretaryForm = useForm<SecretaryFormValues>({
    resolver: zodResolver(secretarySchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: secretaries = [], isLoading: secretariesLoading } = useQuery<any[]>({
    queryKey: ["/api/team/secretaries"],
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

  const createSecretaryMutation = useMutation({
    mutationFn: (data: SecretaryFormValues) => apiRequest("POST", "/api/team/secretaries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/secretaries"] });
      toast({
        title: "Secretária criada",
        description: "O acesso da secretária foi configurado com sucesso.",
      });
      secretaryForm.reset();
      setIsSecretaryDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar secretária",
        description: error.message || "Não foi possível criar o acesso.",
        variant: "destructive",
      });
    },
  });

  const deleteSecretaryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/team/secretaries/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/secretaries"] });
      toast({
        title: "Secretária removida",
        description: "O acesso foi revogado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover secretária",
        description: error.message || "Não foi possível revogar o acesso.",
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

  // Delete Account Mutation
  const [showSecondConfirmation, setShowSecondConfirmation] = useState(false);
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/user");
    },
    onSuccess: () => {
      // Clear all local storage and cookies handled by use-auth but extra check here
      queryClient.clear();
      toast({
        title: "Conta excluída",
        description: "Sua conta foi excluída com sucesso. Sentiremos sua falta.",
      });
      // Redirect to login/home
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message || "Não foi possível excluir sua conta. Tente novamente.",
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

  const onSecretarySubmit = (values: SecretaryFormValues) => {
    createSecretaryMutation.mutate(values);
  };

  const handleAddSecretary = () => {
    secretaryForm.reset({
      fullName: "",
      email: "",
      password: "",
    });
    setIsSecretaryDialogOpen(true);
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
      <MobileHeader />

      <div className="flex flex-1 relative">
        <Sidebar />

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
                  <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-4xl font-semibold overflow-hidden mb-4 sm:mb-0 sm:mr-6">
                    {profilePhotoUrl ? (
                      <img
                        src={profilePhotoUrl}
                        alt={user?.fullName || "Foto do profissional"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      user?.fullName?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || "U"
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{user?.fullName || user?.username}</h2>
                    <p className="text-gray-500">{user?.email}</p>
                    {clinicName && (
                      <p className="text-sm text-gray-500">{clinicName}</p>
                    )}
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
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Dados Profissionais
                    </TabsTrigger>
                    <TabsTrigger
                      value="doctors"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                    >
                      Minha Equipe
                    </TabsTrigger>

                    <TabsTrigger
                      value="security"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                    >
                      Segurança
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="data-[state=active]:border-primary-500 data-[state=active]:text-white data-[state=active]:bg-primary-600 border-b-2 border-transparent rounded-md bg-transparent px-4 py-2 ml-4 text-gray-600 hover:text-gray-800"
                    >
                      Privacidade (LGPD)
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
                            name="crm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CRM / Registro Profissional</FormLabel>
                                <FormControl>
                                  <Input placeholder="123456/UF" {...field} name={field.name} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="specialty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Especialidade</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input
                                      {...field}
                                      list="specialties-list"
                                      placeholder="Selecione ou digite sua especialidade"
                                      autoComplete="off"
                                    />
                                    <datalist id="specialties-list">
                                      {MEDICAL_SPECIALTIES.map((s) => (
                                        <option key={s} value={s} />
                                      ))}
                                    </datalist>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={profileForm.control}
                            name="rqe"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>RQE (Reg. Qualif. Especialista)</FormLabel>
                                <FormControl>
                                  <Input placeholder="12345" {...field} name={field.name} />
                                </FormControl>
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
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input {...field} name={field.name} autoComplete="address-line1" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="mt-8 border-t border-gray-200 pt-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Identidade profissional</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormItem className="md:col-span-2">
                              <FormLabel>Foto profissional</FormLabel>
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                <div className="h-20 w-20 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                  {profilePhotoUrl ? (
                                    <img
                                      src={profilePhotoUrl}
                                      alt="Foto profissional"
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <ImagePlus className="h-6 w-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex flex-1 flex-col gap-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadPhotoMutation.isPending}
                                    onChange={(event) => {
                                      const file = event.target.files?.[0];
                                      if (!file) return;
                                      if (file.size > 5 * 1024 * 1024) {
                                        toast({
                                          title: "Arquivo muito grande",
                                          description: "Envie uma imagem de até 5MB.",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      uploadPhotoMutation.mutate(file);
                                    }}
                                  />
                                  {uploadPhotoMutation.isPending && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Loader2 className="h-3 w-3 animate-spin" /> Enviando foto...
                                    </span>
                                  )}
                                  {profilePhotoUrl && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="w-fit"
                                      disabled={deletePhotoMutation.isPending}
                                      onClick={() => deletePhotoMutation.mutate()}
                                    >
                                      {deletePhotoMutation.isPending ? "Removendo..." : "Remover foto"}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </FormItem>

                            <FormField
                              control={profileForm.control}
                              name="clinicName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Clínica / Consultório</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nome da clínica" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="consultationMode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Atendimento</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    name={field.name}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione a modalidade" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="presencial">Presencial</SelectItem>
                                      <SelectItem value="online">Online</SelectItem>
                                      <SelectItem value="hibrido">Híbrido</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="languages"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Idiomas</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Português, Inglês" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="website"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Site</FormLabel>
                                  <FormControl>
                                    <Input type="url" placeholder="https://seusite.com.br" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="linkedin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>LinkedIn</FormLabel>
                                  <FormControl>
                                    <Input type="url" placeholder="https://linkedin.com/in/seunome" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="instagram"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Instagram</FormLabel>
                                  <FormControl>
                                    <Input type="url" placeholder="https://instagram.com/seuuser" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={profileForm.control}
                              name="bio"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Bio profissional</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Breve descrição da sua atuação, experiência ou áreas de interesse."
                                      className="min-h-[120px]"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
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
                          <h3 className="text-lg font-medium text-gray-900">Minha Equipe</h3>
                          <p className="text-sm text-gray-500">Gerencie os profissionais da sua equipe de atendimento</p>
                        </div>
                        <Button onClick={handleAddDoctor} className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Adicionar Membro
                        </Button>
                      </div>

                      {doctorsLoading ? (
                        <div className="flex justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        </div>
                      ) : doctors.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900">Nenhum membro na equipe</h3>
                          <p className="text-gray-500 mb-4">Adicione secretárias, enfermeiros ou outros profissionais da sua equipe</p>
                          <Button variant="outline" onClick={handleAddDoctor}>
                            Cadastrar primeiro membro
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

                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">Secretária com acesso total</h3>
                            <p className="text-sm text-gray-500">Crie um acesso para quem agenda consultas e administra o sistema.</p>
                          </div>
                          <Button variant="outline" onClick={handleAddSecretary} className="flex items-center gap-2">
                            <Plus className="h-4 w-4" />
                            Adicionar Secretária
                          </Button>
                        </div>

                        {secretariesLoading ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                          </div>
                        ) : secretaries.length === 0 ? (
                          <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                            <p className="text-sm text-gray-500">Nenhuma secretária com acesso total cadastrada.</p>
                          </div>
                        ) : (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {secretaries.map((secretary) => (
                              <div key={secretary.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold">
                                      {secretary.fullName?.[0]?.toUpperCase() || "S"}
                                    </div>
                                    <div>
                                      <h4 className="font-medium text-gray-900">{secretary.fullName}</h4>
                                      <p className="text-sm text-gray-500">{secretary.email}</p>
                                      <Badge variant="secondary" className="mt-2 bg-amber-50 text-amber-700">Acesso total</Badge>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      if (confirm("Deseja remover o acesso desta secretária?")) {
                                        deleteSecretaryMutation.mutate(secretary.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <Dialog open={isSecretaryDialogOpen} onOpenChange={setIsSecretaryDialogOpen}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Adicionar secretária</DialogTitle>
                              <DialogDescription>
                                Este acesso terá controle total do sistema, incluindo agenda e prontuário.
                              </DialogDescription>
                            </DialogHeader>
                            <Form {...secretaryForm}>
                              <form onSubmit={secretaryForm.handleSubmit(onSecretarySubmit)} className="space-y-4">
                                <FormField
                                  control={secretaryForm.control}
                                  name="fullName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nome completo</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Nome da secretária" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={secretaryForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email</FormLabel>
                                      <FormControl>
                                        <Input type="email" placeholder="email@clinica.com" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={secretaryForm.control}
                                  name="password"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Senha</FormLabel>
                                      <FormControl>
                                        <Input type="password" placeholder="Crie uma senha segura" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button type="button" variant="outline" onClick={() => setIsSecretaryDialogOpen(false)}>
                                    Cancelar
                                  </Button>
                                  <Button type="submit" disabled={createSecretaryMutation.isPending}>
                                    {createSecretaryMutation.isPending && (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    )}
                                    Criar acesso
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
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

                    </div>
                  </TabsContent>

                  <TabsContent value="privacy">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Seus Dados e Privacidade (LGPD)</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem total controle sobre suas informações.
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <h4 className="text-blue-800 font-medium mb-2">Direito à Portabilidade</h4>
                          <p className="text-sm text-blue-600 mb-4">
                            Você pode baixar uma cópia completa de todos os seus dados armazenados em nossa plataforma, incluindo prontuários, exames e histórico.
                          </p>
                          <Button
                            variant="outline"
                            className="border-blue-200 text-blue-700 hover:bg-blue-100"
                            onClick={() => window.open('/api/user/export', '_blank')}
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar meus dados (JSON)
                          </Button>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-medium text-red-600 mb-3">Zona de perigo</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            O <strong>Direito ao Esquecimento</strong> permite que você solicite a exclusão completa de sua conta e dados associados.
                          </p>
                          <p className="text-sm text-gray-600 mb-4">Depois de excluir sua conta, todos os seus dados serão permanentemente removidos. Esta ação não pode ser desfeita.</p>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                Excluir minha conta
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta e removerá todos os seus dados de nossos servidores.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setShowSecondConfirmation(true);
                                  }}
                                >
                                  Continuar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog open={showSecondConfirmation} onOpenChange={setShowSecondConfirmation}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">Confirmação Final</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Por favor, confirme novamente. Você perderá acesso a:
                                  <ul className="list-disc list-inside mt-2 mb-2">
                                    <li>Todos os prontuários de pacientes</li>
                                    <li>Histórico de exames e receitas</li>
                                    <li>Configurações personalizadas</li>
                                  </ul>
                                  <strong>Todos os dados serão apagados permanentemente agora.</strong>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setShowSecondConfirmation(false)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                  onClick={() => {
                                    deleteAccountMutation.mutate();
                                    setShowSecondConfirmation(false);
                                  }}
                                >
                                  Sim, excluir tudo permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Settings and Preferences */}
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-1">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Preferências</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Modo Escuro</h3>
                      <p className="text-xs text-gray-500 mt-1">Alternar entre tema claro e escuro</p>
                    </div>
                    <div className="flex items-center">
                      <Switch
                        id="dark-mode"
                        checked={theme === 'dark'}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      />
                    </div>
                  </div>
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
                      <h3 className="text-sm font-medium text-gray-700">Lembretes de consultas</h3>
                      <p className="text-xs text-gray-500 mt-1">Lembretes sobre suas consultas agendadas</p>
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

                <div className="mt-6 flex justify-end">
                  <Button type="button">
                    Salvar preferências
                  </Button>
                </div>

                <hr className="my-6 border-gray-200" />

                {/* Help Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="h-5 w-5 text-primary-600" />
                    <h2 className="text-lg font-semibold text-gray-800">Ajuda</h2>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1" className="border-b border-gray-100">
                      <AccordionTrigger className="text-sm text-left text-gray-700 hover:text-primary-600 hover:no-underline py-3">
                        Como prescrever um medicamento?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        Para prescrever um medicamento, acesse a ficha do paciente e vá até a aba "Receituário". Lá você pode adicionar medicamentos de uso contínuo ou gerar receitas de uso agudo. Basta selecionar o medicamento, preencher a posologia e clicar em "Gerar Receita".
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-2" className="border-b border-gray-100">
                      <AccordionTrigger className="text-sm text-left text-gray-700 hover:text-primary-600 hover:no-underline py-3">
                        Como cadastrar um novo paciente?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        Clique em "Pacientes" no menu lateral e depois em "+ Novo Paciente". Preencha os dados pessoais do paciente e clique em "Salvar". O paciente estará disponível para seleção em sua lista.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-3" className="border-b border-gray-100">
                      <AccordionTrigger className="text-sm text-left text-gray-700 hover:text-primary-600 hover:no-underline py-3">
                        Como fazer upload de exames?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        Acesse a ficha do paciente e vá até a aba "Exames". Clique em "Enviar Exame" e selecione o arquivo PDF do exame. A plataforma irá analisar automaticamente os resultados e destacar valores alterados.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-4" className="border-b border-gray-100">
                      <AccordionTrigger className="text-sm text-left text-gray-700 hover:text-primary-600 hover:no-underline py-3">
                        Como agendar uma consulta?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        Vá até "Agenda" no menu lateral. Clique em uma data e horário disponível ou use o botão "+ Nova Consulta". Selecione o paciente, tipo de atendimento e confirme o agendamento.
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="item-5" className="border-b border-gray-100">
                      <AccordionTrigger className="text-sm text-left text-gray-700 hover:text-primary-600 hover:no-underline py-3">
                        Como emitir uma receita controlada?
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        Ao adicionar um medicamento controlado, o sistema automaticamente identifica o tipo de receita necessária (A, B1, B2 ou C) e gera o documento com o formato adequado, incluindo numeração e campos obrigatórios para identificação do comprador.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Contact Section */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-3">
                      Não encontrou o que procurava? Envie suas dúvidas ou sugestões:
                    </p>
                    <a
                      href="mailto:suporte@vitaview.ai?subject=Dúvida/Sugestão - VitaView AI"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors text-sm font-medium"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Enviar e-mail para suporte
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
