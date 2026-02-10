import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export interface UploadItem {
    id: string;
    file: File;
    status: 'uploading' | 'queued' | 'processing' | 'analyzed' | 'failed';
    progress: number;
    examId?: number;
    error?: string;
    name: string;
}

interface UploadContextType {
    uploads: UploadItem[];
    uploadFiles: (files: File[], profileId: number) => Promise<void>;
    clearCompleted: () => void;
    isUploading: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadManagerProvider({ children }: { children: React.ReactNode }) {
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Poll for status updates
    useEffect(() => {
        const activeUploads = uploads.filter(u => u.status === 'queued' || u.status === 'processing');
        if (activeUploads.length === 0) return;

        const interval = setInterval(async () => {
            const updatedUploads = [...uploads];
            let hasChanges = false;

            for (const upload of activeUploads) {
                if (!upload.examId) continue;

                try {
                    const response = await fetch(`/api/exams/${upload.examId}`);
                    if (response.ok) {
                        const exam = await response.json();
                        const index = updatedUploads.findIndex(u => u.id === upload.id);

                        if (index !== -1) {
                            const currentStatus = updatedUploads[index].status;
                            // Map backend status to frontend status
                            let newStatus: UploadItem['status'] = 'queued';
                            if (exam.status === 'analyzed') newStatus = 'analyzed';
                            else if (exam.status === 'failed') newStatus = 'failed';
                            else if (exam.status === 'processing' || exam.status === 'analyzing') newStatus = 'processing';
                            else if (exam.status === 'queued') newStatus = 'queued';
                            else if (exam.status === 'extracted') newStatus = 'processing';
                            else if (exam.status === 'extraction_only') newStatus = 'analyzed'; // Treat partial analysis as done

                            if (currentStatus !== newStatus) {
                                updatedUploads[index] = {
                                    ...updatedUploads[index],
                                    status: newStatus,
                                    error: exam.processingError
                                };
                                hasChanges = true;

                                if (newStatus === 'analyzed') {
                                    toast({
                                        title: "Análise concluída",
                                        description: `O exame ${upload.name} foi processado com sucesso.`
                                    });
                                    queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
                                    queryClient.invalidateQueries({ queryKey: ["/api/health-metrics/latest"] });
                                } else if (newStatus === 'failed') {
                                    toast({
                                        title: "Erro no processamento",
                                        description: `Falha ao processar ${upload.name}.`,
                                        variant: "destructive"
                                    });
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error polling status", e);
                }
            }

            if (hasChanges) {
                setUploads(updatedUploads);
            }

        }, 3000); // Poll every 3 seconds

        return () => clearInterval(interval);
    }, [uploads, toast, queryClient]);

    const uploadFiles = useCallback(async (files: File[], profileId: number) => {
        const newUploads: UploadItem[] = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            status: 'uploading',
            progress: 0,
            name: file.name
        }));

        setUploads(prev => [...prev, ...newUploads]);

        // Convert files to base64
        const filePayloads = await Promise.all(files.map(async (file) => {
            return new Promise<any>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve({
                        name: file.name,
                        fileType: file.type.includes('pdf') ? 'pdf' : 'jpeg',
                        fileContent: base64,
                        laboratoryName: "Upload Múltiplo",
                        examDate: new Date().toISOString().split('T')[0]
                    });
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        }));

        try {
            const response = await fetch("/api/exams/upload-multiple", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: filePayloads, profileId })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Falha no upload");
            }

            const data = await response.json();

            setUploads(prev => prev.map(u => {
                // Match by name (not ideal but works for now)
                const result = data.results.find((r: any) => r.name === u.name);
                if (result) {
                    return {
                        ...u,
                        status: result.status === 'queued' ? 'queued' : 'failed',
                        examId: result.examId,
                        error: result.error
                    };
                }
                // If not found in results but was part of the batch, mark as failed?
                // Or keep as uploading?
                // Let's assume if not in results, it failed.
                if (newUploads.find(nu => nu.id === u.id)) {
                    return { ...u, status: 'failed', error: "Não processado pelo servidor" };
                }
                return u;
            }));

            toast({
                title: "Upload iniciado",
                description: "Seus arquivos estão sendo processados em segundo plano."
            });

        } catch (error: any) {
            console.error("Upload error", error);
            const msg = error.message || "Não foi possível enviar os arquivos.";
            setUploads(prev => prev.map(u => newUploads.find(nu => nu.id === u.id) ? { ...u, status: 'failed', error: msg } : u));
            toast({ title: "Erro no upload", description: msg, variant: "destructive" });
        }
    }, [toast]);

    const clearCompleted = useCallback(() => {
        setUploads(prev => prev.filter(u => u.status !== 'analyzed' && u.status !== 'failed'));
    }, []);

    return (
        <UploadContext.Provider value={{ uploads, uploadFiles, clearCompleted, isUploading: uploads.some(u => u.status === 'uploading') }}>
            {children}
        </UploadContext.Provider>
    );
}

export const useUploadManager = () => {
    const context = useContext(UploadContext);
    if (!context) throw new Error("useUploadManager must be used within UploadManagerProvider");
    return context;
};
