import { useEffect, useMemo, useState } from "react";
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
    const [hardDeletedMedicationIds, setHardDeletedMedicationIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        setSelectedMedications(new Set());
        setHardDeletedMedicationIds(new Set());
    }, [profileId]);

    const medicationsUrl = profileId ? `/api/medications?profileId=${profileId}` : "/api/medications";
    const previousMedicationsUrl = profileId
        ? `/api/medications?profileId=${profileId}&status=inactive`
        : "/api/medications?status=inactive";
    const historyUrl = profileId ? `/api/medications/history?profileId=${profileId}` : null;

    const { data: medications = [], isLoading } = useQuery<any[]>({
        queryKey: [medicationsUrl],
    });

    const { data: previousMedications = [] } = useQuery<any[]>({
        queryKey: [previousMedicationsUrl],
    });

    const { data: history = [] } = useQuery<MedicationHistoryEntry[]>({
        queryKey: [historyUrl || "/api/medications/history"],
        enabled: Boolean(historyUrl),
    });

    const filteredPreviousMedications = useMemo(() => {
        const activeMedicationIds = new Set(
            medications.map((medication: any) => medication.id)
        );

        const inactiveMedications = previousMedications.filter((medication: any) => {
            const isStopped = medication?.isActive === false || Boolean(medication?.endDate);
            return isStopped && !activeMedicationIds.has(medication.id) && !hardDeletedMedicationIds.has(medication.id);
        });

        const stoppedHistoryEntries = history
            .filter((entry) => entry.eventType === "stopped")
            .map((entry) => ({
                id: entry.medicationId ?? `history-${entry.id}`,
                medicationId: entry.medicationId ?? null,
                name: entry.name,
                format: entry.format,
                dosage: entry.dosage,
                dosageUnit: entry.dosageUnit,
                frequency: entry.frequency,
                notes: entry.notes,
                startDate: entry.startDate,
                endDate: entry.endDate,
                isActive: false,
                createdAt: entry.occurredAt,
                prescriptionType:
                    typeof entry.metadata === "object" &&
                    entry.metadata !== null &&
                    "prescriptionType" in entry.metadata
                        ? (entry.metadata as { prescriptionType?: string }).prescriptionType ?? "padrao"
                        : "padrao",
            }))
            .filter((entry) =>
                !activeMedicationIds.has(entry.medicationId ?? -1) &&
                !hardDeletedMedicationIds.has(entry.medicationId ?? -1)
            );

        const previousByKey = new Map<string, any>();

        [...inactiveMedications, ...stoppedHistoryEntries].forEach((medication) => {
            const normalizedMedicationId =
                typeof medication.medicationId === "number"
                    ? medication.medicationId
                    : typeof medication.id === "number"
                        ? medication.id
                        : null;

            const key = normalizedMedicationId !== null
                ? `medication-${normalizedMedicationId}`
                : `${medication.name}-${medication.startDate || ""}-${medication.endDate || ""}`;

            if (!previousByKey.has(key)) {
                previousByKey.set(key, medication);
            }
        });

        return Array.from(previousByKey.values());
    }, [hardDeletedMedicationIds, history, medications, previousMedications]);

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
        onSuccess: async (_, deletedId) => {
            setHardDeletedMedicationIds((prev) => {
                const next = new Set(prev);
                next.add(deletedId);
                return next;
            });
            queryClient.setQueryData<any[]>([medicationsUrl], (current = []) =>
                current.filter((medication) => medication.id !== deletedId)
            );
            queryClient.setQueryData<any[]>([previousMedicationsUrl], (current = []) =>
                current.filter((medication) => medication.id !== deletedId)
            );
            if (historyUrl) {
                queryClient.setQueryData<MedicationHistoryEntry[]>([historyUrl], (current = []) =>
                    current.filter((entry) => entry.medicationId !== deletedId)
                );
            }
            await invalidateMedicationQueries(queryClient);
            setSelectedMedications((prev) => new Set([...prev].filter((selectedId) => selectedId !== deletedId)));
            setEditingMedication((current: any) => (current?.id === deletedId ? null : current));
            setIsDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento excluído com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao excluir medicamento.", variant: "destructive" });
        },
    });

    const stopMedicationMutation = useMutation({
        mutationFn: ({ id, endDate }: { id: number; endDate: string }) =>
            apiRequest("POST", `/api/medications/${id}/suspend`, {
                profileId: profileId ?? undefined,
                endDate,
            }),
        onSuccess: async (_, variables) => {
            await invalidateMedicationQueries(queryClient);
            setSelectedMedications((prev) => new Set([...prev].filter((selectedId) => selectedId !== variables.id)));
            toast({ title: "Sucesso", description: "Medicamento movido para o histórico prévio." });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao cessar uso do medicamento.", variant: "destructive" });
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

    const handleStopMedication = (id: number, endDate: string) => {
        stopMedicationMutation.mutate({ id, endDate });
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
        previousMedications: filteredPreviousMedications,
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
        handleStopMedication,
        toggleSelection,
        toggleSelectAll,
        isPending:
            addMedicationMutation.isPending ||
            editMedicationMutation.isPending ||
            deleteMedicationMutation.isPending ||
            stopMedicationMutation.isPending,
    };
}
