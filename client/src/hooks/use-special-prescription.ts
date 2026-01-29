import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CONTROLLED_MEDICATIONS } from "@/components/dialogs";
import { generateSpecialPrescriptionPDF } from "@/lib/special-prescription-pdf";
import { PrescriptionTypeKey } from "@/constants/special-prescription-types";

interface PrescriptionItem {
    name: string;
    dosage: string;
    frequency: string;
    quantity: string;
    notes?: string;
}

export function useSpecialPrescription(patient: { name: string }) {
    const { toast } = useToast();
    const { user } = useAuth();

    const [selectedType, setSelectedType] = useState<PrescriptionTypeKey>("B1");
    const [searchQuery, setSearchQuery] = useState("");
    const [prescriptionItem, setPrescriptionItem] = useState<Partial<PrescriptionItem>>({});

    // Filtrar medicamentos por tipo e busca
    const filteredMedications = useMemo(() => {
        return CONTROLLED_MEDICATIONS
            .filter(med => med.prescriptionType === selectedType)
            .filter(med =>
                med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                med.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
    }, [selectedType, searchQuery]);

    const handleSelectMedication = (medName: string) => {
        setPrescriptionItem(prev => ({ ...prev, name: medName }));
    };

    const handleGeneratePDF = () => {
        if (!prescriptionItem.name || !prescriptionItem.dosage || !prescriptionItem.frequency || !prescriptionItem.quantity) {
            toast({
                title: "Campos incompletos",
                description: "Preencha todos os campos obrigatórios.",
                variant: "destructive"
            });
            return;
        }

        if (!user) {
            toast({ title: "Erro", description: "Usuário não identificado.", variant: "destructive" });
            return;
        }

        generateSpecialPrescriptionPDF({
            selectedType,
            patientName: patient.name,
            doctorName: user.fullName || user.username || "",
            doctorCrm: user.crm || "",
            prescriptionItem
        });

        toast({ title: "Sucesso", description: "Modelo de receituário gerado!" });
        setPrescriptionItem({});
    };

    return {
        selectedType, setSelectedType,
        searchQuery, setSearchQuery,
        prescriptionItem, setPrescriptionItem,
        filteredMedications,
        handleSelectMedication,
        handleGeneratePDF,
        user
    };
}
