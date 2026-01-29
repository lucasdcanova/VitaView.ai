import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export interface CustomProtocol {
    id: number;
    userId: number;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    exams: { name: string; type: 'laboratorial' | 'imagem' }[];
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export function useExamProtocols() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // State
    const [createProtocolOpen, setCreateProtocolOpen] = useState(false);
    const [deleteMode, setDeleteMode] = useState(false);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [protocolsToDelete, setProtocolsToDelete] = useState<(number | string)[]>([]);
    const [newProtocolData, setNewProtocolData] = useState({
        name: "",
        icon: "FlaskConical",
        color: "blue",
        exams: [] as { name: string; type: 'laboratorial' | 'imagem' }[]
    });
    const [newProtocolSearch, setNewProtocolSearch] = useState("");

    // Reset create form when opening
    useEffect(() => {
        if (createProtocolOpen) {
            setNewProtocolData({
                name: "",
                icon: "FlaskConical",
                color: "blue",
                exams: []
            });
            setNewProtocolSearch("");
        }
    }, [createProtocolOpen]);

    // Query para protocolos customizados do usuário
    const { data: customProtocols = [] } = useQuery<CustomProtocol[]>({
        queryKey: ['/api/exam-protocols'],
        enabled: !!user,
    });

    // Mutation para criar novo protocolo
    const createProtocolMutation = useMutation({
        mutationFn: async (data: { name: string; description?: string; exams: any[]; icon?: string; color?: string }) => {
            const res = await apiRequest("POST", "/api/exam-protocols", data);
            return await res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/exam-protocols'] });
            toast({ title: "Sucesso", description: "Protocolo salvo!" });
            setCreateProtocolOpen(false);
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao salvar protocolo.", variant: "destructive" });
        }
    });

    // Bulk Delete Mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids: (number | string)[]) => {
            const customProtocolIds = ids.filter(id => typeof id === 'number') as number[];
            const systemProtocolIds = ids.filter(id => typeof id === 'string') as string[];

            const promises = [];

            // 1. Delete custom protocols
            if (customProtocolIds.length > 0) {
                promises.push(...customProtocolIds.map(id => apiRequest("DELETE", `/api/exam-protocols/${id}`)));
            }

            // 2. Hide system protocols (update user preferences)
            if (systemProtocolIds.length > 0) {
                // Get current hidden protocols
                const currentPreferences = (user?.preferences as any) || {};
                const currentHidden = (currentPreferences.hiddenProtocolIds as string[]) || [];
                const newHidden = Array.from(new Set([...currentHidden, ...systemProtocolIds]));

                promises.push(apiRequest("PATCH", "/api/user/preferences", {
                    preferences: {
                        hiddenProtocolIds: newHidden
                    }
                }));
            }

            await Promise.all(promises);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/exam-protocols'] });
            queryClient.invalidateQueries({ queryKey: ['/api/user'] }); // Refresh user to update preferences
            toast({ title: "Sucesso", description: "Protocolos excluídos/ocultados!" });
            setDeleteMode(false);
            setProtocolsToDelete([]);
            setDeleteConfirmationOpen(false);
        },
        onError: (err) => {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao excluir protocolos.", variant: "destructive" });
        }
    });

    // Handlers
    const toggleProtocolToDelete = (id: number | string) => {
        setProtocolsToDelete(prev => {
            if (prev.includes(id)) {
                return prev.filter(p => p !== id);
            }
            return [...prev, id];
        });
    };

    const handleCreateProtocol = () => {
        if (!newProtocolData.name) {
            toast({ title: "Erro", description: "Nome do protocolo é obrigatório.", variant: "destructive" });
            return;
        }
        if (newProtocolData.exams.length === 0) {
            toast({ title: "Erro", description: "Adicione pelo menos um exame.", variant: "destructive" });
            return;
        }

        createProtocolMutation.mutate({
            name: newProtocolData.name,
            icon: newProtocolData.icon,
            color: newProtocolData.color,
            exams: newProtocolData.exams,
            description: "Protocolo personalizado"
        });
    };

    return {
        // State
        customProtocols,
        createProtocolOpen, setCreateProtocolOpen,
        deleteMode, setDeleteMode,
        deleteConfirmationOpen, setDeleteConfirmationOpen,
        protocolsToDelete, setProtocolsToDelete,
        newProtocolData, setNewProtocolData,
        newProtocolSearch, setNewProtocolSearch,

        // Actions
        toggleProtocolToDelete,
        handleCreateProtocol,
        bulkDeleteMutation,
        createProtocolMutation,

        // Computed
        isPending: createProtocolMutation.isPending || bulkDeleteMutation.isPending
    };
}
