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
import { Separator } from "@/components/ui/separator";
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

type ProfileFormValues = z.infer<typeof profileSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;

import { ImageCropper } from "@/components/profile/image-cropper";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("personal");
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Image cropping state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const professionalProfile =
    user?.preferences && typeof user.preferences === "object"
      ? (user.preferences as Record<string, any>).professionalProfile
      : null;

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropperOpen(true);
      });
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const onCropComplete = async (croppedImageBlob: Blob) => {
    try {
      const file = new File([croppedImageBlob], "profile-photo.jpg", { type: "image/jpeg" });
      await uploadPhotoMutation.mutateAsync(file);
      setIsCropperOpen(false);
      setImageSrc(null);
    } catch (error) {
      console.error("Error uploading cropped image:", error);
    }
  };



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
                  <div className="relative w-24 h-24 mb-4 sm:mb-0 sm:mr-6 group">
                    <div className="w-24 h-24 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-4xl font-semibold overflow-hidden">
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
                    <label
                      htmlFor="profile-photo-upload"
                      className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                    >
                      <ImagePlus className="h-6 w-6" />
                    </label>
                    <input
                      type="file"
                      id="profile-photo-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={onFileChange}
                    />
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

                  <TabsContent value="personal">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Informações Pessoais</h3>
                        <Form {...profileForm}>
                          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome Completo</FormLabel>
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
                                      <Input {...field} type="email" />
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
                            </div>

                            <Separator />

                            <h3 className="text-lg font-medium text-gray-900 mb-3">Dados Profissionais</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="crm"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>CRM / Registro</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
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
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Selecione uma especialidade" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {MEDICAL_SPECIALTIES.map((specialty) => (
                                            <SelectItem key={specialty} value={specialty}>
                                              {specialty}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
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
                                    <FormLabel>RQE</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={profileForm.control}
                                name="clinicName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nome da Clínica/Consultório</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={profileForm.control}
                              name="bio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Biografia Profissional</FormLabel>
                                  <FormControl>
                                    <Textarea {...field} className="min-h-[100px]" placeholder="Conte um pouco sobre sua experiência e formação..." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={profileForm.control}
                                name="website"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Site</FormLabel>
                                    <FormControl>
                                      <Input {...field} placeholder="https://..." />
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
                                      <Input {...field} placeholder="URL do perfil" />
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
                                      <Input {...field} placeholder="@usuario" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <Button type="submit" disabled={updateProfileMutation.isPending}>
                              {updateProfileMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Salvando...
                                </>
                              ) : (
                                "Salvar alterações"
                              )}
                            </Button>
                          </form>
                        </Form>
                      </div>
                    </div>
                  </TabsContent>

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
      <ImageCropper
        imageSrc={imageSrc}
        isOpen={isCropperOpen}
        onClose={() => { setIsCropperOpen(false); setImageSrc(null); }}
        onCropComplete={onCropComplete}
        isLoading={uploadPhotoMutation.isPending}
      />
    </div>
  );
}
