import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema, type MedicationFormData } from "@/components/dialogs";

export interface MedicationHistoryEntry {
    id: number;
    medicationId?: number | null;
    profileId?: number | null;
    eventType: "started" | "stopped" | "updated";
    name: string;
    format?: string | null;
    dosage?: string | null;
    dosageUnit?: string | null;
    frequency?: string | null;
    notes?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    occurredAt: string;
    metadata?: unknown;
}

const invalidateMedicationQueries = (queryClient: ReturnType<typeof useQueryClient>) =>
    queryClient.invalidateQueries({
        predicate: (query) => {
            const key = query.queryKey[0];
            return typeof key === "string" && key.startsWith("/api/medications");
        },
    });

export function useContinuousMedications(profileId?: number | null) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState<any>(null);
    const [selectedMedications, setSelectedMedications] = useState<Set<number>>(new Set());

    useEffect(() => {
        setSelectedMedications(new Set());
    }, [profileId]);

    const medicationsUrl = profileId ? `/api/medications?profileId=${profileId}` : "/api/medications";
    const historyUrl = profileId ? `/api/medications/history?profileId=${profileId}` : null;

    const { data: medications = [], isLoading } = useQuery<any[]>({
        queryKey: [medicationsUrl],
    });

    const { data: history = [] } = useQuery<MedicationHistoryEntry[]>({
        queryKey: [historyUrl || "/api/medications/history"],
        enabled: Boolean(historyUrl),
    });

    const medicationForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            name: "",
            format: "comprimido",
            dosage: "",
            dosageUnit: "mg",
            frequency: "",
            doseAmount: 1,
            prescriptionType: "padrao",
            quantity: "",
            administrationRoute: "oral",
            startDate: new Date().toISOString().split("T")[0],
            notes: "",
        },
    });

    const editMedicationForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            name: "",
            format: "comprimido",
            dosage: "",
            dosageUnit: "mg",
            frequency: "",
            doseAmount: 1,
            prescriptionType: "padrao",
            quantity: "",
            administrationRoute: "oral",
            startDate: "",
            notes: "",
        },
    });

    const addMedicationMutation = useMutation({
        mutationFn: (data: MedicationFormData) =>
            apiRequest("POST", "/api/medications", {
                ...data,
                profileId: profileId ?? undefined,
            }),
        onSuccess: async () => {
            await invalidateMedicationQueries(queryClient);
            medicationForm.reset();
            setIsDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento adicionado com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao adicionar medicamento.", variant: "destructive" });
        },
    });

    const editMedicationMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: MedicationFormData }) =>
            apiRequest("PUT", `/api/medications/${id}`, {
                ...data,
                profileId: profileId ?? undefined,
            }),
        onSuccess: async () => {
            await invalidateMedicationQueries(queryClient);
            editMedicationForm.reset();
            setEditingMedication(null);
            setIsDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento atualizado com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao atualizar medicamento.", variant: "destructive" });
        },
    });

    const deleteMedicationMutation = useMutation({
        mutationFn: (id: number) =>
            apiRequest("DELETE", `/api/medications/${id}`, {
                profileId: profileId ?? undefined,
            }),
        onSuccess: async () => {
            await invalidateMedicationQueries(queryClient);
            toast({ title: "Sucesso", description: "Medicamento excluído com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao excluir medicamento.", variant: "destructive" });
        },
    });

    const openAddDialog = () => {
        setEditingMedication(null);
        medicationForm.reset({
            name: "",
            format: "comprimido",
            dosage: "",
            dosageUnit: "mg",
            frequency: "",
            doseAmount: 1,
            prescriptionType: "padrao",
            quantity: "",
            administrationRoute: "oral",
            startDate: new Date().toISOString().split("T")[0],
            notes: "",
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (medication: any) => {
        setEditingMedication(medication);
        editMedicationForm.reset({
            name: medication.name,
            format: medication.format,
            dosage: medication.dosage,
            dosageUnit: medication.dosageUnit || medication.dosage_unit || "mg",
            frequency: medication.frequency,
            doseAmount: medication.doseAmount || medication.dose_amount || 1,
            prescriptionType: medication.prescriptionType || medication.prescription_type || "padrao",
            quantity: medication.quantity || "",
            administrationRoute: medication.administrationRoute || medication.administration_route || "oral",
            startDate: medication.startDate ? medication.startDate.split("T")[0] : "",
            notes: medication.notes || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (data: MedicationFormData) => {
        if (editingMedication) {
            editMedicationMutation.mutate({ id: editingMedication.id, data });
            return;
        }

        addMedicationMutation.mutate(data);
    };

    const handleDelete = (id?: number) => {
        if (id) {
            deleteMedicationMutation.mutate(id);
            return;
        }

        if (editingMedication) {
            deleteMedicationMutation.mutate(editingMedication.id);
            setEditingMedication(null);
            setIsDialogOpen(false);
        }
    };

    const toggleSelection = (id: number) => {
        setSelectedMedications((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (medications.length === 0) return;

        if (selectedMedications.size === medications.length) {
            setSelectedMedications(new Set());
            return;
        }

        setSelectedMedications(new Set(medications.map((medication: any) => medication.id)));
    };

    return {
        medications,
        history,
        isLoading,
        isDialogOpen,
        setIsDialogOpen,
        editingMedication,
        selectedMedications,
        setSelectedMedications,
        medicationForm,
        editMedicationForm,
        openAddDialog,
        openEditDialog,
        handleSubmit,
        handleDelete,
        toggleSelection,
        toggleSelectAll,
        isPending: addMedicationMutation.isPending || editMedicationMutation.isPending || deleteMedicationMutation.isPending,
    };
}
