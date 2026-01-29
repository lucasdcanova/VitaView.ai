import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { medicationSchema, type MedicationFormData } from "@/components/dialogs";

export function useContinuousMedications() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Dialog & Selection State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState<any>(null);
    const [selectedMedications, setSelectedMedications] = useState<Set<number>>(new Set());

    // Fetches continuous medications
    const { data: medications = [], isLoading } = useQuery<any[]>({
        queryKey: ["/api/medications"],
    });

    // Forms
    const medicationForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            name: "", format: "comprimido", dosage: "", dosageUnit: "mg",
            frequency: "", doseAmount: 1, prescriptionType: "padrao",
            quantity: "", administrationRoute: "oral", startDate: new Date().toISOString().split('T')[0], notes: "",
        },
    });

    const editMedicationForm = useForm<MedicationFormData>({
        resolver: zodResolver(medicationSchema),
        defaultValues: {
            name: "", format: "comprimido", dosage: "", dosageUnit: "mg",
            frequency: "", doseAmount: 1, prescriptionType: "padrao",
            quantity: "", administrationRoute: "oral", startDate: "", notes: "",
        },
    });


    // Mutations
    const addMedicationMutation = useMutation({
        mutationFn: (data: MedicationFormData) => apiRequest("POST", "/api/medications", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            medicationForm.reset();
            setIsDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento adicionado com sucesso!" });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: "Erro ao adicionar medicamento.", variant: "destructive" });
        },
    });

    const editMedicationMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: MedicationFormData }) =>
            apiRequest("PUT", `/api/medications/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            editMedicationForm.reset();
            setEditingMedication(null);
            setIsDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento atualizado com sucesso!" });
        },
        onError: (error: Error) => {
            toast({ title: "Erro", description: "Erro ao atualizar medicamento.", variant: "destructive" });
        },
    });

    const deleteMedicationMutation = useMutation({
        mutationFn: (id: number) => apiRequest("DELETE", `/api/medications/${id}`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            toast({ title: "Sucesso", description: "Medicamento excluído com sucesso!" });
        },
        onError: () => {
            toast({ title: "Erro", description: "Erro ao excluir medicamento.", variant: "destructive" });
        },
    });

    // Handlers
    const openAddDialog = () => {
        setEditingMedication(null);
        medicationForm.reset();
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
            startDate: medication.startDate ? medication.startDate.split('T')[0] : "",
            notes: medication.notes || "",
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = (data: MedicationFormData) => {
        if (editingMedication) {
            editMedicationMutation.mutate({ id: editingMedication.id, data });
        } else {
            addMedicationMutation.mutate(data);
        }
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

    // Selection Handlers
    const toggleSelection = (id: number) => {
        setSelectedMedications(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (medications.length === 0) return;
        if (selectedMedications.size === medications.length) {
            setSelectedMedications(new Set());
        } else {
            setSelectedMedications(new Set(medications.map((m: any) => m.id)));
        }
    };

    return {
        medications,
        isLoading,
        isDialogOpen, setIsDialogOpen,
        editingMedication,
        selectedMedications, setSelectedMedications,
        medicationForm,
        editMedicationForm,
        openAddDialog,
        openEditDialog,
        handleSubmit,
        handleDelete,
        toggleSelection,
        toggleSelectAll,
        isPending: addMedicationMutation.isPending || editMedicationMutation.isPending
    };
}
