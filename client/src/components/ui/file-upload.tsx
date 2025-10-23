import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileType, BrainCircuit, Sparkles, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { normalizeExamName } from "@shared/exam-normalizer";

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'analyzing' | 'interpreting' | 'complete' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeProfile } = useProfiles();
  
  useEffect(() => {
    console.info("[UploadFlow][Client] Etapa atualizada", { step: uploadStep });
  }, [uploadStep]);

  // OpenAI análise do documento
  const analyzeDocumentMutation = useMutation({
    mutationFn: async (data: { file: File; fileType: string; profileId?: number | null }) => {
      const formData = new FormData();
      formData.append("fileType", data.fileType);
      formData.append("file", data.file);
      if (typeof data.profileId === "number") {
        formData.append("profileId", String(data.profileId));
      }

      const response = await fetch("/api/analyze/openai", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        console.error("[UploadFlow][Client] Erro na análise do documento", {
          status: response.status,
          statusText: response.statusText
        });
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      const resultData = await response.json();
      return resultData;
    },
    onSuccess: (data) => {
      if (!activeProfile) {
        console.warn("[UploadFlow][Client] Análise concluída sem paciente selecionado");
        setUploadStep('error');
        toast({
          title: "Selecione um paciente",
          description: "Escolha um paciente antes de analisar exames.",
          variant: "destructive",
        });
        return;
      }

      setExtractionResult(data);
      setUploadStep('interpreting');
      
      // Agora vamos para o segundo passo: interpretação com OpenAI
      const patientData = {
        gender: activeProfile?.gender || 'não informado',
        age: activeProfile?.birthDate 
          ? Math.floor((new Date().getTime() - new Date(activeProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : undefined,
        relationship: activeProfile?.relationship,
        planType: activeProfile?.planType,
        diseases: [],
        surgeries: [],
        allergies: []
      };
      
      interpretWithOpenAIMutation.mutate({ 
        analysisResult: data,
        patientData
      });
    },
    onError: (error: Error) => {
      console.error("[UploadFlow][Client] Falha na análise do documento", { error });
      setUploadStep('error');
      toast({
        title: "Erro na análise",
        description: error.message || "Ocorreu um erro ao analisar o documento.",
        variant: "destructive",
      });
    }
  });
  
  // OpenAI interpretação dos resultados
  const interpretWithOpenAIMutation = useMutation({
    mutationFn: async (data: { analysisResult: any, patientData: any }) => {
      
      const response = await fetch("/api/analyze/interpretation", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (!response.ok) {
        console.error("[UploadFlow][Client] Erro na interpretação do exame", {
          status: response.status,
          statusText: response.statusText
        });
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      const interpretationData = await response.json();
      return interpretationData;
    },
    onSuccess: (openaiInterpretation) => {
      // Verificar se usuário está autenticado
      if (!user || !user.id || !activeProfile) {
        console.warn("[UploadFlow][Client] Interpretação concluída sem usuário ou paciente válido", {
          hasUser: Boolean(user?.id),
          hasProfile: Boolean(activeProfile)
        });
        toast({
          title: "Seleção necessária",
          description: "Confirme que está autenticado e que um paciente está selecionado antes de salvar exames.",
          variant: "destructive",
        });
        setUploadStep('error');
        return;
      }
      
      // Salvar o exame no banco de dados
      const filename = selectedFile?.name || 'Exame';
      
      // Obter o tipo de arquivo das variáveis corretas
      const fileType = extractionResult?.fileType || uploadedFileType || 'pdf';
      
      // Alguns campos são extraídos da análise inicial da OpenAI se disponíveis
      // como data do exame, médico solicitante, etc.
      const examDate = extractionResult?.examDate || new Date().toISOString().split('T')[0];
      
      // IMPORTANTE: Removendo campos não presentes no banco de dados
      // Removendo requestingPhysician pois não existe na tabela
      
      // Para debug: vamos garantir que o userId é enviado mesmo se a sessão estiver com problemas
      
      // Verificamos se o usuário está autenticado
      if (!user || !user.id) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para enviar exames. Por favor, faça login novamente.",
          variant: "destructive"
        });
        setUploadStep('error');
        return;
      }
      
      const examData = {
        name: filename.split('.')[0],
        userId: user.id, // Sempre usar o ID do profissional autenticado
        profileId: activeProfile.id,
        fileType: fileType,
        laboratoryName: "Upload via Plataforma",
        examDate: examDate,
        status: "analyzed", // definir status como analisado
        storageProvider: extractionResult?.storage?.provider,
        storageKey: extractionResult?.storage?.key,
        storageBucket: extractionResult?.storage?.bucket,
        storageMimeType: extractionResult?.storage?.mimeType,
        storageSize: extractionResult?.storage?.size,
        storageOriginalName: extractionResult?.storage?.originalName || filename,
        // Removido requestingPhysician pois este campo não existe no banco de dados
        originalContent: JSON.stringify(extractionResult).substring(0, 5000) // Limitando tamanho para evitar problemas
      };
      
      // Salvar exame completo
      saveExamMutation.mutate({
        examData,
        extractionResult,
        openaiInterpretation
      }, {
        onSuccess: (savedData) => {
          console.info("[UploadFlow][Client] Exame salvo com sucesso", {
            examId: savedData?.exam?.id
          });
          setUploadStep('complete');
          
          // Atualizar cache com novos dados
          queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
          queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          
          toast({
            title: "Análise concluída",
            description: "Seu exame foi analisado, interpretado e salvo com sucesso!",
          });
          
          // Redirecionar para a página de detalhes do exame com a aba de resumo selecionada
          setTimeout(() => {
            window.location.href = `/report/${savedData.exam.id}?tab=summary`;
          }, 1500); // Aguardar 1.5 segundos antes de redirecionar para dar tempo de ver a mensagem
          
          if (onUploadComplete) {
            onUploadComplete({
              savedExam: savedData.exam,
              extractionResult,
              openaiInterpretation: savedData.result
            });
          }
        },
        onError: (error) => {
          console.error("[UploadFlow][Client] Falha ao salvar exame", { error });
          toast({
            title: "Erro ao salvar",
            description: "A análise foi concluída, mas houve um erro ao salvar o exame.",
            variant: "destructive",
          });
          setUploadStep('error');
        }
      });
    },
    onError: (error: Error) => {
      console.error("[UploadFlow][Client] Falha na interpretação com OpenAI", { error });
      setUploadStep('error');
      toast({
        title: "Erro na interpretação",
        description: error.message || "Ocorreu um erro ao interpretar os resultados.",
        variant: "destructive",
      });
    }
  });
  
  // Salvar exame completo no banco de dados
  const saveExamMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        // Verificação de autenticação
        if (user === null) {
          throw new Error("Você precisa estar autenticado para salvar exames");
        }

        if (!activeProfile) {
          throw new Error("Selecione um paciente antes de salvar exames");
        }

        const profileId = activeProfile.id;
        
        
        // Extrair dados do exame do novo formato
        const { examData: rawExamData, extractionResult: extractionData, openaiInterpretation } = data;
        const effectiveExtraction = extractionData || extractionResult;
        
        // Adaptar dados para formato esperado pela API
        // Manter o userId que foi enviado no objeto original (que pode ter um fallback)
        const examData = {
          name: rawExamData.name,
          fileType: rawExamData.fileType,
          laboratoryName: rawExamData.laboratoryName,
          examDate: rawExamData.examDate,
          status: "analyzed",
          userId: rawExamData.userId, // Usar o userId que foi enviado originalmente
          profileId,
          requestingPhysician: rawExamData.requestingPhysician || null,
          originalContent: rawExamData.originalContent || null,
          storageProvider: rawExamData.storageProvider,
          storageKey: rawExamData.storageKey,
          storageBucket: rawExamData.storageBucket,
          storageMimeType: rawExamData.storageMimeType,
          storageSize: rawExamData.storageSize,
          storageOriginalName: rawExamData.storageOriginalName
        };
        
        // Criar o exame no banco de dados
        const examResponse = await fetch("/api/exams", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(examData),
          credentials: "include"
        });
        
        
        if (!examResponse.ok) {
          const errorText = await examResponse.text();
          throw new Error(`Erro ao salvar exame: ${errorText}`);
        }
        
        const savedExam = await examResponse.json();
        
        // Salvar o resultado da análise
        if (savedExam && savedExam.id) {
          // Preparar dados do resultado da análise
          // Usando tanto os dados da análise inicial quanto a interpretação da OpenAI
          const resultData = {
            examId: savedExam.id,
            summary: openaiInterpretation?.contextualAnalysis || effectiveExtraction?.summary || "Análise não disponível",
            detailedAnalysis: effectiveExtraction?.detailedAnalysis || "",
            recommendations: openaiInterpretation?.recommendations 
              ? Array.isArray(openaiInterpretation.recommendations)
                ? openaiInterpretation.recommendations.join('\n')
                : openaiInterpretation.recommendations
              : Array.isArray(effectiveExtraction?.recommendations)
                ? effectiveExtraction.recommendations.join('\n')
                : effectiveExtraction?.recommendations || "",
            healthMetrics: effectiveExtraction?.healthMetrics || [],
            aiProvider: "openai"
          };
          
          const resultResponse = await fetch("/api/exam-results", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resultData),
            credentials: "include"
          });
          
          
          if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            
            // Mesmo com erro na criação do resultado, continuamos (não interrompemos)
            // - isso garante que ao menos o exame seja registrado
          } else {
            const savedResult = await resultResponse.json();
          }
          
          // Salvar métricas de saúde individuais, se disponíveis
          if (effectiveExtraction?.healthMetrics && Array.isArray(effectiveExtraction.healthMetrics)) {
            
            // Pré-processamento para normalizar nomes e unificar métricas duplicadas
            const processedMetrics = new Map<string, any>();
            
            // Primeiro passo: normalizar todos os nomes e agrupar métricas idênticas
            for (const metric of effectiveExtraction.healthMetrics) {
              const normalizedName = normalizeExamName(metric.name || "desconhecido");
              
              // Se já temos uma métrica com esse nome normalizado, usamos a mais recente
              // ou a que tem mais informações (assumindo que a ordem indica prioridade)
              if (!processedMetrics.has(normalizedName)) {
                processedMetrics.set(normalizedName, {
                  ...metric,
                  name: normalizedName // substituir pelo nome normalizado
                });
              }
            }
            
            
            // Segundo passo: salvar cada métrica unificada
            const uniqueMetrics = Array.from(processedMetrics.values());
            for (const metric of uniqueMetrics) {
              try {
                // Garantir que os dados estão no formato esperado pelo backend
                const metricData = {
                  userId: Number(savedExam.userId), // Usar userId do exame salvo que já foi confirmado
                  profileId,
                  name: metric.name, // Já normalizado
                  value: String(metric.value || "0"),
                  unit: metric.unit || '',
                  status: metric.status || 'normal',
                  change: metric.change || '',
                  examId: savedExam.id,
                  date: examData.examDate || new Date().toISOString() // Usar mesma data do exame
                };
                
                const metricResponse = await fetch("/api/health-metrics", {
                  method: "POST",
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(metricData),
                  credentials: "include"
                });
                
                if (!metricResponse.ok) {
                  const errorText = await metricResponse.text();
                } else {
                  const savedMetric = await metricResponse.json();
                }
              } catch (metricError) {
              }
            }
          }
      }
        
        return {
          exam: savedExam,
          result: openaiInterpretation || {}
        };
      } catch (error: any) {
        console.error("[UploadFlow][Client] Erro inesperado ao processar exame", { error });
        throw new Error("Falha ao processar e salvar exame: " + (error?.message || "Erro desconhecido"));
      }
    }
  });
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    if (!activeProfile) {
      console.warn("[UploadFlow][Client] Tentativa de upload sem paciente selecionado");
      toast({
        title: "Selecione um paciente",
        description: "Escolha um paciente no painel lateral antes de enviar exames.",
        variant: "destructive"
      });
      return;
    }
    
    // Iniciar upload
    setUploadStep('uploading');
    setUploadProgress(0);
    
    // Simular progresso de upload
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    // Após o "upload" estar completo, preparar dados para análise
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadStep('analyzing');
      
      const file = acceptedFiles[0];
      if (!file) {
        console.error("[UploadFlow][Client] Nenhum arquivo disponível após drop");
        setUploadStep('error');
        toast({
          title: "Arquivo inválido",
          description: "Não foi possível ler o arquivo selecionado.",
          variant: "destructive"
        });
        return;
      }

      const determineFileType = (input: File) => {
        const mime = input.type?.toLowerCase() || '';
        const name = input.name?.toLowerCase() || '';

        if (mime.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
        if (mime.includes('jpeg') || mime.includes('jpg') || name.endsWith('.jpeg') || name.endsWith('.jpg')) return 'jpeg';
        if (mime.includes('png') || name.endsWith('.png')) return 'png';
        return 'pdf';
      };

      const fileType = determineFileType(file);
      setSelectedFile(file);
      setUploadedFileType(fileType);

      if (!user || !user.id) {
        console.error("[UploadFlow][Client] Usuário não autenticado durante upload");
        toast({
          title: "Erro de autenticação",
          description: "Por favor, faça login novamente para continuar.",
          variant: "destructive"
        });
        setUploadStep('error');
        return;
      }

      analyzeDocumentMutation.mutate({
        file,
        fileType,
        profileId: activeProfile?.id ?? null
      });
    }, 2000);
  }, [activeProfile, analyzeDocumentMutation, toast, user]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    disabled: uploadStep !== 'idle'
  });

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${
        isDragActive ? 'bg-primary-50' : uploadStep === 'idle' ? 'bg-gray-50' : ''
      }`}
      {...(uploadStep === 'idle' ? getRootProps() : {})}
    >
      {uploadStep === 'idle' && (
        <div>
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            {isDragActive ? "Solte o arquivo aqui" : "Arraste seus arquivos aqui"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">ou</p>
          <button
            type="button"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition"
          >
            Selecionar arquivos
          </button>
          <input {...getInputProps()} />
          <p className="text-xs text-gray-500 mt-4">Formatos suportados: PDF, JPEG, PNG (máx. 50MB)</p>
        </div>
      )}
      
      {uploadStep === 'uploading' && (
        <div className="space-y-4">
          <FileType className="mx-auto h-12 w-12 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-700">Enviando arquivo...</h3>
          <Progress value={uploadProgress} className="w-full h-2" />
          <p className="text-sm text-gray-500">{uploadProgress}% concluído</p>
        </div>
      )}
      
      {uploadStep === 'analyzing' && (
        <div className="space-y-4">
          <BrainCircuit className="mx-auto h-12 w-12 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-700">Analisando documento</h3>
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-sm text-gray-500">Extração de métricas e análise do documento</p>
        </div>
      )}
      
      {uploadStep === 'interpreting' && (
        <div className="space-y-4">
          <Sparkles className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="text-lg font-medium text-gray-700">Processando Exames</h3>
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-sm text-gray-500">Gerando recomendações personalizadas baseadas nos resultados</p>
        </div>
      )}
      
      {uploadStep === 'complete' && (
        <div className="space-y-4">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h3 className="text-lg font-medium text-gray-700">Análise completa!</h3>
          <p className="text-sm text-gray-600 mb-4">Seu exame foi analisado com sucesso e as recomendações foram geradas.</p>
          <Button 
            onClick={() => setUploadStep('idle')}
            className="bg-primary-600 text-white hover:bg-primary-700"
          >
            Fazer novo upload
          </Button>
        </div>
      )}
      
      {uploadStep === 'error' && (
        <div className="space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700">Erro na análise</h3>
          <p className="text-sm text-gray-600 mb-2">Ocorreu um erro durante o processamento.</p>
          <div className="text-xs text-left p-2 bg-gray-50 rounded-lg border border-gray-200 mb-4 overflow-auto max-h-36">
            <p className="text-gray-600">Possíveis causas:</p>
            <ul className="list-disc pl-5 text-gray-500 mt-1">
              <li>Sessão expirada (tente fazer login novamente)</li>
              <li>API do Google ou OpenAI indisponível</li>
              <li>Formato do arquivo não suportado</li>
              <li>Tamanho do arquivo excede o limite</li>
            </ul>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={() => window.location.href = '/auth'}
              variant="default"
              className="flex-1"
            >
              Ir para login
            </Button>
            <Button 
              onClick={() => setUploadStep('idle')}
              variant="outline"
              className="flex-1"
            >
              Tentar novamente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
