import { useState } from "react";
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
  ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const diagnosisSchema = z.object({
  cidCode: z.string().min(1, "Código CID-10 é obrigatório"),
  diagnosisDate: z.string().min(1, "Data é obrigatória"),
  status: z.enum(["ativo", "em_tratamento", "resolvido", "cronico"]).optional(),
  notes: z.string().optional(),
});

const medicationSchema = z.object({
  name: z.string().min(1, "Nome do medicamento é obrigatório"),
  format: z.string().min(1, "Formato é obrigatório"),
  dosage: z.string().min(1, "Dosagem é obrigatória"),
  frequency: z.string().min(1, "Frequência é obrigatória"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  notes: z.string().optional(),
});

const allergySchema = z.object({
  allergen: z.string().min(1, "Nome do alérgeno é obrigatório"),
  allergenType: z.string().default("medication"),
  reaction: z.string().optional(),
  severity: z.enum(["leve", "moderada", "grave"]).optional(),
  notes: z.string().optional(),
});

const surgerySchema = z.object({
  procedureName: z.string().min(1, "Nome do procedimento é obrigatório"),
  hospitalName: z.string().optional(),
  surgeonName: z.string().optional(),
  surgeryDate: z.string().min(1, "Data da cirurgia é obrigatória"),
  notes: z.string().optional(),
});

const habitSchema = z.object({
  habitType: z.enum(["etilismo", "tabagismo", "drogas_ilicitas"]),
  status: z.enum(["nunca", "ex_usuario", "usuario_ativo"]),
  frequency: z.string().optional(),
  quantity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type DiagnosisForm = z.infer<typeof diagnosisSchema>;
type MedicationForm = z.infer<typeof medicationSchema>;
type AllergyForm = z.infer<typeof allergySchema>;
type SurgeryForm = z.infer<typeof surgerySchema>;
type HabitForm = z.infer<typeof habitSchema>;

// Função para buscar a descrição do código CID-10
const getCIDDescription = (cidCode: string): string => {
  const cidEntry = CID10_DATABASE.find(item => item.code === cidCode);
  return cidEntry ? `${cidCode} - ${cidEntry.description}` : cidCode;
};

interface TimelineItem {
  id: number;
  type: "exam" | "diagnosis" | "surgery" | "evolution";
  date: string;
  title: string;
  description?: string;
  cidCode?: string;
  status?: string;
  examType?: string;
  resultSummary?: string;
  originalData?: any;
  text?: string;
}

export default function HealthTrendsNew() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { activeProfile } = useProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<any>(null);
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
  const [isEditMedicationDialogOpen, setIsEditMedicationDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);
  const [isAllergyDialogOpen, setIsAllergyDialogOpen] = useState(false);
  const [isEditAllergyDialogOpen, setIsEditAllergyDialogOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<any>(null);
  const [isSurgeryDialogOpen, setIsSurgeryDialogOpen] = useState(false);
  const [isEditSurgeryDialogOpen, setIsEditSurgeryDialogOpen] = useState(false);
  const [editingSurgery, setEditingSurgery] = useState<any>(null);
  const [isHabitDialogOpen, setIsHabitDialogOpen] = useState(false);
  const [isEditHabitDialogOpen, setIsEditHabitDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
  const [selectedMedicationIds, setSelectedMedicationIds] = useState<number[]>([]);
  const [prescriptionValidityDays, setPrescriptionValidityDays] = useState(30);
  const [prescriptionObservations, setPrescriptionObservations] = useState("");
  const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "", specialty: "" });
  const [anamnesisText, setAnamnesisText] = useState("");
  const [extractedRecord, setExtractedRecord] = useState<any | null>(null);
  const [isApplyingExtraction, setIsApplyingExtraction] = useState(false);

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

  const medicationForm = useForm<MedicationForm>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      format: "",
      dosage: "",
      frequency: "",
      startDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      notes: "",
    },
  });

  const editMedicationForm = useForm<MedicationForm>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: "",
      format: "",
      dosage: "",
      frequency: "",
      startDate: "",
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

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: diagnoses = [], isLoading: diagnosesLoading } = useQuery({
    queryKey: ["/api/diagnoses"],
  });

  const { data: medications = [], isLoading: medicationsLoading } = useQuery({
    queryKey: ["/api/medications"],
  });

  const { data: allergies = [], isLoading: allergiesLoading } = useQuery<any[]>({
    queryKey: ["/api/allergies"],
  });

  const { data: surgeries = [], isLoading: surgeriesLoading } = useQuery({
    queryKey: ["/api/surgeries"],
  });

  const { data: habits = [] } = useQuery<any[]>({
    queryKey: ["/api/habits"],
  });

  const { data: evolutions = [], isLoading: evolutionsLoading } = useQuery({
    queryKey: ["/api/evolutions"],
  });

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

  // Mutations para medicamentos
  const addMedicationMutation = useMutation({
    mutationFn: (data: MedicationForm) => apiRequest("POST", "/api/medications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      medicationForm.reset();
      setIsMedicationDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Medicamento adicionado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao adicionar medicamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const editMedicationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MedicationForm }) =>
      apiRequest("PUT", `/api/medications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      editMedicationForm.reset();
      setIsEditMedicationDialogOpen(false);
      setEditingMedication(null);
      toast({
        title: "Sucesso",
        description: "Medicamento atualizado com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar medicamento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteMedicationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/medications/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
      toast({
        title: "Sucesso",
        description: "Medicamento excluído com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir medicamento. Tente novamente.",
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

  const addEvolutionMutation = useMutation({
    mutationFn: (data: { text: string; date?: string }) => apiRequest("POST", "/api/evolutions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evolutions"] });
      toast({
        title: "Consulta registrada",
        description: "Histórico salvo com sucesso!",
      });
      setAnamnesisText("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao salvar consulta. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const deleteEvolutionMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/evolutions/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evolutions"] });
      toast({
        title: "Sucesso",
        description: "Evolução excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir evolução. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const analyzeAnamnesisMutation = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      const res = await apiRequest("POST", "/api/patient-record/analyze", { text });
      return await res.json();
    },
    onSuccess: (data) => {
      setExtractedRecord(data);
      toast({
        title: "Anamnese analisada",
        description: "Identificamos diagnósticos, medicamentos e alergias a partir do texto.",
      });
      // Automatically apply extraction
      handleApplyExtraction(data);
      // Refresh evolutions to show the new one
      queryClient.invalidateQueries({ queryKey: ["/api/evolutions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na análise",
        description: error?.message || "Não foi possível interpretar o texto.",
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
      title: "Consulta/Anamnese",
      description: evolution.text,
      originalData: evolution,
    })) : [])
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

  // Handlers para medicamentos
  const onMedicationSubmit = (data: MedicationForm) => {
    addMedicationMutation.mutate(data);
  };

  const onEditMedicationSubmit = (data: MedicationForm) => {
    if (editingMedication) {
      editMedicationMutation.mutate({ id: editingMedication.id, data });
    }
  };

  const openEditMedicationDialog = (medication: any) => {
    setEditingMedication(medication);
    editMedicationForm.reset({
      name: medication.name || "",
      format: medication.format || "",
      dosage: medication.dosage || "",
      frequency: medication.frequency || "",
      startDate: medication.start_date || medication.startDate || "",
      notes: medication.notes || "",
    });
    setIsEditMedicationDialogOpen(true);
  };

  const handleRemoveMedication = (id: number) => {
    if (confirm("Deseja remover este medicamento?")) {
      deleteMedicationMutation.mutate(id);
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

  const handleAnalyzeAnamnesis = () => {
    if (!anamnesisText.trim()) {
      toast({
        title: "Anamnese vazia",
        description: "Descreva o quadro clínico antes de solicitar a análise.",
        variant: "destructive",
      });
      return;
    }
    analyzeAnamnesisMutation.mutate({ text: anamnesisText.trim() });
  };

  const handleResetAnamnesis = () => {
    setAnamnesisText("");
    setExtractedRecord(null);
  };

  const handleApplyExtraction = async (recordToApply?: any) => {
    const record = recordToApply || extractedRecord;
    if (!record) return;
    setIsApplyingExtraction(true);
    const today = new Date().toISOString().split("T")[0];
    const created = { diagnoses: 0, medications: 0, allergies: 0 };

    try {
      for (const diagnosis of record.diagnoses || []) {
        if (!diagnosis?.cidCode) continue;
        await apiRequest("POST", "/api/diagnoses", {
          cidCode: diagnosis.cidCode,
          diagnosisDate: diagnosis.diagnosisDate || today,
          status: diagnosis.status || "ativo",
          notes: diagnosis.notes || diagnosis.description || null,
        });
        created.diagnoses += 1;
      }

      for (const medication of record.medications || []) {
        if (!medication?.name) continue;
        await apiRequest("POST", "/api/medications", {
          name: medication.name,
          format: medication.format || "comprimido",
          dosage: medication.dosage || medication.dose || "dose a confirmar",
          frequency: medication.frequency || "1x ao dia",
          notes: medication.notes || null,
          startDate: medication.startDate || today,
          isActive: medication.isActive !== false,
        });
        created.medications += 1;
      }

      for (const allergy of record.allergies || []) {
        if (!allergy?.allergen) continue;
        await apiRequest("POST", "/api/allergies", {
          allergen: allergy.allergen,
          allergenType: allergy.allergenType || "medication",
          reaction: allergy.reaction || null,
          severity: allergy.severity || null,
          notes: allergy.notes || null,
        });
        created.allergies += 1;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/medications"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/allergies"] }),
      ]);

      toast({
        title: "Prontuário atualizado",
        description: `Dados aplicados: ${created.diagnoses} diagnósticos, ${created.medications} medicamentos, ${created.allergies} alergias.`,
      });
      setExtractedRecord(null);
      setAnamnesisText("");
    } catch (error: any) {
      toast({
        title: "Falha ao salvar dados",
        description: error?.message || "Revise o texto ou tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingExtraction(false);
    }
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
    try {
      const response = await apiRequest("POST", "/api/export-health-report", {});

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `relatorio-saude-${format(new Date(), "yyyy-MM-dd")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Relatório exportado",
          description: "Seu relatório de saúde foi gerado e baixado com sucesso!",
        });
      } else {
        throw new Error("Erro ao gerar relatório");
      }
    } catch (error) {
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
    <div className="min-h-screen flex flex-col">
      <MobileHeader />

      <div className="flex flex-1 relative">
        <Sidebar />

        <main className="flex-1 bg-gray-50">
          <div className="p-4 md:p-6">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header com Nome do Paciente */}
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
                        onClick={() => setIsAllergyDialogOpen(true)}
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





              <div className="grid gap-8 md:grid-cols-[1fr,360px]">
                {/* Coluna Principal */}
                <div className="space-y-8">

                  <Card className="border border-primary-100 shadow-md">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-2xl text-gray-900">Anamnese inteligente</CardTitle>
                        <CardDescription>
                          Descreva o quadro clínico e deixe a IA identificar diagnósticos, comorbidades, medicamentos e alergias.
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-primary-50 text-primary-700 border-primary-200">Beta</Badge>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Textarea
                        value={anamnesisText}
                        onChange={(event) => setAnamnesisText(event.target.value)}
                        placeholder="Ex.: Paciente em acompanhamento por hipertensão controlada com losartana 50mg, histórico familiar de diabetes, refere alergia a penicilina..."
                        className="min-h-[140px] resize-vertical"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <Button
                          type="button"
                          onClick={() => {
                            if (!anamnesisText.trim()) {
                              toast({
                                title: "Texto vazio",
                                description: "Escreva algo para salvar.",
                                variant: "destructive"
                              });
                              return;
                            }
                            addEvolutionMutation.mutate({ text: anamnesisText });
                          }}
                          disabled={addEvolutionMutation.isPending || !anamnesisText.trim()}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          {addEvolutionMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Salvar como Consulta
                        </Button>
                        <Button
                          type="button"
                          onClick={handleAnalyzeAnamnesis}
                          disabled={analyzeAnamnesisMutation.isPending}
                          className="gap-2"
                        >
                          {analyzeAnamnesisMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Extrair dados com IA
                        </Button>
                        <Button type="button" variant="ghost" onClick={handleResetAnamnesis} disabled={!anamnesisText && !extractedRecord}>
                          Limpar texto
                        </Button>
                        <p className="text-sm text-gray-500">
                          A IA sugere registros prontos que você pode aplicar ao prontuário em um clique.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {
                    extractedRecord && (
                      <Card className="border-primary-200 bg-white shadow-lg">
                        <CardHeader>
                          <CardTitle className="text-2xl text-gray-900">Insights identificados</CardTitle>
                          <CardDescription>{extractedRecord.summary || "Revisão automática da anamnese"}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {Array.isArray(extractedRecord.comorbidities) && extractedRecord.comorbidities.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {extractedRecord.comorbidities.map((item: string, index: number) => (
                                <span key={`${item}-${index}`} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="grid gap-4 md:grid-cols-3">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Diagnósticos sugeridos</p>
                              {Array.isArray(extractedRecord.diagnoses) && extractedRecord.diagnoses.length > 0 ? (
                                <div className="space-y-2">
                                  {extractedRecord.diagnoses.map((diagnosis: any, index: number) => (
                                    <div key={`diag-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                                      <p className="font-semibold text-gray-900">{diagnosis.cidCode || diagnosis.condition || "Diagnóstico sugerido"}</p>
                                      {diagnosis.notes && <p className="text-xs text-gray-600 mt-1">{diagnosis.notes}</p>}
                                      <Badge className="mt-2 w-fit" variant="secondary">{diagnosis.status || "avaliar"}</Badge>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Nenhum diagnóstico identificado.</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Medicamentos em uso</p>
                              {Array.isArray(extractedRecord.medications) && extractedRecord.medications.length > 0 ? (
                                <div className="space-y-2">
                                  {extractedRecord.medications.map((medication: any, index: number) => (
                                    <div key={`med-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                                      <p className="font-semibold text-gray-900">{medication.name}</p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {medication.dosage || medication.dose || "dosagem não informada"} · {medication.frequency || "frequência não informada"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Sem medicamentos detectados.</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Alergias</p>
                              {Array.isArray(extractedRecord.allergies) && extractedRecord.allergies.length > 0 ? (
                                <div className="space-y-2">
                                  {extractedRecord.allergies.map((allergy: any, index: number) => (
                                    <div key={`allergy-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
                                      <p className="font-semibold text-gray-900">{allergy.allergen}</p>
                                      <p className="text-xs text-gray-600 mt-1">
                                        {allergy.severity ? `Gravidade: ${allergy.severity}` : "Gravidade não informada"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Nenhuma alergia identificada.</p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <p className="text-sm text-gray-500">
                              Revise os dados sugeridos e aplique ao prontuário para usar imediatamente em novas análises.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button type="button" variant="ghost" onClick={handleResetAnamnesis}>
                                Descartar
                              </Button>
                              <Button
                                type="button"
                                className="gap-2"
                                onClick={handleApplyExtraction}
                                disabled={isApplyingExtraction}
                              >
                                {isApplyingExtraction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                Aplicar ao prontuário
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }
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
                      <Badge variant="outline" className="text-gray-600 bg-white border-gray-200 px-3 py-1">
                        {timelineItems.length} registros
                      </Badge>
                    </div>

                    <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8 pb-4">
                      {timelineItems.length > 0 ? (
                        timelineItems.map((item, index) => (
                          <div key={`${item.type}-${item.id}-${index}`} className="relative pl-8 group">
                            {/* Dot on the line */}
                            <div className={`absolute -left-[9px] top-1.5 h-5 w-5 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${item.type === 'exam' ? 'bg-blue-500' :
                              item.type === 'diagnosis' ? 'bg-red-500' :
                                item.type === 'surgery' ? 'bg-purple-500' :
                                  'bg-green-500'
                              }`} />

                            <Card className="border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 group-hover:border-indigo-100">
                              <CardContent className="p-4">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge variant="secondary" className={`${item.type === 'exam' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                        item.type === 'diagnosis' ? 'bg-red-50 text-red-700 border-red-100' :
                                          item.type === 'surgery' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            'bg-green-50 text-green-700 border-green-100'
                                        }`}>
                                        {item.type === 'exam' ? 'Exame' : item.type === 'diagnosis' ? 'Diagnóstico' : item.type === 'surgery' ? 'Cirurgia' : 'Consulta'}
                                      </Badge>
                                      <span className="text-sm font-medium text-gray-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(parseISO(item.date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-lg font-bold text-gray-900 leading-tight">{item.title}</h4>
                                      <p className="text-gray-600 mt-1">{item.description}</p>
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
                                  {item.type === 'evolution' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("Deseja excluir esta evolução?")) {
                                          deleteEvolutionMutation.mutate(item.id);
                                        }
                                      }}
                                      className="self-start text-red-400 hover:text-red-900"
                                    >
                                      Excluir
                                    </Button>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))
                      ) : (
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
                  {/* Comorbidades - Sidebar Card */}
                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          Comorbidades
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-gray-50">{diagnoses.length}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                            onClick={() => setIsDialogOpen(true)}
                            title="Adicionar comorbidade"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {Array.isArray(diagnoses) && diagnoses.length > 0 ? (
                        <div className="grid gap-2">
                          {diagnoses.slice(0, 5).map((diagnosis: any) => (
                            <div key={diagnosis.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 line-clamp-1" title={getCIDDescription(diagnosis.cidCode)}>
                                  {getCIDDescription(diagnosis.cidCode)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-20 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          <FileText className="h-5 w-5 mb-1 opacity-50" />
                          <p className="text-xs">Nenhuma ativa</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cirurgias Prévias - Sidebar Card */}
                  <Card className="border border-gray-200 bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                          Cirurgias Prévias
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-gray-50">{surgeries.length}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-purple-50 hover:text-purple-600"
                            onClick={() => setIsSurgeryDialogOpen(true)}
                            title="Adicionar cirurgia"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {Array.isArray(surgeries) && surgeries.length > 0 ? (
                        <div className="grid gap-2">
                          {surgeries.slice(0, 5).map((surgery: any) => (
                            <div key={surgery.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="bg-purple-50 p-1.5 rounded-md mt-0.5 flex-shrink-0">
                                <Activity className="h-3 w-3 text-purple-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 line-clamp-1" title={surgery.procedureName}>
                                  {surgery.procedureName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(parseISO(surgery.surgeryDate), "dd/MM/yy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-20 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                          <Activity className="h-5 w-5 mb-1 opacity-50" />
                          <p className="text-xs">Nenhuma registrada</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Medicamentos de Uso Contínuo - Always Visible */}
                  <Card className="border border-primary-100 bg-white shadow-md">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-2 mb-1">
                        <Activity className="h-5 w-5 text-[#48C9B0] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base text-gray-900 leading-tight">
                            Medicamentos de Uso Contínuo
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">Gerenciar medicamentos e prescrições</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {medications.length > 0 ? (
                        <>
                          <div className="grid gap-2">
                            {medications.map((medication: any) => (
                              <div
                                key={medication.id}
                                className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => openEditMedicationDialog(medication)}
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-sm text-gray-900">{medication.name}</h4>
                                  <Badge variant="outline" className="text-[10px]">
                                    {medication.format}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {medication.dosage} • {medication.frequency}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <Button
                              onClick={() => setIsMedicationDialogOpen(true)}
                              variant="outline"
                              size="sm"
                              className="gap-2 hover:bg-primary-50 hover:text-primary-700"
                            >
                              <PlusCircle className="h-4 w-4" />
                              Adicionar
                            </Button>
                            <Button
                              onClick={() => setIsPrescriptionDialogOpen(true)}
                              variant="default"
                              size="sm"
                              className="gap-2 bg-[#48C9B0] hover:bg-[#3ab89f]"
                            >
                              <FileText className="h-4 w-4" />
                              Renovar Receitas
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <Activity className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm font-medium">Nenhum medicamento cadastrado</p>
                            <p className="text-xs text-gray-500 mt-1">Adicione medicamentos de uso contínuo</p>
                          </div>
                          <Button
                            onClick={() => setIsMedicationDialogOpen(true)}
                            variant="default"
                            className="w-full gap-2 bg-[#48C9B0] hover:bg-[#3ab89f]"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Adicionar Medicamento
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                </div>
              </div >
            </div >
          </div >
        </main >

        {/* Dialog para Novo Diagnóstico */}
        < Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Novo Diagnóstico</DialogTitle>
              <DialogDescription>
                Adicione um diagnóstico médico à sua linha do tempo
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="cidCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código CID-10 *</FormLabel>
                        <FormControl>
                          <CID10Selector
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Buscar código CID-10..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="diagnosisDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data do Diagnóstico</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="em_tratamento">Em Tratamento</SelectItem>
                              <SelectItem value="resolvido">Resolvido</SelectItem>
                              <SelectItem value="cronico">Crônico</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Adicione observações sobre o diagnóstico..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addDiagnosisMutation.isPending}>
                    {addDiagnosisMutation.isPending ? "Registrando..." : "Registrar Diagnóstico"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog >

        {/* Dialog de Edição de Diagnóstico */}
        < Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Diagnóstico</DialogTitle>
              <DialogDescription>
                Modifique ou remova este diagnóstico da sua linha do tempo
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="cidCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código CID-10 *</FormLabel>
                        <FormControl>
                          <CID10Selector
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Buscar código CID-10..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="diagnosisDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data do Diagnóstico *</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ativo">Ativo</SelectItem>
                              <SelectItem value="em_tratamento">Em Tratamento</SelectItem>
                              <SelectItem value="curado">Curado</SelectItem>
                              <SelectItem value="cronico">Crônico</SelectItem>
                              <SelectItem value="controlado">Controlado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações (opcional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Adicione observações sobre o diagnóstico..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleRemoveDiagnosis}
                    disabled={removeDiagnosisMutation.isPending}
                  >
                    {removeDiagnosisMutation.isPending ? "Removendo..." : "Remover Diagnóstico"}
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={editDiagnosisMutation.isPending}>
                      {editDiagnosisMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog >

        {/* Dialog para adicionar medicamento */}
        < Dialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen} >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Medicamento de Uso Contínuo</DialogTitle>
              <DialogDescription>
                Registre um medicamento que você usa regularmente
              </DialogDescription>
            </DialogHeader>
            <Form {...medicationForm}>
              <form onSubmit={medicationForm.handleSubmit(onMedicationSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={medicationForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Medicamento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Losartana" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={medicationForm.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="comprimido">Comprimido</SelectItem>
                              <SelectItem value="capsula">Cápsula</SelectItem>
                              <SelectItem value="solucao">Solução</SelectItem>
                              <SelectItem value="xarope">Xarope</SelectItem>
                              <SelectItem value="gotas">Gotas</SelectItem>
                              <SelectItem value="injecao">Injeção</SelectItem>
                              <SelectItem value="creme">Creme</SelectItem>
                              <SelectItem value="pomada">Pomada</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={medicationForm.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosagem *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 50mg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={medicationForm.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1x-dia">1x ao dia</SelectItem>
                              <SelectItem value="2x-dia">2x ao dia</SelectItem>
                              <SelectItem value="3x-dia">3x ao dia</SelectItem>
                              <SelectItem value="4x-dia">4x ao dia</SelectItem>
                              <SelectItem value="12h-12h">12h em 12h</SelectItem>
                              <SelectItem value="8h-8h">8h em 8h</SelectItem>
                              <SelectItem value="6h-6h">6h em 6h</SelectItem>
                              <SelectItem value="quando-necessario">Quando necessário</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={medicationForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={medicationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione observações sobre o medicamento..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsMedicationDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addMedicationMutation.isPending}>
                    {addMedicationMutation.isPending ? "Adicionando..." : "Adicionar Medicamento"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog >

        {/* Dialog para editar medicamento */}
        < Dialog open={isEditMedicationDialogOpen} onOpenChange={setIsEditMedicationDialogOpen} >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Medicamento</DialogTitle>
              <DialogDescription>
                Atualize as informações do medicamento
              </DialogDescription>
            </DialogHeader>
            <Form {...editMedicationForm}>
              <form onSubmit={editMedicationForm.handleSubmit(onEditMedicationSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editMedicationForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Medicamento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Losartana" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editMedicationForm.control}
                    name="format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o formato" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="comprimido">Comprimido</SelectItem>
                              <SelectItem value="capsula">Cápsula</SelectItem>
                              <SelectItem value="solucao">Solução</SelectItem>
                              <SelectItem value="xarope">Xarope</SelectItem>
                              <SelectItem value="gotas">Gotas</SelectItem>
                              <SelectItem value="injecao">Injeção</SelectItem>
                              <SelectItem value="creme">Creme</SelectItem>
                              <SelectItem value="pomada">Pomada</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editMedicationForm.control}
                    name="dosage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dosagem *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 50mg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editMedicationForm.control}
                    name="frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequência *</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a frequência" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1x-dia">1x ao dia</SelectItem>
                              <SelectItem value="2x-dia">2x ao dia</SelectItem>
                              <SelectItem value="3x-dia">3x ao dia</SelectItem>
                              <SelectItem value="4x-dia">4x ao dia</SelectItem>
                              <SelectItem value="12h-12h">12h em 12h</SelectItem>
                              <SelectItem value="8h-8h">8h em 8h</SelectItem>
                              <SelectItem value="6h-6h">6h em 6h</SelectItem>
                              <SelectItem value="quando-necessario">Quando necessário</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editMedicationForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editMedicationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione observações sobre o medicamento..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-between gap-3">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => editingMedication && handleRemoveMedication(editingMedication.id)}
                    disabled={deleteMedicationMutation.isPending}
                  >
                    {deleteMedicationMutation.isPending ? "Removendo..." : "Remover Medicamento"}
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditMedicationDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={editMedicationMutation.isPending}>
                      {editMedicationMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog >

        {/* Dialog para adicionar nova alergia */}
        < Dialog open={isAllergyDialogOpen} onOpenChange={setIsAllergyDialogOpen} >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Alergia</DialogTitle>
            </DialogHeader>
            <Form {...allergyForm}>
              <form onSubmit={allergyForm.handleSubmit(onAllergySubmit)} className="space-y-4">
                <FormField
                  control={allergyForm.control}
                  name="allergen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicamento/Substância</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Penicilina, Dipirona..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={allergyForm.control}
                  name="allergenType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="medication">Medicamento</SelectItem>
                          <SelectItem value="food">Alimento</SelectItem>
                          <SelectItem value="environment">Ambiental</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={allergyForm.control}
                  name="reaction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reação</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Erupção cutânea, inchaço..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={allergyForm.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gravidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a gravidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leve">Leve</SelectItem>
                          <SelectItem value="moderada">Moderada</SelectItem>
                          <SelectItem value="grave">Grave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={allergyForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informações adicionais..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAllergyDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addAllergyMutation.isPending}>
                    {addAllergyMutation.isPending ? "Salvando..." : "Salvar Alergia"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog >

        {/* Dialog para editar alergia existente */}
        < Dialog open={isEditAllergyDialogOpen} onOpenChange={setIsEditAllergyDialogOpen} >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Alergia</DialogTitle>
            </DialogHeader>
            <Form {...editAllergyForm}>
              <form onSubmit={editAllergyForm.handleSubmit(onEditAllergySubmit)} className="space-y-4">
                <FormField
                  control={editAllergyForm.control}
                  name="allergen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medicamento/Substância</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Penicilina, Dipirona..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editAllergyForm.control}
                  name="allergenType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="medication">Medicamento</SelectItem>
                          <SelectItem value="food">Alimento</SelectItem>
                          <SelectItem value="environment">Ambiental</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editAllergyForm.control}
                  name="reaction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reação</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Erupção cutânea, inchaço..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editAllergyForm.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gravidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a gravidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="leve">Leve</SelectItem>
                          <SelectItem value="moderada">Moderada</SelectItem>
                          <SelectItem value="grave">Grave</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editAllergyForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informações adicionais..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => editingAllergy && handleRemoveAllergy(editingAllergy.id)}
                    disabled={deleteAllergyMutation.isPending}
                  >
                    {deleteAllergyMutation.isPending ? "Removendo..." : "Remover Alergia"}
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditAllergyDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={editAllergyMutation.isPending}>
                      {editAllergyMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>

              </form>
            </Form>
          </DialogContent>
        </Dialog >

        {/* Dialog para adicionar nova cirurgia */}
        <Dialog open={isSurgeryDialogOpen} onOpenChange={setIsSurgeryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar Nova Cirurgia</DialogTitle>
            </DialogHeader>
            <Form {...surgeryForm}>
              <form onSubmit={surgeryForm.handleSubmit(onSurgerySubmit)} className="space-y-4">
                <FormField
                  control={surgeryForm.control}
                  name="procedureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Procedimento *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Apendicectomia..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={surgeryForm.control}
                  name="hospitalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Hospital Albert Einstein..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={surgeryForm.control}
                  name="surgeonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cirurgião (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Dr. Silva..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={surgeryForm.control}
                  name="surgeryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Cirurgia *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={surgeryForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informações adicionais..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsSurgeryDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={addSurgeryMutation.isPending}>
                    {addSurgeryMutation.isPending ? "Salvando..." : "Salvar Cirurgia"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar cirurgia existente */}
        <Dialog open={isEditSurgeryDialogOpen} onOpenChange={setIsEditSurgeryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Cirurgia</DialogTitle>
            </DialogHeader>
            <Form {...editSurgeryForm}>
              <form onSubmit={editSurgeryForm.handleSubmit(onEditSurgerySubmit)} className="space-y-4">
                <FormField
                  control={editSurgeryForm.control}
                  name="procedureName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Procedimento *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Apendicectomia..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editSurgeryForm.control}
                  name="hospitalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hospital (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Hospital Albert Einstein..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editSurgeryForm.control}
                  name="surgeonName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cirurgião (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Dr. Silva..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editSurgeryForm.control}
                  name="surgeryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data da Cirurgia *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editSurgeryForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (opcional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informações adicionais..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => editingSurgery && handleRemoveSurgery(editingSurgery.id)}
                    disabled={deleteSurgeryMutation.isPending}
                  >
                    {deleteSurgeryMutation.isPending ? "Removendo..." : "Remover Cirurgia"}
                  </Button>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsEditSurgeryDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={editSurgeryMutation.isPending}>
                      {editSurgeryMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Dialog para Renovar Prescrições */}
        <Dialog open={isPrescriptionDialogOpen} onOpenChange={setIsPrescriptionDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Renovar Prescrições</DialogTitle>
              <DialogDescription>
                Selecione os medicamentos para renovação e configure o receituário
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Informações do Médico */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Dados do Médico</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Nome Completo *</label>
                    <Input
                      value={doctorInfo.name}
                      onChange={(e) => setDoctorInfo({ ...doctorInfo, name: e.target.value })}
                      placeholder="Dr(a). Nome Completo"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CRM *</label>
                    <Input
                      value={doctorInfo.crm}
                      onChange={(e) => setDoctorInfo({ ...doctorInfo, crm: e.target.value })}
                      placeholder="123456/UF"
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Especialidade (opcional)</label>
                  <Input
                    value={doctorInfo.specialty}
                    onChange={(e) => setDoctorInfo({ ...doctorInfo, specialty: e.target.value })}
                    placeholder="Ex: Cardiologia"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Seleção de Medicamentos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Medicamentos para Renovação</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const allIds = medications.map((m: any) => m.id);
                      setSelectedMedicationIds(
                        selectedMedicationIds.length === medications.length ? [] : allIds
                      );
                    }}
                    className="text-xs"
                  >
                    {selectedMedicationIds.length === medications.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                </div>
                <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                  {medications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhum medicamento ativo encontrado
                    </p>
                  ) : (
                    medications.map((medication: any) => (
                      <div
                        key={medication.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedMedicationIds.includes(medication.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMedicationIds([...selectedMedicationIds, medication.id]);
                            } else {
                              setSelectedMedicationIds(
                                selectedMedicationIds.filter((id) => id !== medication.id)
                              );
                            }
                          }}
                          className="mt-1 h-4 w-4 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{medication.name}</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {medication.format}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {medication.dosage} • {medication.frequency}
                          </p>
                          {medication.notes && (
                            <p className="text-xs text-gray-500 mt-1">{medication.notes}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Configurações da Prescrição */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Configurações da Prescrição</h3>
                <div>
                  <label className="text-sm font-medium">Validade</label>
                  <Select
                    value={prescriptionValidityDays.toString()}
                    onValueChange={(value) => setPrescriptionValidityDays(parseInt(value))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 dias</SelectItem>
                      <SelectItem value="60">60 dias</SelectItem>
                      <SelectItem value="90">90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Observações (opcional)</label>
                  <Textarea
                    value={prescriptionObservations}
                    onChange={(e) => setPrescriptionObservations(e.target.value)}
                    placeholder="Informações adicionais para o paciente..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsPrescriptionDialogOpen(false);
                  setSelectedMedicationIds([]);
                  setPrescriptionObservations("");
                  setDoctorInfo({ name: "", crm: "", specialty: "" });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (selectedMedicationIds.length === 0) {
                    toast({
                      title: "Erro",
                      description: "Selecione pelo menos um medicamento",
                      variant: "destructive",
                    });
                    return;
                  }

                  if (!doctorInfo.name || !doctorInfo.crm) {
                    toast({
                      title: "Erro",
                      description: "Preencha os dados do médico (nome e CRM)",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    const response = await fetch("/api/prescriptions/generate", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      credentials: "include",
                      body: JSON.stringify({
                        medicationIds: selectedMedicationIds,
                        validityDays: prescriptionValidityDays,
                        observations: prescriptionObservations,
                        doctorName: doctorInfo.name,
                        doctorCrm: doctorInfo.crm,
                        doctorSpecialty: doctorInfo.specialty,
                      }),
                    });

                    if (!response.ok) {
                      throw new Error("Erro ao gerar prescrição");
                    }

                    // Download do PDF
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `receituario-${new Date().toISOString().split("T")[0]}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast({
                      title: "Sucesso!",
                      description: "Receituário gerado e baixado com sucesso",
                    });

                    setIsPrescriptionDialogOpen(false);
                    setSelectedMedicationIds([]);
                    setPrescriptionObservations("");
                    setDoctorInfo({ name: "", crm: "", specialty: "" });
                  } catch (error) {
                    toast({
                      title: "Erro",
                      description: "Não foi possível gerar o receituário",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={selectedMedicationIds.length === 0 || !doctorInfo.name || !doctorInfo.crm}
              >
                <FileText className="h-4 w-4 mr-2" />
                Gerar Receituário
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div >
    </div >
  );
}
