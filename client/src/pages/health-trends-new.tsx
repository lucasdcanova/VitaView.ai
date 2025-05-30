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
  Activity
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

type DiagnosisForm = z.infer<typeof diagnosisSchema>;

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
}

export default function HealthTrendsNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<DiagnosisForm>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      cidCode: "",
      diagnosisDate: "",
      status: undefined,
      notes: "",
    },
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const { data: diagnoses = [], isLoading: diagnosesLoading } = useQuery({
    queryKey: ["/api/diagnoses"],
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

  const timelineItems: TimelineItem[] = [
    ...(Array.isArray(exams) ? exams.map((exam: any) => ({
      id: exam.id,
      type: "exam" as const,
      date: exam.uploadDate || exam.uploadedAt || exam.createdAt,
      title: exam.name || exam.title || "Exame",
      description: exam.description,
      examType: exam.examType,
      resultSummary: exam.resultSummary,
    })) : []),
    ...(Array.isArray(diagnoses) ? diagnoses.map((diagnosis: any) => ({
      id: diagnosis.id,
      type: "diagnosis" as const,
      date: diagnosis.diagnosisDate,
      title: diagnosis.cidCode || "Diagnóstico",
      description: diagnosis.notes,
      cidCode: diagnosis.cidCode,
      status: diagnosis.status,
    })) : [])
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const onSubmit = (data: DiagnosisForm) => {
    addDiagnosisMutation.mutate(data);
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

  if (examsLoading || diagnosesLoading) {
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
                  <h1 className="text-3xl font-bold text-gray-900">Linha do Tempo da Saúde</h1>
                  <p className="text-gray-600 mt-2">
                    Acompanhe sua evolução médica com exames e diagnósticos organizados cronologicamente
                  </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Registrar Diagnóstico
                </Button>
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

              <div className="space-y-6">
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
                  timelineItems.map((item) => (
                    <Card key={`${item.type}-${item.id}`} className="transition-shadow hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {item.type === "exam" ? (
                              <div className="p-2 bg-blue-50 rounded-lg">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-green-50 rounded-lg">
                                <Activity className="h-5 w-5 text-green-600" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {format(parseISO(item.date), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                                {item.type === "exam" && item.examType && (
                                  <Badge variant="secondary" className="text-xs">
                                    {item.examType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          {item.status && (
                            <Badge className={getStatusColor(item.status)}>
                              {getStatusLabel(item.status)}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {item.cidCode && (
                          <div className="mb-3">
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
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}