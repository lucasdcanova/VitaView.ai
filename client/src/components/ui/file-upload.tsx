import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileType, BrainCircuit, Sparkles, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'analyzing' | 'interpreting' | 'complete' | 'error'>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzedResult, setAnalyzedResult] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Gemini análise do documento
  const analyzeWithGeminiMutation = useMutation({
    mutationFn: async (data: { fileContent: string, fileType: string }) => {
      console.log(`Enviando requisição para /api/analyze/gemini (tamanho: ${data.fileContent.length} chars)`);
      
      const response = await fetch("/api/analyze/gemini", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na resposta da API Gemini: ${response.status}`, errorText);
        throw new Error(errorText || response.statusText);
      }
      
      const resultData = await response.json();
      console.log("Recebido resultado da análise Gemini:", resultData ? "dados recebidos" : "null");
      return resultData;
    },
    onSuccess: (data) => {
      setAnalyzedResult(data);
      setUploadStep('interpreting');
      
      // Agora vamos para o segundo passo: interpretação com OpenAI
      const patientData = {
        gender: user?.gender || 'não informado',
        age: user?.birthDate 
          ? Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) 
          : null,
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
      console.log("Enviando dados para interpretação com OpenAI:", data);
      
      const response = await fetch("/api/analyze/interpretation", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na resposta da API OpenAI: ${response.status}`, errorText);
        throw new Error(errorText || response.statusText);
      }
      
      const interpretationData = await response.json();
      console.log("Recebido resultado da interpretação OpenAI:", interpretationData ? "dados recebidos" : "null");
      return interpretationData;
    },
    onSuccess: (openaiInterpretation) => {
      // Verificar se usuário está autenticado
      if (!user || !user.id) {
        console.error("Usuário não autenticado");
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar autenticado para salvar exames. Por favor, faça login novamente.",
          variant: "destructive",
        });
        setUploadStep('error');
        return;
      }
      
      // Salvar o exame no banco de dados
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const filename = input?.files?.[0]?.name || 'Exame';
      
      // Obter o tipo de arquivo das variáveis corretas
      const fileType = analyzedResult?.fileType || 'pdf';
      
      // Alguns campos são extraídos da análise Gemini se disponíveis
      // como data do exame, médico solicitante, etc.
      const examDate = analyzedResult?.examDate || new Date().toISOString().split('T')[0];
      
      // IMPORTANTE: Removendo campos não presentes no banco de dados
      // Removendo requestingPhysician pois não existe na tabela
      
      // Para debug: vamos garantir que o userId é enviado mesmo se a sessão estiver com problemas
      console.log("Usuário autenticado:", user);
      console.log("Preparando dados do exame com ID do usuário:", user?.id);
      
      const examData = {
        name: filename.split('.')[0],
        userId: user?.id || 1, // Fallback para usuário ID 1 se não estiver logado (temporário para debug)
        fileType: fileType,
        laboratoryName: "Upload via Plataforma",
        examDate: examDate,
        status: "analyzed", // definir status como analisado
        // Removido requestingPhysician pois este campo não existe no banco de dados
        originalContent: JSON.stringify(analyzedResult).substring(0, 5000) // Limitando tamanho para evitar problemas
      };
      
      // Salvar exame completo
      saveExamMutation.mutate({
        examData,
        geminiAnalysis: analyzedResult,
        openaiInterpretation
      }, {
        onSuccess: (savedData) => {
          setUploadStep('complete');
          
          // Atualizar cache com novos dados
          queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
          queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          
          toast({
            title: "Análise concluída",
            description: "Seu exame foi analisado, interpretado e salvo com sucesso!",
          });
          
          if (onUploadComplete) {
            onUploadComplete({
              savedExam: savedData.exam,
              geminiAnalysis: analyzedResult,
              openaiInterpretation: savedData.result
            });
          }
        },
        onError: (error) => {
          console.error("Erro ao salvar exame:", error);
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
        // Verificação de autenticação desativada temporariamente para debug
        // (permitir salvamento com userId direto do objeto data)
        if (false && user === null) {
          console.error("Usuário não está autenticado ao tentar salvar exame");
          throw new Error("Você precisa estar autenticado para salvar exames");
        }
        
        console.log("Dados recebidos para salvar:", data);
        
        // Extrair dados do exame do novo formato
        const { examData: rawExamData, geminiAnalysis, openaiInterpretation } = data;
        
        // Adaptar dados para formato esperado pela API
        // Manter o userId que foi enviado no objeto original (que pode ter um fallback)
        const examData = {
          name: rawExamData.name,
          fileType: rawExamData.fileType,
          laboratoryName: rawExamData.laboratoryName,
          examDate: rawExamData.examDate,
          status: "analyzed",
          userId: rawExamData.userId, // Usar o userId que foi enviado originalmente
          requestingPhysician: rawExamData.requestingPhysician || null,
          originalContent: rawExamData.originalContent || null
        };
        
        // Criar o exame no banco de dados
        console.log("Enviando dados do exame para a API:", examData);
        const examResponse = await fetch("/api/exams", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(examData),
          credentials: "include"
        });
        
        // Log detalhado da resposta para debugging
        console.log(`Resposta da API exams: ${examResponse.status} ${examResponse.statusText}`);
        
        if (!examResponse.ok) {
          const errorText = await examResponse.text();
          console.error("Erro detalhado ao salvar exame:", errorText);
          throw new Error(`Erro ao salvar exame: ${errorText}`);
        }
        
        const savedExam = await examResponse.json();
        console.log("Exame salvo com sucesso:", savedExam);
        
        // Salvar o resultado da análise
        if (savedExam && savedExam.id) {
          // Preparar dados do resultado da análise
          // Usando tanto os dados da análise Gemini quando a interpretação do OpenAI
          const resultData = {
            examId: savedExam.id,
            summary: openaiInterpretation?.contextualAnalysis || geminiAnalysis?.summary || "Análise não disponível",
            detailedAnalysis: geminiAnalysis?.detailedAnalysis || "",
            recommendations: openaiInterpretation?.recommendations 
              ? Array.isArray(openaiInterpretation.recommendations)
                ? openaiInterpretation.recommendations.join('\n')
                : openaiInterpretation.recommendations
              : Array.isArray(geminiAnalysis?.recommendations)
                ? geminiAnalysis.recommendations.join('\n')
                : geminiAnalysis?.recommendations || "",
            healthMetrics: geminiAnalysis?.healthMetrics || [],
            aiProvider: "gemini+openai"
          };
          
          console.log("Enviando resultado da análise para a API:", resultData);
          const resultResponse = await fetch("/api/exam-results", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resultData),
            credentials: "include"
          });
          
          // Log detalhado da resposta para debugging
          console.log(`Resposta da API exam-results: ${resultResponse.status} ${resultResponse.statusText}`);
          
          if (!resultResponse.ok) {
            const errorText = await resultResponse.text();
            console.error("Erro detalhado ao salvar resultado:", errorText);
            
            // Mesmo com erro na criação do resultado, continuamos (não interrompemos)
            // - isso garante que ao menos o exame seja registrado
          } else {
            const savedResult = await resultResponse.json();
            console.log("Resultado salvo com sucesso:", savedResult);
          }
          
          // Salvar métricas de saúde individuais, se disponíveis
          if (geminiAnalysis?.healthMetrics && Array.isArray(geminiAnalysis.healthMetrics)) {
            console.log("Salvando métricas de saúde individuais:", geminiAnalysis.healthMetrics.length);
            for (const metric of geminiAnalysis.healthMetrics) {
              try {
                // Garantir que os dados estão no formato esperado pelo backend
                const metricData = {
                  userId: Number(savedExam.userId), // Usar userId do exame salvo que já foi confirmado
                  name: metric.name || "desconhecido",
                  value: String(metric.value || "0"),
                  unit: metric.unit || '',
                  status: metric.status || 'normal',
                  change: metric.change || '',
                  date: examData.examDate || new Date().toISOString() // Usar mesma data do exame
                };
                
                console.log(`Enviando métrica ${metric.name} para a API:`, metricData);
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
                  console.error(`Erro ao salvar métrica ${metric.name}:`, errorText);
                } else {
                  const savedMetric = await metricResponse.json();
                  console.log(`Métrica ${metric.name} salva com sucesso:`, savedMetric);
                }
              } catch (metricError) {
                console.error("Erro ao salvar métrica:", metricError);
              }
            }
          }
        }
        
        return {
          exam: savedExam,
          result: openaiInterpretation || {}
        };
      } catch (error: any) {
        console.error("Erro ao processar exame:", error);
        throw new Error("Falha ao processar e salvar exame: " + (error?.message || "Erro desconhecido"));
      }
    }
  });
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
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
      
      // Determinar tipo de arquivo
      const fileType = file.type.includes('pdf') 
        ? 'pdf' 
        : file.type.includes('jpeg') || file.type.includes('jpg')
          ? 'jpeg'
          : 'png';
      
      console.log(`Iniciando análise de arquivo ${file.name} (${fileType})`);
      
      // Ler o arquivo como base64
      const reader = new FileReader();
      reader.onload = (e) => {
        // Extrair apenas a parte base64 (sem o prefixo data:...)
        const base64Content = e.target?.result 
          ? String(e.target.result).split(',')[1]
          : '';
          
        // Verificar se o usuário está autenticado
        if (!user || !user.id) {
          console.error("Usuário não autenticado ao tentar analisar arquivo");
          toast({
            title: "Erro de autenticação",
            description: "Por favor, faça login novamente para continuar.",
            variant: "destructive"
          });
          setUploadStep('error');
          return;
        }
        
        // Verificação adicional dos cookies de sessão
        console.log("Cookie disponível:", document.cookie ? "Sim" : "Não");
        console.log("Usuário autenticado com ID:", user.id);
          
        // Chamar API para análise com o Gemini
        console.log(`Enviando arquivo para análise com Gemini (tamanho: ${base64Content.length} caracteres)`);
        analyzeWithGeminiMutation.mutate({
          fileContent: base64Content,
          fileType: fileType
        });
      };
      
      reader.readAsDataURL(file);
    }, 2000);
  }, [analyzeWithGeminiMutation, interpretWithOpenAIMutation, onUploadComplete, toast, user]);
  
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
          <h3 className="text-lg font-medium text-gray-700">Analisando documento com IA Gemini</h3>
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
          <h3 className="text-lg font-medium text-gray-700">Interpretando resultados com OpenAI</h3>
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