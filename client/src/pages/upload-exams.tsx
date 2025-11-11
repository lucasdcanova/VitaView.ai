import { useLocation } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import FileUpload from "@/components/ui/file-upload";
import {
  FileUpIcon,
  BrainCircuitIcon,
  FileDigitIcon,
  ShieldCheck,
  ClipboardList,
  Check
} from "lucide-react";
import { useProfiles } from "@/hooks/use-profiles";
import { Skeleton } from "@/components/ui/skeleton";
import PatientHeader from "@/components/patient-header";

export default function UploadExams() {
  const [, navigate] = useLocation();
  const { activeProfile, isLoading: isLoadingProfiles } = useProfiles();

  const handleUploadComplete = (result: any) => {
    // If we have a result with an exam ID, navigate to the report page
    if (result && result.exam && result.exam.id) {
      setTimeout(() => {
        navigate(`/report/${result.exam.id}`);
      }, 1000);
    }
  };

  if (isLoadingProfiles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
          <p className="text-gray-600 text-sm">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex flex-col">
        <MobileHeader />
        <div className="flex flex-1 relative">
          <Sidebar />
          <main className="flex-1 bg-gray-50 px-6 py-8">
            <div className="max-w-6xl mx-auto">
              <PatientHeader
                title="Envio de exames"
                description="Selecione ou cadastre um paciente para direcionar o upload dos exames."
                patient={activeProfile}
              />
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-600">
                <h2 className="text-lg font-semibold text-gray-800">Nenhum paciente selecionado</h2>
                <p className="text-sm text-gray-500 mt-2">
                  Utilize o seletor acima para criar ou escolher um paciente antes de enviar documentos clínicos.
                </p>
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
            <PatientHeader
              title="Envio de exames"
              description={`Os novos documentos serão vinculados ao prontuário de ${activeProfile.name}.`}
              patient={activeProfile}
            />
            
            {/* Informação sobre limites de upload */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-primary-800 mb-1">Limites de Upload</h3>
                  <p className="text-sm text-primary-700">
                    <span className="font-medium">Plano Gratuito:</span> 1 arquivo por vez • 
                    <span className="font-medium ml-2">Assinantes:</span> Upload ilimitado
                  </p>
                </div>
                <div className="text-primary-600">
                  <FileUpIcon size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-2">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Carregue seus exames</h2>
                
                <FileUpload onUploadComplete={handleUploadComplete} />
                
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium text-gray-800">Como funciona</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 mb-3">
                        <FileUpIcon size={18} />
                      </div>
                      <h4 className="font-medium text-gray-800 mb-1">1. Envie</h4>
                      <p className="text-sm text-gray-600">Envie seus exames em formato PDF, JPEG ou PNG.</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 mb-3">
                        <BrainCircuitIcon size={18} />
                      </div>
                      <h4 className="font-medium text-gray-800 mb-1">2. IA analisa</h4>
                      <p className="text-sm text-gray-600">Nossa IA OpenAI GPT-5 analisa seus documentos.</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 mb-3">
                        <FileDigitIcon size={18} />
                      </div>
                      <h4 className="font-medium text-gray-800 mb-1">3. Resultados</h4>
                      <p className="text-sm text-gray-600">Receba um relatório completo e recomendações personalizadas.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 md:col-span-1">
                <h2 className="text-lg font-semibold mb-4 text-gray-800">Dicas</h2>
                
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex">
                      <ClipboardList className="text-yellow-500 mt-1 mr-3 flex-shrink-0" size={18} />
                      <div>
                        <h4 className="font-medium text-gray-800">Qualidade dos documentos</h4>
                        <p className="text-sm text-gray-600 mt-1">Envie imagens com boa resolução e nitidez para melhor análise.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary-50 p-4 rounded-lg">
                    <div className="flex">
                      <FileDigitIcon className="text-primary-500 mt-1 mr-3 flex-shrink-0" size={18} />
                      <div>
                        <h4 className="font-medium text-gray-800">Múltiplos exames</h4>
                        <p className="text-sm text-gray-600 mt-1">Envie vários exames simultaneamente para uma análise integrada completa.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex">
                      <ShieldCheck className="text-green-500 mt-1 mr-3 flex-shrink-0" size={18} />
                      <div>
                        <h4 className="font-medium text-gray-800">Privacidade garantida</h4>
                        <p className="text-sm text-gray-600 mt-1">Seus exames são tratados com segurança e confidencialidade.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
