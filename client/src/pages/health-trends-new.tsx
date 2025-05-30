import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, FileText, Activity, Plus, Stethoscope, ClipboardList } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Schema para adicionar diagnóstico
const diagnosisSchema = z.object({
  cidCode: z.string().min(1, "Código CID-10 é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  diagnosisDate: z.string().min(1, "Data do diagnóstico é obrigatória"),
  severity: z.enum(["leve", "moderada", "grave"]),
  status: z.enum(["ativo", "resolvido", "cronico"]),
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<DiagnosisForm>({
    resolver: zodResolver(diagnosisSchema),
    defaultValues: {
      cidCode: "",
      description: "",
      diagnosisDate: "",
      severity: "leve",
      status: "ativo",
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
      queryClient.invalidateQueries({ queryKey: ["/api/diagnoses"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Diagnóstico adicionado",
        description: "O diagnóstico foi registrado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
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
      <div className="lg:pl-64">
        <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
          <div className="max-w-4xl mx-auto">
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
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Diagnóstico
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Novo Diagnóstico</DialogTitle>
                    <DialogDescription>
                      Registre um novo diagnóstico médico com código CID-10
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="cidCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código CID-10</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: I10, E11.9, K30" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
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
                              <FormLabel>Gravidade</FormLabel>
                              <FormControl>
                                <select className="w-full border rounded-md p-2" {...field}>
                                  <option value="leve">Leve</option>
                                  <option value="moderada">Moderada</option>
                                  <option value="grave">Grave</option>
                                </select>
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
                                <select className="w-full border rounded-md p-2" {...field}>
                                  <option value="ativo">Ativo</option>
                                  <option value="resolvido">Resolvido</option>
                                  <option value="cronico">Crônico</option>
                                </select>
                              </FormControl>
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
                            <FormLabel>Observações (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Notas adicionais sobre o diagnóstico..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={addDiagnosisMutation.isPending}>
                          {addDiagnosisMutation.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {/* Estatísticas */}
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
                  <Stethoscope className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {diagnoses.filter((d: any) => d.status === "ativo").length}
                  </div>
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
              <h2 className="text-xl font-semibold text-gray-900">Histórico Médico</h2>
              
              {timelineItems.length > 0 ? (
                <div className="relative">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  <div className="space-y-6">
                    {timelineItems.map((item, index) => (
                      <div key={`${item.type}-${item.id}`} className="relative flex items-start">
                        {/* Ponto da timeline */}
                        <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                          item.type === "exam" ? "bg-blue-100" : "bg-red-100"
                        }`}>
                          {item.type === "exam" ? (
                            <Activity className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Stethoscope className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="ml-6 flex-1">
                          <Card>
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
                            
                            <CardContent className="pt-0">
                              {item.type === "diagnosis" && (
                                <div className="space-y-2 mb-3">
                                  <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      CID-10: {item.cidCode}
                                    </Badge>
                                    <Badge className={`text-xs ${getSeverityColor(item.severity)}`}>
                                      {item.severity}
                                    </Badge>
                                    <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                      {item.status}
                                    </Badge>
                                  </div>
                                </div>
                              )}
                              
                              {item.description && (
                                <p className="text-sm text-gray-600">{item.description}</p>
                              )}
                              
                              {item.resultSummary && (
                                <p className="text-sm text-gray-600 mt-2">{item.resultSummary}</p>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
                  </div>
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
        </div>
      </div>
    </>
  );
}