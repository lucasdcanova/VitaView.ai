import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileType, BrainCircuit } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/exams/upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      
      toast({
        title: "Upload concluído",
        description: "Seu exame foi analisado com sucesso!",
      });
      
      if (onUploadComplete) {
        onUploadComplete(data);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: error.message || "Ocorreu um erro ao enviar o arquivo.",
        variant: "destructive",
      });
    }
  });
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    // Simulate upload with progress
    setIsUploading(true);
    setUploadProgress(0);
    
    // Create a progress interval
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    // After upload is "complete", prepare form data
    setTimeout(() => {
      clearInterval(progressInterval);
      setIsUploading(false);
      setIsAnalyzing(true);
      
      const formData = new FormData();
      const file = acceptedFiles[0];
      formData.append('file', file);
      
      // Get file type
      const fileType = file.type.includes('pdf') 
        ? 'pdf' 
        : file.type.includes('jpeg') || file.type.includes('jpg')
          ? 'jpeg'
          : 'png';
      
      // Create a reader to get file content
      const reader = new FileReader();
      reader.onload = (e) => {
        // Only include the base64 portion
        const base64Content = e.target?.result 
          ? String(e.target.result).split(',')[1]
          : '';
          
        // Add other form data
        formData.append('userId', '1'); // Use actual user ID from auth context
        formData.append('name', file.name.split('.')[0]);
        formData.append('fileType', fileType);
        formData.append('fileContent', base64Content);
        
        // Call the upload mutation after a delay to simulate analysis
        setTimeout(() => {
          uploadMutation.mutate(formData);
          setIsAnalyzing(false);
        }, 3000);
      };
      
      reader.readAsDataURL(file);
    }, 2000);
  }, [uploadMutation, onUploadComplete, toast]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    disabled: isUploading || isAnalyzing
  });

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center ${
        isDragActive ? 'bg-primary-50' : !isUploading && !isAnalyzing ? 'bg-gray-50' : ''
      }`}
      {...getRootProps()}
    >
      {!isUploading && !isAnalyzing && (
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
          <p className="text-xs text-gray-500 mt-4">Formatos suportados: PDF, JPEG, PNG</p>
        </div>
      )}
      
      {isUploading && (
        <div className="space-y-4">
          <FileType className="mx-auto h-12 w-12 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-700">Enviando arquivo...</h3>
          <Progress value={uploadProgress} className="w-full h-2" />
          <p className="text-sm text-gray-500">{uploadProgress}% concluído</p>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="space-y-4">
          <BrainCircuit className="mx-auto h-12 w-12 text-primary-500" />
          <h3 className="text-lg font-medium text-gray-700">Analisando seu exame...</h3>
          <div className="flex justify-center">
            <svg className="animate-spin h-8 w-8 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-sm text-gray-500">Isso pode levar alguns minutos</p>
        </div>
      )}
    </div>
  );
}
