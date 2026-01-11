import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pill, PlusCircle, Edit2, Trash2, RotateCcw } from "lucide-react";
import {
    MedicationDialog,
    PrescriptionDialog,
    medicationSchema,
    type MedicationFormData
} from "@/components/dialogs";

type MedicationForm = MedicationFormData;

export function ActiveMedicationsCard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isMedicationDialogOpen, setIsMedicationDialogOpen] = useState(false);
    const [isEditMedicationDialogOpen, setIsEditMedicationDialogOpen] = useState(false);
    const [editingMedication, setEditingMedication] = useState<any>(null);
    const [isPrescriptionDialogOpen, setIsPrescriptionDialogOpen] = useState(false);
    const [isDoctorFormDialogOpen, setIsDoctorFormDialogOpen] = useState(false); // We might need to handle this properly if prescription renewal needs a doctor

    const { data: medications = [], isLoading: medicationsLoading } = useQuery<any[]>({
        queryKey: ["/api/medications"],
    });

    const { data: doctors = [] } = useQuery<any[]>({
        queryKey: ["/api/doctors"],
    });

    const medicationForm = useForm<MedicationForm>({
        resolver: zodResolver(medicationSchema),
        defaultValues: { name: "", format: "comprimido", dosage: "", dosageUnit: "mg", frequency: "", startDate: new Date().toISOString().split('T')[0], notes: "" },
    });

    const editMedicationForm = useForm<MedicationForm>({
        resolver: zodResolver(medicationSchema),
        defaultValues: { name: "", format: "comprimido", dosage: "", dosageUnit: "mg", frequency: "", startDate: "", notes: "" },
    });

    // Mutations
    const addMedicationMutation = useMutation({
        mutationFn: (data: MedicationForm) => apiRequest("POST", "/api/medications", data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            medicationForm.reset();
            setIsMedicationDialogOpen(false);
            toast({ title: "Sucesso", description: "Medicamento adicionado!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao adicionar medicamento.", variant: "destructive" }),
    });

    const editMedicationMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: MedicationForm }) => apiRequest("PUT", `/api/medications/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            editMedicationForm.reset();
            setIsEditMedicationDialogOpen(false);
            setEditingMedication(null);
            toast({ title: "Sucesso", description: "Medicamento atualizado!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
    });

    const deleteMedicationMutation = useMutation({
        mutationFn: (id: number) => apiRequest("DELETE", `/api/medications/${id}`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/medications"] });
            toast({ title: "Sucesso", description: "Medicamento removido." });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao remover.", variant: "destructive" }),
    });

    const handleEditMedication = (med: any) => {
        setEditingMedication(med);
        editMedicationForm.reset({
            name: med.name,
            format: med.format,
            dosage: med.dosage,
            dosageUnit: "mg",
            frequency: med.frequency,
            startDate: med.startDate ? med.startDate.split('T')[0] : "",
            notes: med.notes || "",
        });
        setIsEditMedicationDialogOpen(true);
    };

    return (
        <>
            <Card className="border-indigo-100 shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Pill className="h-5 w-5 text-indigo-600" />
                            Medicamentos em Uso
                        </CardTitle>
                        <CardDescription>Uso contínuo e ativos</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setIsPrescriptionDialogOpen(true)} className="gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                            <RotateCcw className="h-4 w-4" /> Renovar Receita
                        </Button>
                        <Button size="sm" onClick={() => setIsMedicationDialogOpen(true)} className="gap-1">
                            <PlusCircle className="h-4 w-4" /> Adicionar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {medicationsLoading ? (
                        <div className="text-center py-4 text-gray-400">Carregando...</div>
                    ) : medications.length > 0 ? (
                        <div className="space-y-3">
                            {medications.map((med) => (
                                <div key={med.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-100 transition-colors">
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{med.name}</h4>
                                        <p className="text-sm text-gray-600">{med.dosage} • {med.frequency}</p>
                                        {med.notes && <p className="text-xs text-gray-500 mt-1 italic">{med.notes}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={() => handleEditMedication(med)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => deleteMedicationMutation.mutate(med.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-6">Nenhum medicamento ativo cadastrado.</p>
                    )}
                </CardContent>
            </Card>

            <MedicationDialog open={isMedicationDialogOpen} onOpenChange={setIsMedicationDialogOpen} form={medicationForm} onSubmit={(data) => addMedicationMutation.mutate(data)} isPending={addMedicationMutation.isPending} mode="create" />
            <MedicationDialog open={isEditMedicationDialogOpen} onOpenChange={setIsEditMedicationDialogOpen} form={editMedicationForm} onSubmit={(data) => { if (editingMedication) editMedicationMutation.mutate({ id: editingMedication.id, data }); }} isPending={editMedicationMutation.isPending} mode="edit" />

            <PrescriptionDialog
                open={isPrescriptionDialogOpen}
                onOpenChange={setIsPrescriptionDialogOpen}
                doctors={doctors}
                medications={medications}
                onOpenDoctorForm={() => { }} // We might not need this here or can implement if needed
                patientName="Paciente (Visualização)"
            />
        </>
    );
}
