import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useProfiles } from "@/hooks/use-profiles";
import { CID10Selector } from "@/components/cid10-selector";
import { apiRequest } from "@/lib/queryClient";
import { CID10_DATABASE } from "@/data/cid10-database";
import ProfileSwitcher from "@/components/profile-switcher";
import { TriageBadge } from "@/components/triage/triage-badge";
import {
  FileText,
  Calendar,
  Badge as BadgeIcon,
  PlusCircle,
  ClipboardList,
  Activity,
  FileDown,
  Sparkles,
  Loader2,
  Users,
  Save,
  AlertTriangle,
  ShieldCheck,
  Pill,
  Scissors
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DiagnosisDialog,
  MedicationDialog,
  AllergyDialog,
  SurgeryDialog,
  ManageAllergiesDialog,
  DoctorDialog,
  PrescriptionDialog,
  diagnosisSchema,
  medicationSchema,
  allergySchema,
  surgerySchema,
  doctorSchema,
  type DiagnosisFormData,
  type MedicationFormData,
  type AllergyFormData,
  type SurgeryFormData,
  type DoctorFormData
} from "@/components/dialogs";

const habitSchema = z.object({
  habitType: z.enum(["etilismo", "tabagismo", "drogas_ilicitas"]),
  status: z.enum(["nunca", "ex_usuario", "usuario_ativo"]),
  frequency: z.string().optional(),
  quantity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type DiagnosisForm = DiagnosisFormData;
type MedicationForm = MedicationFormData;
type AllergyForm = AllergyFormData;
type SurgeryForm = SurgeryFormData;
type HabitForm = z.infer<typeof habitSchema>;
type DoctorForm = DoctorFormData;

// Função para buscar a descrição do código CID-10
const getCIDDescription = (cidCode: string): string => {
  const cidEntry = CID10_DATABASE.find(item => item.code === cidCode);
  return cidEntry ? `${cidCode} - ${cidEntry.description}` : cidCode;
};

// Helper para formatar texto com negrito (**texto**)
const formatBoldText = (text: string | null | undefined) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        return part;
      })}
    </>
  );
};

interface TimelineItem {
  id: number;
  type: "exam" | "diagnosis" | "surgery" | "evolution" | "triage";
  date: string;
  title: string;
  description?: string;
  cidCode?: string;
  status?: string;
  examType?: string;
  resultSummary?: string;
  originalData?: any;
  text?: string;
  details?: any;
}

interface HealthTrendsNewProps {
  embedded?: boolean;
}

