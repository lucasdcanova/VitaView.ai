import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { 
  FileText, 
  Plus, 
  Calendar, 
  ClipboardList,
  Activity
} from "lucide-react";

const diagnosisSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  cidCode: z.string().optional(),
  diagnosisDate: z.string().min(1, "Data é obrigatória"),
  severity: z.enum(["leve", "moderada", "grave"]).optional(),
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
  severity?: string;
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
      severity: undefined,
      status: undefined,
      notes: "",
    },
  });

  // Buscar exames do usuário
  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ["/api/exams"],
  });

  // Por enquanto, vou criar uma lista vazia para diagnósticos até implementarmos a funcionalidade completa
  const diagnoses: any[] = [];

  // Mutation para adicionar diagnóstico
  const addDiagnosisMutation = useMutation({
    mutationFn: (data: DiagnosisForm) => apiRequest("POST", "/api/diagnoses", data),
    onSuccess: () => {
      toast({
        title: "Diagnóstico adicionado",
        description: "O diagnóstico foi registrado com sucesso.",
      });
      setIsDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });
    },
    onError: () => {
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar o diagnóstico.",
        variant: "destructive",
      });
    },
  });

  // Combinar e ordenar itens da timeline
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
      severity: diagnosis.severity,
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

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "leve": return "bg-yellow-100 text-yellow-800";
      case "moderada": return "bg-orange-100 text-orange-800";
      case "grave": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "ativo": return "bg-red-100 text-red-800";
      case "resolvido": return "bg-green-100 text-green-800";
      case "cronico": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <Sidebar />
      <MobileHeader />
      <div className="flex flex-col min-h-screen lg:pl-64">
        <main className="flex-1 p-4 lg:p-8 bg-gray-50 pt-16 lg:pt-4">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  Linha do Tempo da Saúde
                </h1>
                <p className="text-sm lg:text-base text-gray-600">
                  Histórico completo de exames e diagnósticos médicos
                </p>
              </div>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Diagnóstico
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Adicionar Diagnóstico</DialogTitle>
                    <DialogDescription>
                      Registre um novo diagnóstico médico com código CID-10
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                              <Input placeholder="Ex: I10" {...field} />
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="severity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Severidade</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
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
                                  <SelectItem value="em_tratamento">Em tratamento</SelectItem>
                                  <SelectItem value="resolvido">Resolvido</SelectItem>
                                  <SelectItem value="cronico">Crônico</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
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
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Estatísticas Resumidas */}
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
                  <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                  <ClipboardList className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{timelineItems.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Histórico Médico
              </h2>
              
              {timelineItems.length > 0 ? (
                <div className="space-y-4">
                  {timelineItems.map((item) => (
                    <Card key={`${item.type}-${item.id}`} className="transition-shadow hover:shadow-md">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="text-lg">{item.title}</CardTitle>
                                  <CardDescription className="flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4" />
                                    {item.date && !isNaN(new Date(item.date).getTime()) 
                                      ? format(new Date(item.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                                      : "Data não disponível"
                                    }
                                  </CardDescription>
                                </div>
                                <Badge variant={item.type === "exam" ? "default" : "destructive"}>
                                  {item.type === "exam" ? "Exame" : "Diagnóstico"}
                                </Badge>
                              </div>
                            </CardHeader>
                          </div>
                          
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-3">
                              {item.description}
                            </p>
                          )}
                          
                          {item.type === "diagnosis" && (
                            <div className="flex gap-2 mt-3">
                              {item.cidCode && (
                                <Badge variant="outline">{item.cidCode}</Badge>
                              )}
                              {item.severity && (
                                <Badge className={getSeverityColor(item.severity)}>
                                  {item.severity}
                                </Badge>
                              )}
                              {item.status && (
                                <Badge className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {item.type === "exam" && item.examType && (
                            <div className="mt-3">
                              <Badge variant="outline">{item.examType}</Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-16">
                    <div className="text-gray-400 mb-4">
                      <ClipboardList className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 mb-4">
                      Nenhum registro médico encontrado
                    </p>
                    <p className="text-sm text-gray-400">
                      Faça upload de exames ou adicione diagnósticos para começar
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}