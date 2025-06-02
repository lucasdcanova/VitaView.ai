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

export default function UploadExams() {
  const [, navigate] = useLocation();
  
  const handleUploadComplete = (result: any) => {
    // If we have a result with an exam ID, navigate to the report page
    if (result && result.exam && result.exam.id) {
      setTimeout(() => {
        navigate(`/report/${result.exam.id}`);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader />
      
      <div className="flex flex-1 relative">
        <Sidebar />
        
        <main className="flex-1">
          <div className="p-4 md:p-6">
            <header className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Enviar Exames</h1>
              <p className="text-gray-600">Envie seus exames para análise pela IA</p>
            </header>
            
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
                      <p className="text-sm text-gray-600">Nossa IA Google Gemini analisa seus documentos.</p>
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
                
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">Exames recomendados</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2 flex-shrink-0" size={16} />
                      <span>Hemograma Completo</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2 flex-shrink-0" size={16} />
                      <span>Perfil Lipídico</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2 flex-shrink-0" size={16} />
                      <span>Glicemia em Jejum</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2 flex-shrink-0" size={16} />
                      <span>Vitamina D</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="text-green-500 mr-2 flex-shrink-0" size={16} />
                      <span>TSH e T4 livre</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
