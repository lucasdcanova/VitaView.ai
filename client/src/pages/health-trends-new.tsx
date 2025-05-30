import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  PlusCircle, 
  Calendar, 
  ClipboardList,
  Activity
} from "lucide-react";

const diagnosisSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  cidCode: z.string().optional(),
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
      description: "",
      cidCode: "",
      diagnosisDate: "",
      status: undefined,
      notes: "",
    },
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  const diagnoses: any[] = [];

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
    ...diagnoses.map((diagnosis: any) => ({
      id: diagnosis.id,
      type: "diagnosis" as const,
      date: diagnosis.diagnosisDate,
      title: diagnosis.description,
      description: diagnosis.notes,
      cidCode: diagnosis.cidCode,
      status: diagnosis.status,
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      return 0;
    }
    return dateB.getTime() - dateA.getTime();
  });

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

  if (examsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="lg:pl-64">
          <MobileHeader />
          <div className="p-4 lg:p-8">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:pl-64">
        <MobileHeader />
        <div className="p-4 lg:p-8">
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
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição do Diagnóstico</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Hipertensão arterial" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cidCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código CID-10 (opcional)</FormLabel>
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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="em_tratamento">Em Tratamento</SelectItem>
                                <SelectItem value="resolvido">Resolvido</SelectItem>
                                <SelectItem value="cronico">Crônico</SelectItem>
                              </SelectContent>
                            </Select>
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
                                placeholder="Observações adicionais sobre o diagnóstico..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={addDiagnosisMutation.isPending}
                        >
                          {addDiagnosisMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Exames</CardTitle>
                  <FileText className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Array.isArray(exams) ? exams.length : 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Diagnósticos Ativos</CardTitle>
                  <Activity className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{diagnoses.filter(d => d.status === "ativo").length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
                  <Calendar className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {timelineItems.length > 0 ? 
                      new Date(timelineItems[0].date).toLocaleDateString('pt-BR') : 
                      "Nenhum"
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {timelineItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-gray-500">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Nenhum registro encontrado</h3>
                    <p>Registre seu primeiro diagnóstico ou faça upload de um exame para começar.</p>
                  </div>
                </Card>
              ) : (
                timelineItems.map((item) => (
                  <Card key={`${item.type}-${item.id}`} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {item.type === "exam" ? (
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <Activity className="h-5 w-5 text-red-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.type === "exam" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                            }`}>
                              {item.type === "exam" ? "Exame" : "Diagnóstico"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(item.date).toLocaleDateString('pt-BR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                          {item.description && (
                            <p className="text-gray-700 mb-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {item.cidCode && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                CID-10: {item.cidCode}
                              </span>
                            )}
                            {item.status && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            )}
                            {item.examType && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {item.examType}
                              </span>
                            )}
                          </div>
                          {item.resultSummary && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-700">{item.resultSummary}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}