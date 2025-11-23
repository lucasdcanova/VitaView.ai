import { useState } from "react";
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
import {
  FileText,
  Calendar,
  Badge as BadgeIcon,
  PlusCircle,
  ClipboardList,
  Activity,
  FileDown,
  Sparkles,
  Loader2
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

type DiagnosisForm = z.infer<typeof diagnosisSchema>;
type MedicationForm = z.infer<typeof medicationSchema>;
type AllergyForm = z.infer<typeof allergySchema>;

// Função para buscar a descrição do código CID-10
const getCIDDescription = (cidCode: string): string => {
  const cidEntry = CID10_DATABASE.find(item => item.code === cidCode);
  return cidEntry ? `${cidCode} - ${cidEntry.description}` : cidCode;
};

interface TimelineItem {
  id: number;
  type: "exam" | "diagnosis";
  date: string;
  title: string;
  description?: string;
  cidCode?: string;
  status?: string;
  examType?: string;
  resultSummary?: string;
  originalData?: any;
}

export default function HealthTrendsNew() {
  const { toast } = useToast();
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
      startDate: "",
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

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: diagnoses = [], isLoading: diagnosesLoading } = useQuery({
    queryKey: ["/api/diagnoses"],
  });

  const { data: medications = [], isLoading: medicationsLoading } = useQuery({
    queryKey: ["/api/medications"],
  });

  const { data: allergies = [], isLoading: allergiesLoading } = useQuery({
    queryKey: ["/api/allergies"],
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

  const handleApplyExtraction = async () => {
    if (!extractedRecord) return;
    setIsApplyingExtraction(true);
    const today = new Date().toISOString().split("T")[0];
    const created = { diagnoses: 0, medications: 0, allergies: 0 };

    try {
      for (const diagnosis of extractedRecord.diagnoses || []) {
        if (!diagnosis?.cidCode) continue;
        await apiRequest("POST", "/api/diagnoses", {
          cidCode: diagnosis.cidCode,
          diagnosisDate: diagnosis.diagnosisDate || today,
          status: diagnosis.status || "ativo",
          notes: diagnosis.notes || diagnosis.description || null,
        });
        created.diagnoses += 1;
      }

      for (const medication of extractedRecord.medications || []) {
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

      for (const allergy of extractedRecord.allergies || []) {
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
  const summaryHighlights = [
    { label: "Diagnósticos registrados", value: diagnosesCount },
    { label: "Medicamentos ativos", value: medicationsCount },
    { label: "Alergias registradas", value: allergiesCount }
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
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-3xl text-gray-900">Prontuário do paciente</CardTitle>
                    <CardDescription>
                      Acompanhe e atualize o histórico clínico de {profileName} para que cada exame seja interpretado com contexto.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {summaryHighlights.map((item) => (
                        <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                          <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
                          <p className="text-2xl font-semibold text-[#1E3A5F]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      {hasRecordData
                        ? "Mantenha diagnósticos, medicamentos e alergias atualizados para análises mais precisas."
                        : "Comece adicionando novos registros para enriquecer o prontuário e personalizar os insights."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border border-primary-100 bg-white shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Ações rápidas</CardTitle>
                    <CardDescription>Cadastre as informações prioritárias do paciente</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button onClick={() => setIsMedicationDialogOpen(true)} variant="outline" className="w-full justify-start gap-2">
                      <Activity className="h-4 w-4 text-primary-600" />
                      Registrar medicamento
                    </Button>
                    <Button onClick={() => setIsAllergyDialogOpen(true)} variant="outline" className="w-full justify-start gap-2">
                      <ClipboardList className="h-4 w-4 text-primary-600" />
                      Registrar alergia
                    </Button>
                    <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="w-full justify-start gap-2">
                      <FileText className="h-4 w-4 text-primary-600" />
                      Registrar diagnóstico
                    </Button>
                    <Button onClick={handleExportToPDF} variant="secondary" className="w-full justify-start gap-2">
                      <FileDown className="h-4 w-4" />
                      Exportar PDF do prontuário
                    </Button>
                  </CardContent>
                </Card>
              </div>

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

              {extractedRecord && (
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
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            </Dialog>

            {/* Resumo Atual da Saúde */}
            <Card className="mb-8 border-t-4 border-t-[#48C9B0]">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Situação Atual de Saúde</CardTitle>
                <p className="text-gray-600">Resumo baseado nos últimos exames e diagnósticos</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Diagnósticos Ativos</h4>
                    {Array.isArray(diagnoses) && diagnoses.filter((d: any) => d.status === "ativo" || d.status === "em_tratamento" || d.status === "cronico").length > 0 ? (
                      <div className="space-y-2">
                        {diagnoses.filter((d: any) => d.status === "ativo" || d.status === "em_tratamento" || d.status === "cronico").map((diagnosis: any) => (
                          <div key={diagnosis.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">{getCIDDescription(diagnosis.cidCode)}</span>
                            <Badge className={getStatusColor(diagnosis.status)} variant="secondary">
                              {getStatusLabel(diagnosis.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum diagnóstico ativo registrado</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Alergias Medicamentosas</h4>
                    {Array.isArray(allergies) && allergies.length > 0 ? (
                      <div className="space-y-2">
                        {allergies.map((allergy: any) => (
                          <div key={allergy.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{allergy.allergen}</span>
                            {allergy.severity && (
                              <Badge variant={allergy.severity === "grave" ? "destructive" : allergy.severity === "moderada" ? "default" : "secondary"}>
                                {allergy.severity}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Sem alergias medicamentosas</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Últimos Exames</h4>
                    {Array.isArray(exams) && exams.length > 0 ? (
                      <div className="space-y-2">
                        {exams.slice(0, 3).map((exam: any) => (
                          <div key={exam.id} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm text-gray-700">{exam.name}</span>
                            <span className="text-xs text-gray-500">
                              {format(parseISO(exam.uploadDate), "dd/MM/yy", { locale: ptBR })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Nenhum exame enviado ainda</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medicamentos em Uso */}
            {medications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-[#48C9B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                    </svg>
                    Medicamentos em Uso Contínuo ({medications.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {medications.map((medication: any) => (
                      <div
                        key={medication.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => openEditMedicationDialog(medication)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">{medication.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {medication.format}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {medication.dosage} • {medication.frequency}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Desde {format(parseISO(medication.start_date || medication.startDate), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          {medication.notes && (
                            <div className="text-xs text-gray-600 mt-1 italic">
                              {medication.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-blue-500">
                          Clique para editar
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Linha do Tempo */}
            <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
              Timeline temporarily disabled for debugging
            </div>
          </div>
      </div >
    </main >

    {/* Dialog de Edição de Diagnóstico */ }
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

  {/* Dialog para adicionar medicamento */ }
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

  {/* Dialog para editar medicamento */ }
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

  {/* Dialog para adicionar nova alergia */ }
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

  {/* Dialog para editar alergia existente */ }
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
      </div >
    </div >
  );
}
