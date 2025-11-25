import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, BrainCircuit, CheckCircle2, AlertCircle } from "lucide-react";
import { useUploadManager } from "@/hooks/use-upload-manager";
import { useProfiles } from "@/hooks/use-profiles";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const { uploadFiles, uploads } = useUploadManager();
  const { activeProfile } = useProfiles();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    if (!activeProfile) {
      toast({
        title: "Selecione um paciente",
        description: "Escolha um paciente antes de enviar exames.",
        variant: "destructive"
      });
      return;
    }

    uploadFiles(acceptedFiles, activeProfile.id);
  }, [activeProfile, uploadFiles, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxFiles: 10
  });

  return (
    <div className="space-y-6">
      <div
        className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors ${isDragActive ? 'bg-primary-50 border-primary-500' : 'bg-gray-50 hover:bg-gray-100'
          }`}
        {...getRootProps()}
      >
        <Upload className={`mx-auto h-12 w-12 mb-3 ${isDragActive ? 'text-primary-500' : 'text-gray-400'}`} />
        <h3 className="text-lg font-medium text-gray-700 mb-1">
          {isDragActive ? "Solte os arquivos aqui" : "Arraste seus arquivos aqui"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">ou</p>
        <Button variant="outline" type="button">Selecionar arquivos</Button>
        <input {...getInputProps()} />
        <p className="text-xs text-gray-500 mt-4">PDF, JPEG, PNG (máx. 50MB)</p>
      </div>

      {/* Active Uploads List */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700">Status dos Envios</h4>
            <span className="text-xs text-gray-500">{uploads.length} arquivos</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {uploads.map((upload) => (
              <div key={upload.id} className="bg-white p-3 rounded-lg border flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="flex-shrink-0">
                    {upload.status === 'analyzed' ? <CheckCircle2 className="text-green-500 h-5 w-5" /> :
                      upload.status === 'failed' ? <AlertCircle className="text-red-500 h-5 w-5" /> :
                        <BrainCircuit className="text-primary-500 animate-pulse h-5 w-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{upload.name}</p>
                    <p className="text-xs text-gray-500">
                      {upload.status === 'queued' && 'Na fila...'}
                      {upload.status === 'uploading' && 'Enviando...'}
                      {upload.status === 'processing' && 'Processando com IA...'}
                      {upload.status === 'analyzed' && 'Concluído'}
                      {upload.status === 'failed' && (upload.error || 'Erro')}
                    </p>
                  </div>
                </div>
                {upload.status === 'analyzed' && upload.examId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-primary-600 hover:text-primary-700 hover:bg-primary-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/report/${upload.examId}`;
                    }}
                  >
                    Ver Resultado
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