export default function HealthTrendsNew({ embedded = false }: HealthTrendsNewProps = {}) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { activeProfile } = useProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<any>(null);
  const [isAllergyDialogOpen, setIsAllergyDialogOpen] = useState(false);
  const [isManageAllergiesDialogOpen, setIsManageAllergiesDialogOpen] = useState(false);
  const [isEditAllergyDialogOpen, setIsEditAllergyDialogOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<any>(null);
  const [isSurgeryDialogOpen, setIsSurgeryDialogOpen] = useState(false);
  const [isEditSurgeryDialogOpen, setIsEditSurgeryDialogOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<any>(null);
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [isEditHabitDialogOpen, setIsEditHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
  // Removed state moved to PrescriptionDialog: selectedMedicationIds, prescriptionValidityDays, prescriptionObservations, doctorInfo, selectedDoctorId
  const [isDoctorManagementDialogOpen, setIsDoctorManagementDialogOpen] = useState(false);
  const [isDoctorFormDialogOpen, setIsDoctorFormDialogOpen] = useState(false);
  const [isEditDoctorDialogOpen, setIsEditDoctorDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);

  const form = useForm<DiagnosisForm>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      cidCode: "",
      diagnosisDate: "",
      status: undefined,
      notes: "",
    },
  });

  const editForm = useForm<DiagnosisForm>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      cidCode: "",
      diagnosisDate: "",
      status: undefined,
      notes: "",
    },
  });


  const allergyForm = useForm<AllergyForm>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: "",
      allergenType: "medication",
      reaction: "",
      severity: undefined,
      notes: "",
    },
  });

  const editAllergyForm = useForm<AllergyForm>({
    resolver: zodResolver(allergySchema),
    defaultValues: {
      allergen: "",
      allergenType: "medication",
      reaction: "",
      severity: undefined,
      notes: "",
    },
  });

  const surgeryForm = useForm<SurgeryForm>({
    resolver: zodResolver(surgerySchema),
    defaultValues: {
      procedureName: "",
      hospitalName: "",
      surgeonName: "",
      surgeryDate: "",
      notes: "",
    },
  });

  const editSurgeryForm = useForm<SurgeryForm>({
    resolver: zodResolver(surgerySchema),
    defaultValues: {
      procedureName: "",
      hospitalName: "",
      surgeonName: "",
      surgeryDate: "",
      notes: "",
    },
  });

  const habitForm = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      habitType: "etilismo",
      status: "nunca",
      frequency: "",
      quantity: "",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });

  const editHabitForm = useForm<HabitForm>({
    resolver: zodResolver(habitSchema),
    defaultValues: {
      habitType: "etilismo",
      status: "nunca",
      frequency: "",
      quantity: "",
      startDate: "",
      endDate: "",
      notes: "",
    },
  });

  const doctorForm = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      crm: "",
      specialty: "",
      isDefault: false,
    },
  });

  const editDoctorForm = useForm<DoctorForm>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      crm: "",
      specialty: "",
      isDefault: false,
    },
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: diagnoses = [], isLoading: diagnosesLoading } = useQuery<any[]>({
    queryKey: ["/api/diagnoses"],
  });

  const { data: medications = [], isLoading: medicationsLoading } = useQuery<any[]>({
    queryKey: ["/api/medications"],
  });

  const { data: allergies = [], isLoading: allergiesLoading } = useQuery<any[]>({
    queryKey: ["/api/allergies"],
  });

  const { data: surgeries = [], isLoading: surgeriesLoading } = useQuery<any[]>({
    queryKey: ["/api/surgeries"],
  });

  const { data: habits = [] } = useQuery<any[]>({
    queryKey: ["/api/habits"],
  });

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery<any[]>({
    queryKey: ["/api/doctors"],
  });

  const { data: evolutions = [], isLoading: evolutionsLoading } = useQuery<any[]>({
    queryKey: [`/api/evolutions?profileId=${activeProfile?.id}`],
    enabled: !!activeProfile?.id,
  });

  // Query para buscar histórico de triagens do paciente
  const { data: triageHistory = [] } = useQuery<any[]>({
    queryKey: [`/api/triage/history/${activeProfile?.id}`],
    enabled: !!activeProfile?.id,
  });

  // Pegar a triagem mais recente (do dia atual se existir)
  const todayTriage = triageHistory.length > 0 ? triageHistory[0] : null;

  // Mutation para adicionar diagnóstico
  const addDiagnosisMutation = useMutation({
    mutationFn: (data: DiagnosisForm) => apiRequest("POST", "/api/diagnoses", data),
    onSuccess: () => {
      toast({
        title: "Diagnóstico registrado",
        description: "O diagnóstico foi adicionado à sua linha do tempo.",
      });
      form.reset();
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar diagnóstico",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para editar diagnóstico
  const editDiagnosisMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DiagnosisForm }) =>
      apiRequest("PUT", `/api/diagnoses/${id}`, data),
    onSuccess: () => {
      toast({
        title: "Diagnóstico atualizado",
        description: "O diagnóstico foi atualizado com sucesso.",
      });
      setIsEditDialogOpen(false);
      setEditingDiagnosis(null);
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar diagnóstico",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para remover diagnóstico
  const removeDiagnosisMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/diagnoses/${id}`),
    onSuccess: () => {
      toast({
        title: "Diagnóstico removido",
        description: "O diagnóstico foi removido da sua linha do tempo.",
      });
      setIsEditDialogOpen(false);
      setEditingDiagnosis(null);
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover diagnóstico",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });


  // Mutations para alergias
  const addAllergyMutation = useMutation({
    mutationFn: (data: AllergyForm) => apiRequest("POST", "/api/allergies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
      allergyForm.reset();
      setIsAllergyDialogOpen(false);
      toast({
        title: "Alergia registrada",
        description: "Alergia medicamentosa registrada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar alergia. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const editAllergyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AllergyForm }) =>
      apiRequest("PUT", `/api/allergies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
      setEditingAllergy(null);
      setIsEditAllergyDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Alergia atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar alergia. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteAllergyMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/allergies/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/allergies"] });
      toast({
        title: "Sucesso",
        description: "Alergia excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir alergia. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutations para cirurgias
  const addSurgeryMutation = useMutation({
    mutationFn: (data: SurgeryForm) => apiRequest("POST", "/api/surgeries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] });
      surgeryForm.reset();
      setIsSurgeryDialogOpen(false);
      toast({
        title: "Cirurgia registrada",
        description: "Cirurgia registrada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar cirurgia. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const editSurgeryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SurgeryForm }) =>
      apiRequest("PUT", `/api/surgeries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] });
      setEditingSurgery(null);
      setIsEditSurgeryDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Cirurgia atualizada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cirurgia. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteSurgeryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/surgeries/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surgeries"] });
      toast({
        title: "Sucesso",
        description: "Cirurgia excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir cirurgia. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const createHabitMutation = useMutation({
    mutationFn: async (data: HabitForm) => {
      await apiRequest("POST", "/api/habits", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsHabitDialogOpen(false);
      habitForm.reset();
      toast({
        title: "Hábito registrado",
        description: "O hábito foi registrado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao registrar",
        description: "Ocorreu um erro ao registrar o hábito.",
        variant: "destructive",
      });
    },
  });

  const updateHabitMutation = useMutation({
    mutationFn: async (data: HabitForm) => {
      await apiRequest("PUT", `/api/habits/${editingHabit.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      setIsEditHabitDialogOpen(false);
      setEditingHabit(null);
      toast({
        title: "Hábito atualizado",
        description: "O hábito foi atualizado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro ao atualizar o hábito.",
        variant: "destructive",
      });
    },
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/habits/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/habits"] });
      toast({
        title: "Hábito excluído",
        description: "O hábito foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o hábito.",
        variant: "destructive",
      });
    },
  });

  // Doctor mutations
  const createDoctorMutation = useMutation({
    mutationFn: (data: DoctorForm) => apiRequest("POST", "/api/doctors", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Médico cadastrado",
        description: "O médico foi adicionado com sucesso.",
      });
      setIsDoctorFormDialogOpen(false);
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
    mutationFn: ({ id, data }: { id: number; data: DoctorForm }) =>
      apiRequest("PUT", `/api/doctors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/doctors"] });
      toast({
        title: "Médico atualizado",
        description: "Os dados do médico foram atualizados com sucesso.",
      });
      setIsEditDoctorDialogOpen(false);
      setEditingDoctor(null);
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
        title: "Médico removido",
        description: "O médico foi removido com sucesso.",
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
        title: "Médico padrão definido",
        description: "Este médico foi definido como padrão.",
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


  const timelineItems: TimelineItem[] = [
    ...(Array.isArray(exams) ? exams.map((exam: any) => {
      const originalContent = exam.originalContent ? JSON.parse(exam.originalContent) : null;
      const examType = originalContent?.examType || "Exame de laboratório";
      const labName = originalContent?.laboratoryName || exam.laboratoryName || "laboratório";

      // Extrair informações das métricas para criar um resumo útil
      let resultSummary = "";
      if (originalContent?.healthMetrics?.length) {
        const metrics = originalContent.healthMetrics;
        const abnormalMetrics = metrics.filter((m: any) => m.status === "alto" || m.status === "baixo");

        if (abnormalMetrics.length > 0) {
          const keyFindings = abnormalMetrics.slice(0, 2).map((m: any) =>
            `${m.name}: ${m.value}${m.unit || ""} (${m.status})`
          );
          resultSummary = keyFindings.join(", ");
          if (abnormalMetrics.length > 2) {
            resultSummary += ` e mais ${abnormalMetrics.length - 2} alterações`;
          }
        } else {
          const normalCount = metrics.filter((m: any) => m.status === "normal").length;
          resultSummary = `${normalCount} parâmetros dentro da normalidade`;
        }
      }

      return {
        id: exam.id,
        type: "exam" as const,
        date: exam.examDate || exam.uploadDate || exam.uploadedAt || exam.createdAt,
        title: exam.name || exam.title || "Exame",
        description: `${examType} realizado no ${labName}`,
        examType: examType,
        resultSummary: resultSummary || `${originalContent?.healthMetrics?.length || 0} métricas analisadas`,
      };
    }) : []),
    ...(Array.isArray(diagnoses) ? diagnoses.map((diagnosis: any) => ({
      id: diagnosis.id,
      type: "diagnosis" as const,
      date: diagnosis.diagnosisDate,
      title: getCIDDescription(diagnosis.cidCode) || "Diagnóstico",
      description: diagnosis.notes,
      cidCode: diagnosis.cidCode,
      status: diagnosis.status,
      originalData: diagnosis,
    })) : []),
    ...(Array.isArray(surgeries) ? surgeries.map((surgery: any) => ({
      id: surgery.id,
      type: "surgery" as const,
      date: surgery.surgeryDate,
      title: surgery.procedureName || "Cirurgia",
      description: `${surgery.hospitalName ? `Hospital: ${surgery.hospitalName}` : ""} ${surgery.surgeonName ? `| Cirurgião: ${surgery.surgeonName}` : ""}`,
      originalData: surgery,
    })) : []),

    ...(Array.isArray(evolutions) ? evolutions.map((evolution: any) => ({
      id: evolution.id,
      type: "evolution" as const,
      date: evolution.date,
      title: "Evolução Médica",
      description: evolution.text,
      originalData: evolution,
    })) : []),

  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const onSubmit = (data: DiagnosisForm) => {
    addDiagnosisMutation.mutate(data);
  };

  const onEditSubmit = (data: DiagnosisForm) => {
    if (editingDiagnosis) {
      editDiagnosisMutation.mutate({ id: editingDiagnosis.id, data });
    }
  };

  const openEditDialog = (diagnosis: any) => {
    setEditingDiagnosis(diagnosis);
    editForm.reset({
      cidCode: diagnosis.cidCode || "",
      diagnosisDate: diagnosis.diagnosisDate || "",
      status: diagnosis.status || undefined,
      notes: diagnosis.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleRemoveDiagnosis = () => {
    if (editingDiagnosis && confirm("Deseja remover este diagnóstico?")) {
      removeDiagnosisMutation.mutate(editingDiagnosis.id);
    }
  };


  // Funções para alergias
  const onAllergySubmit = (data: AllergyForm) => {
    addAllergyMutation.mutate(data);
  };

  const onEditAllergySubmit = (data: AllergyForm) => {
    if (editingAllergy) {
      editAllergyMutation.mutate({ id: editingAllergy.id, data });
    }
  };

  const openEditAllergyDialog = (allergy: any) => {
    setEditingAllergy(allergy);
    editAllergyForm.reset({
      allergen: allergy.allergen || "",
      allergenType: allergy.allergen_type || "medication",
      reaction: allergy.reaction || "",
      severity: allergy.severity || undefined,
      notes: allergy.notes || "",
    });
    setIsEditAllergyDialogOpen(true);
  };

  const handleRemoveAllergy = (id: number) => {
    if (confirm("Deseja remover esta alergia?")) {
      deleteAllergyMutation.mutate(id);
    }
  };

  // Funções para cirurgias
  const onSurgerySubmit = (data: SurgeryForm) => {
    addSurgeryMutation.mutate(data);
  };

  const onEditSurgerySubmit = (data: SurgeryForm) => {
    if (editingSurgery) {
      editSurgeryMutation.mutate({ id: editingSurgery.id, data });
    }
  };

  const openEditSurgeryDialog = (surgery: any) => {
    setEditingSurgery(surgery);
    editSurgeryForm.reset({
      procedureName: surgery.procedureName || "",
      hospitalName: surgery.hospitalName || "",
      surgeonName: surgery.surgeonName || "",
      surgeryDate: surgery.surgeryDate || "",
      notes: surgery.notes || "",
    });
    setIsEditSurgeryDialogOpen(true);
  };

  const handleRemoveSurgery = (id: number) => {
    if (confirm("Deseja remover esta cirurgia?")) {
      deleteSurgeryMutation.mutate(id);
    }
  };

  const onHabitSubmit = (data: HabitForm) => {
    createHabitMutation.mutate(data);
  };

  const onEditHabitSubmit = (data: HabitForm) => {
    updateHabitMutation.mutate(data);
  };

  const handleEditHabit = (habit: any) => {
    setEditingHabit(habit);
    editHabitForm.reset({
      habitType: habit.habitType,
      status: habit.status,
      frequency: habit.frequency || "",
      quantity: habit.quantity || "",
      startDate: habit.startDate || "",
      endDate: habit.endDate || "",
      notes: habit.notes || "",
    });
    setIsEditHabitDialogOpen(true);
  };

  const handleRemoveHabit = (id: number) => {
    if (confirm("Deseja remover este hábito?")) {
      deleteHabitMutation.mutate(id);
    }
  };


  const onDoctorSubmit = (data: DoctorForm) => {
    createDoctorMutation.mutate(data);
  };




  const diagnosesCount = Array.isArray(diagnoses) ? diagnoses.length : 0;
  const medicationsCount = Array.isArray(medications) ? medications.length : 0;
  const allergiesCount = Array.isArray(allergies) ? allergies.length : 0;
  const surgeriesCount = Array.isArray(surgeries) ? surgeries.length : 0;
  const summaryHighlights = [
    { label: "Diagnósticos registrados", value: diagnosesCount },
    { label: "Medicamentos ativos", value: medicationsCount },
    { label: "Alergias registradas", value: allergiesCount },
    { label: "Cirurgias realizadas", value: surgeriesCount }
  ];
  const profileName = activeProfile?.name || "seu paciente";
  const hasRecordData = summaryHighlights.some((item) => item.value > 0);

  // Função para exportar dados para PDF
  const handleExportToPDF = async () => {
    const newTab = window.open('', '_blank');
    if (newTab) {
      newTab.document.write('<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div>Gerando Relatório de Saúde...</div></body></html>');
    }

    try {
      const response = await apiRequest("POST", "/api/export-health-report", {});

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        if (newTab) newTab.location.href = url;
        else window.open(url, '_blank');

        toast({
          title: "Relatório gerado",
          description: "Seu relatório de saúde foi aberto em uma nova aba.",
        });
      } else {
        newTab?.close();
        throw new Error("Erro ao gerar relatório");
      }
    } catch (error) {
      newTab?.close();
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ativo": return "bg-red-100 text-red-800";
      case "em_tratamento": return "bg-orange-100 text-orange-800";
      case "resolvido": return "bg-green-100 text-green-800";
      case "cronico": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "ativo": return "Ativo";
      case "em_tratamento": return "Em Tratamento";
      case "resolvido": return "Resolvido";
      case "cronico": return "Crônico";
      default: return status;
    }
  };

  if (examsLoading || diagnosesLoading || medicationsLoading) {
    if (embedded) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-50">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      );
    }
    return (
      <div className="min-h-screen flex flex-col">
        <MobileHeader />
        <div className="flex flex-1 relative">
          <Sidebar />
          <main className="flex-1 bg-gray-50">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }


  return (
    <div className={`min-h-screen flex flex-col ${embedded ? 'bg-gray-50 !min-h-0' : ''}`}>
      {!embedded && <MobileHeader />}

      <div className={`flex flex-1 relative ${embedded ? 'block' : ''}`}>
        {!embedded && <Sidebar />}

        <main className="flex-1 bg-gray-50">
          <div className={embedded ? "" : "p-4 md:p-6"}>
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header com Nome do Paciente */}
              {!embedded && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                      Prontuário do Paciente
                    </h1>
                    <div className="flex items-center gap-4">
                      <ProfileSwitcher />
                      <div className="flex items-center gap-2">
                        {allergies.length > 0 ? (
                          <span className="text-red-600 font-medium">
                            Alérgico a {allergies.map((a: any) => a.allergen).join(", ")}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            Nega alergias
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-400 hover:text-gray-600"
                          onClick={() => setIsManageAllergiesDialogOpen(true)}
                          title="Gerenciar alergias"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => setLocation("/bulk-import")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Importar Pacientes
                    </Button>
                    <Badge variant="outline" className="px-3 py-1 text-sm bg-white">
                      {timelineItems.length} registros
                    </Badge>
                  </div>
                </div>
              )}
              {embedded && allergies.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-red-600 font-medium text-sm bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                      Alérgico a {allergies.map((a: any) => a.allergen).join(", ")}
                    </span>
                  </div>
                </div>
              )}





              <div className="grid gap-8 md:grid-cols-[1fr,360px]">
                {/* Coluna Principal */}
                <div className="space-y-8">

                  {/* Linha do Tempo */}
                  <div className="space-y-6 pb-12">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Linha do Tempo Clínica</h3>
                          <p className="text-sm text-gray-500">Histórico cronológico de eventos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {embedded && (
                          <Button variant="ghost" size="sm" className="text-gray-500" onClick={handleExportToPDF}>
                            <FileText className="w-4 h-4 mr-2" /> PDF
                          </Button>
                        )}
                        <Badge variant="outline" className="text-gray-600 bg-white border-gray-200 px-3 py-1">
                          {timelineItems.length} registros
                        </Badge>
                      </div>
                    </div>

                    <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-4">
                      {timelineItems.length > 0 ? timelineItems.map((item, index) => (
                        <div key={`${item.type}-${item.id}-${index}`} className="relative pl-8 group">
                          {/* Dot on the line */}
                          <div className={`absolute -left-[9px] top-1.5 h-5 w-5 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${item.type === 'exam' ? 'bg-gray-500' :
                            item.type === 'diagnosis' ? 'bg-red-500' :
                              item.type === 'surgery' ? 'bg-purple-500' :
                                item.type === 'triage' ? 'bg-blue-500' :
                                  'bg-green-500'
                            }`} />

                          <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-indigo-100">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="space-y-2 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="secondary" className={`${item.type === 'exam' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                      item.type === 'diagnosis' ? 'bg-red-50 text-red-700 border-red-100' :
                                        item.type === 'surgery' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                          item.type === 'triage' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-green-50 text-green-700 border-green-100'
                                      }`}>
                                      {item.type === 'exam' ? 'Exame' :
                                        item.type === 'diagnosis' ? 'Diagnóstico' :
                                          item.type === 'surgery' ? 'Cirurgia' :
                                            item.type === 'triage' ? 'Triagem/Anamnese' :
                                              'Evolução'}
                                    </Badge>
                                    <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(parseISO(item.date), "dd 'de' MMMM, yyyy 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                  </div>

                                  <div>
                                    <h4 className="text-lg font-bold text-gray-900 leading-tight">{item.title}</h4>

                                    {/* Different content rendering based on type */}
                                    {item.type === 'triage' && item.details ? (
                                      <div className="text-sm mt-3 space-y-3">
                                        {item.description && (
                                          <div className="text-gray-700 font-medium">{formatBoldText(item.description)}</div>
                                        )}

                                        {item.details.history && (
                                          <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100">
                                            <span className="font-semibold text-blue-800 block mb-1 text-xs uppercase tracking-wider">História da Doença Atual</span>
                                            <div className="text-gray-700 whitespace-pre-line leading-relaxed">{formatBoldText(item.details.history)}</div>
                                          </div>
                                        )}

                                        {item.details.vitals && Object.values(item.details.vitals).some(v => v) && (
                                          <div>
                                            <span className="font-semibold text-gray-500 block mb-1.5 text-xs uppercase tracking-wider">Sinais Vitais</span>
                                            <div className="flex flex-wrap gap-2">
                                              {item.details.vitals.bp && <Badge variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">PA: {item.details.vitals.bp}</Badge>}
                                              {item.details.vitals.hr && <Badge variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">FC: {item.details.vitals.hr}</Badge>}
                                              {item.details.vitals.temp && <Badge variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">Temp: {item.details.vitals.temp}</Badge>}
                                              {item.details.vitals.spo2 && <Badge variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">SpO2: {item.details.vitals.spo2}</Badge>}
                                              {item.details.vitals.hgt && <Badge variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">Glicemia: {item.details.vitals.hgt}</Badge>}
                                              {item.details.painScale !== null && <Badge variant="outline" className="bg-slate-50 text-slate-700 hover:bg-slate-100">Dor: {item.details.painScale}/10</Badge>}
                                            </div>
                                          </div>
                                        )}

                                        {item.details.notes && (
                                          <div className="text-gray-600 text-xs italic border-t border-gray-100 pt-2 mt-2">
                                            Obs: {formatBoldText(item.details.notes)}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-gray-600 mt-1 whitespace-pre-line">
                                        {formatBoldText(item.description)}
                                        {/* Show professional name for evolutions */}
                                        {item.type === 'evolution' && item.originalData?.professionalName && (
                                          <div className="mt-3 pt-2 border-t border-gray-100 text-xs text-gray-400 italic text-right">
                                            — {item.originalData.professionalName}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {item.resultSummary && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm border border-gray-100 flex items-start gap-2">
                                      <Activity className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <span className="font-medium text-gray-700">Resumo: </span>
                                        <span className="text-gray-600">{item.resultSummary}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {item.type === 'diagnosis' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(item.originalData)}
                                    className="self-start text-gray-400 hover:text-gray-900"
                                  >
                                    Editar
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))
                        : (
                          <div className="pl-8 py-8">
                            <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                              <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                              <h3 className="text-lg font-medium text-gray-900">Nenhum registro na linha do tempo</h3>
                              <p className="text-gray-500 mt-1">
                                Adicione diagnósticos ou exames para visualizar o histórico clínico aqui.
                              </p>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div > {/* End Left Column */}

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">




                </div>
              </div >
            </div >
          </div >
        </main >

        {/* Dialogs de Diagnóstico */}
        <DiagnosisDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          form={form}
          onSubmit={onSubmit}
          isPending={addDiagnosisMutation.isPending}
          mode="create"
        />

        <DiagnosisDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          form={editForm}
          onSubmit={onEditSubmit}
          isPending={editDiagnosisMutation.isPending}
          mode="edit"
          onRemove={handleRemoveDiagnosis}
          isRemovePending={removeDiagnosisMutation.isPending}
        />


        {/* Dialogs de Alergia */}
        <AllergyDialog
          open={isAllergyDialogOpen}
          onOpenChange={setIsAllergyDialogOpen}
          form={allergyForm}
          onSubmit={onAllergySubmit}
          isPending={addAllergyMutation.isPending}
          mode="create"
        />

        <AllergyDialog
          open={isEditAllergyDialogOpen}
          onOpenChange={setIsEditAllergyDialogOpen}
          form={editAllergyForm}
          onSubmit={onEditAllergySubmit}
          isPending={editAllergyMutation.isPending}
          mode="edit"
          onRemove={() => editingAllergy && handleRemoveAllergy(editingAllergy.id)}
          isRemovePending={deleteAllergyMutation.isPending}
        />

        <ManageAllergiesDialog
          open={isManageAllergiesDialogOpen}
          onOpenChange={setIsManageAllergiesDialogOpen}
          allergies={allergies}
          onEdit={(allergy) => openEditAllergyDialog(allergy)}
          onRemove={handleRemoveAllergy}
          onAdd={() => setIsAllergyDialogOpen(true)}
        />

        {/* Dialogs de Cirurgia */}
        <SurgeryDialog
          open={isSurgeryDialogOpen}
          onOpenChange={setIsSurgeryDialogOpen}
          form={surgeryForm}
          onSubmit={onSurgerySubmit}
          isPending={addSurgeryMutation.isPending}
          mode="create"
        />

        <SurgeryDialog
          open={isEditSurgeryDialogOpen}
          onOpenChange={setIsEditSurgeryDialogOpen}
          form={editSurgeryForm}
          onSubmit={onEditSurgerySubmit}
          isPending={editSurgeryMutation.isPending}
          mode="edit"
          onRemove={() => editingSurgery && handleRemoveSurgery(editingSurgery.id)}
          isRemovePending={deleteSurgeryMutation.isPending}
        />

        {/* Dialog de Prescrição */}
        <PrescriptionDialog
          open={isPrescriptionDialogOpen}
          onOpenChange={setIsPrescriptionDialogOpen}
          doctors={doctors}
          medications={medications}
          onOpenDoctorForm={() => setIsDoctorFormDialogOpen(true)}
        />

        {/* Dialog de Médico */}
        <DoctorDialog
          open={isDoctorFormDialogOpen}
          onOpenChange={setIsDoctorFormDialogOpen}
          form={doctorForm}
          onSubmit={onDoctorSubmit}
          isPending={createDoctorMutation.isPending}
        />

      </div >
    </div >
  );
}
