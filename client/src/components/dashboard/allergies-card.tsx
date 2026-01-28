import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PlusCircle, Edit2, Trash2 } from "lucide-react";
import {
    AllergyDialog,
    allergySchema,
    type AllergyFormData
} from "@/components/dialogs";

type AllergyForm = AllergyFormData;

interface AllergiesCardProps {
    profileId?: number;
    allergies?: any[]; // Optional - if provided, will use this data instead of fetching
}

export function AllergiesCard({ profileId, allergies: propAllergies }: AllergiesCardProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [isAllergyDialogOpen, setIsAllergyDialogOpen] = useState(false);
    const [isEditAllergyDialogOpen, setIsEditAllergyDialogOpen] = useState(false);
    const [editingAllergy, setEditingAllergy] = useState<any>(null);

    const queryKey = profileId
        ? [`/api/allergies/patient/${profileId}`]
        : ["/api/allergies"];

    // Only fetch if allergies are not provided as props
    const { data: fetchedAllergies = [], isLoading: allergiesLoading } = useQuery<any[]>({
        queryKey,
        enabled: !propAllergies && profileId !== undefined // Disable fetch if data provided via props
    });

    // Use prop data if available, otherwise use fetched data
    const allergies = propAllergies || fetchedAllergies;

    const allergyForm = useForm<AllergyForm>({
        resolver: zodResolver(allergySchema),
        defaultValues: { allergen: "", allergenType: "medication", reaction: "", severity: undefined, notes: "" },
    });

    const editAllergyForm = useForm<AllergyForm>({
        resolver: zodResolver(allergySchema),
        defaultValues: { allergen: "", allergenType: "medication", reaction: "", severity: undefined, notes: "" },
    });

    // Mutations
    const addAllergyMutation = useMutation({
        mutationFn: (data: AllergyForm) => apiRequest("POST", "/api/allergies", { ...data, profileId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            allergyForm.reset();
            setIsAllergyDialogOpen(false);
            toast({ title: "Sucesso", description: "Alergia registrada!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao registrar alergia.", variant: "destructive" }),
    });

    const editAllergyMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: AllergyForm }) => apiRequest("PUT", `/api/allergies/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            setIsEditAllergyDialogOpen(false);
            setEditingAllergy(null);
            toast({ title: "Sucesso", description: "Alergia atualizada!" });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
    });

    const deleteAllergyMutation = useMutation({
        mutationFn: (id: number) => apiRequest("DELETE", `/api/allergies/${id}`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            toast({ title: "Sucesso", description: "Alergia removida." });
        },
        onError: () => toast({ title: "Erro", description: "Falha ao remover.", variant: "destructive" }),
    });

    const handleEditAllergy = (al: any) => {
        setEditingAllergy(al);
        editAllergyForm.reset({
            allergen: al.allergen,
            allergenType: al.allergenType,
            reaction: al.reaction || "",
            severity: al.severity,
            notes: al.notes || "",
        });
        setIsEditAllergyDialogOpen(true);
    };

    return (
        <>
            <Card className="border-red-100 shadow-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Alergias e Reações
                        </CardTitle>

                    </div>
                    <Button size="sm" variant="outline" onClick={() => setIsAllergyDialogOpen(true)} className="gap-1 text-red-600 border-red-200 hover:bg-red-50">
                        <PlusCircle className="h-4 w-4" /> Registrar
                    </Button>
                </CardHeader>
                <CardContent>
                    {allergiesLoading ? (
                        <div className="text-center py-4 text-gray-400">Carregando...</div>
                    ) : allergies.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allergies.map((alg) => (
                                <div key={alg.id} className="flex items-start justify-between p-3 bg-red-50/50 rounded-lg border border-red-100">
                                    <div className="flex-1 flex flex-wrap items-center gap-2">
                                        <h4 className="font-semibold text-gray-900">{alg.allergen}</h4>
                                        <span className="text-sm text-gray-500">({alg.severity || "Não especificado"})</span>
                                        <span className="text-sm text-gray-700">{alg.reaction}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-700" onClick={() => handleEditAllergy(alg)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-700" onClick={() => deleteAllergyMutation.mutate(alg.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-6">Nenhuma alergia registrada.</p>
                    )}
                </CardContent>
            </Card>

            <AllergyDialog open={isAllergyDialogOpen} onOpenChange={setIsAllergyDialogOpen} form={allergyForm} onSubmit={(data) => addAllergyMutation.mutate(data)} isPending={addAllergyMutation.isPending} mode="create" />
            <AllergyDialog open={isEditAllergyDialogOpen} onOpenChange={setIsEditAllergyDialogOpen} form={editAllergyForm} onSubmit={(data) => { if (editingAllergy) editAllergyMutation.mutate({ id: editingAllergy.id, data }); }} isPending={editAllergyMutation.isPending} mode="edit" />
        </>
    );
}
