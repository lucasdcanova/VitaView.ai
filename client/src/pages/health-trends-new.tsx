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
import { CID10Selector } from "@/components/cid10-selector";
import { apiRequest } from "@/lib/queryClient";
import { 
  FileText, 
  Calendar,
  Badge as BadgeIcon,
  PlusCircle,
  ClipboardList,
  Activity,
  FileDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type DiagnosisForm = z.infer<typeof diagnosisSchema>;
type MedicationForm = z.infer<typeof medicationSchema>;

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDiagnosis, setEditingDiagnosis] = useState<any>(null);
  const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
  const [isEditMedicationDialogOpen, setIsEditMedicationDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<any>(null);

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

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: diagnoses = [], isLoading: diagnosesLoading } = useQuery({
    queryKey: ["/api/diagnoses"],
  });

  const { data: medications = [], isLoading: medicationsLoading } = useQuery({
    queryKey: ["/api/medications"],
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
      title: diagnosis.cidCode || "Diagnóstico",
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
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Meu <span className="text-[#1E3A5F]">VitaView</span>
                  </h1>
                  <p className="text-gray-600 mt-2">
                    Sua visão completa de saúde: acompanhe exames, diagnósticos e tendências<br/>
                    em um só lugar
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                  <Button onClick={() => setIsMedicationDialogOpen(true)} variant="outline" className="flex items-center justify-center gap-2 h-12">
                    <PlusCircle className="h-4 w-4" />
                    Medicamento
                  </Button>
                  <Button onClick={() => setIsDialogOpen(true)} className="flex items-center justify-center gap-2 h-12">
                    <PlusCircle className="h-4 w-4" />
                    Diagnóstico
                  </Button>
                  <Button onClick={handleExportToPDF} variant="secondary" className="flex items-center justify-center gap-2 h-12">
                    <FileDown className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <div className="bg-blue-50 text-blue-700 px-2 py-2 rounded-lg border border-blue-200 flex items-center justify-center h-12" style={{ fontSize: '12px', fontWeight: '500' }}>
                    <div className="text-center" style={{ lineHeight: '1.1' }}>
                      <div>Compartilhe com</div>
                      <div>seu médico</div>
                    </div>
                  </div>
                </div>
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
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Diagnósticos Ativos</h4>
                      {Array.isArray(diagnoses) && diagnoses.filter((d: any) => d.status === "ativo" || d.status === "em_tratamento" || d.status === "cronico").length > 0 ? (
                        <div className="space-y-2">
                          {diagnoses.filter((d: any) => d.status === "ativo" || d.status === "em_tratamento" || d.status === "cronico").map((diagnosis: any) => (
                            <div key={diagnosis.id} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">{diagnosis.cidCode}</span>
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
              <div className="relative">
                {timelineItems.length === 0 ? (
                  <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <ClipboardList className="h-12 w-12 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Nenhum evento registrado
                        </h3>
                        <p className="text-gray-600">
                          Comece enviando um exame ou registrando um diagnóstico para criar sua linha do tempo de saúde.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="relative pl-40">
                    {/* Linha vertical */}
                    <div className="absolute left-36 top-0 bottom-0 w-2 bg-gradient-to-b from-[#48C9B0] to-[#1E3A5F] rounded-full shadow-lg"></div>
                    
                    <div className="space-y-16">
                      {timelineItems.map((item, index) => (
                        <div key={`${item.type}-${item.id}`} className="relative flex items-start group">
                          {/* Data no lado esquerdo */}
                          <div className="absolute -left-40 top-2 w-28 cursor-pointer group-hover:scale-105 transition-transform duration-200">
                            <div 
                              className="bg-white border border-gray-200 rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-200 hover:border-[#48C9B0] mr-4 text-center"
                              onClick={() => {
                                if (item.type === "diagnosis" && item.originalData) {
                                  openEditDialog(item.originalData);
                                }
                              }}
                            >
                              <div className="text-lg font-bold text-[#1E3A5F] group-hover:text-[#48C9B0] transition-colors duration-200">
                                {format(parseISO(item.date), "yyyy", { locale: ptBR })}
                              </div>
                              <div className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                                {format(parseISO(item.date), "dd MMM", { locale: ptBR })}
                              </div>
                              {item.type === "diagnosis" && (
                                <div className="text-xs text-blue-500 mt-1">
                                  Clique para editar
                                </div>
                              )}
                            </div>
                          </div>
                          

                          
                          {/* Conteúdo no lado direito */}
                          <div className="ml-16 flex-1">
                            <Card 
                              className={`transition-shadow hover:shadow-md ${
                                item.type === "diagnosis" ? "cursor-pointer hover:bg-gray-50" : ""
                              }`}
                              onClick={() => {
                                if (item.type === "diagnosis" && item.originalData) {
                                  openEditDialog(item.originalData);
                                }
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    {item.type === "exam" ? (
                                      <FileText className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Activity className="h-4 w-4 text-green-600" />
                                    )}
                                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                                  </div>
                                  {item.status && (
                                    <Badge className={getStatusColor(item.status)} variant="secondary">
                                      {getStatusLabel(item.status)}
                                    </Badge>
                                  )}
                                </div>
                                
                                {item.type === "exam" && item.examType && (
                                  <Badge variant="outline" className="text-xs mb-2">
                                    {item.examType}
                                  </Badge>
                                )}
                                
                                {item.cidCode && (
                                  <div className="mb-2">
                                    <span className="text-sm font-medium text-gray-700">CID-10: </span>
                                    <span className="text-sm text-gray-600">{item.cidCode}</span>
                                  </div>
                                )}
                                
                                {item.description && (
                                  <p className="text-gray-600 text-sm">{item.description}</p>
                                )}
                                
                                {item.resultSummary && (
                                  <p className="text-gray-600 text-sm mt-2">{item.resultSummary}</p>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Dialog de Edição de Diagnóstico */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
        </Dialog>

        {/* Dialog para adicionar medicamento */}
        <Dialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen}>
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
        </Dialog>

        {/* Dialog para editar medicamento */}
        <Dialog open={isEditMedicationDialogOpen} onOpenChange={setIsEditMedicationDialogOpen}>
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
        </Dialog>
      </div>
    </div>
  );
}