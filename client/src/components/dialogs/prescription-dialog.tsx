import { useState } from "react";
import { generatePrescriptionPDF } from "@/lib/prescription-pdf";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText } from "lucide-react";

interface PrescriptionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doctors: any[];
    medications: any[];
    onOpenDoctorForm: () => void;
    patientName?: string;
}

export function PrescriptionDialog({
    open,
    onOpenChange,
    doctors,
    medications,
    onOpenDoctorForm,
    patientName
}: PrescriptionDialogProps) {
    const { toast } = useToast();
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const [doctorInfo, setDoctorInfo] = useState({ name: "", crm: "", specialty: "" });
    const [selectedMedicationIds, setSelectedMedicationIds] = useState<number[]>([]);
    const [prescriptionValidityDays, setPrescriptionValidityDays] = useState(30);
    const [prescriptionObservations, setPrescriptionObservations] = useState("");

    const handleGenerate = async () => {
        if (selectedMedicationIds.length === 0) {
            toast({
                title: "Erro",
                description: "Selecione pelo menos um medicamento",
                variant: "destructive",
            });
            return;
        }

        if (!doctorInfo.name || !doctorInfo.crm) {
            toast({
                title: "Erro",
                description: "Preencha os dados do médico (nome e CRM)",
                variant: "destructive",
            });
            return;
        }

        try {
            toast({
                title: "Gerando PDF...",
                description: "Aguarde enquanto preparamos o documento.",
            });

            // Find full medication objects
            const selectedMeds = medications
                .filter((m: any) => selectedMedicationIds.includes(m.id))
                .map((m: any) => ({
                    name: m.name,
                    dosage: m.dosage,
                    frequency: m.frequency,
                    format: m.format,
                    notes: m.notes,
                    dosageUnit: m.dosageUnit
                }));

            // Generate PDF Client-side
            generatePrescriptionPDF({
                doctorName: doctorInfo.name,
                doctorCrm: doctorInfo.crm,
                doctorSpecialty: doctorInfo.specialty,
                patientName: patientName || "Paciente (Visualização)",
                issueDate: new Date(),
                validUntil: new Date(Date.now() + prescriptionValidityDays * 24 * 60 * 60 * 1000),
                medications: selectedMeds,
                observations: prescriptionObservations
            });

            toast({
                title: "Sucesso",
                description: "Receituário gerado com sucesso!",
            });

            onOpenChange(false);
            setSelectedMedicationIds([]);
            setPrescriptionObservations("");
            setDoctorInfo({ name: "", crm: "", specialty: "" });
            setSelectedDoctorId(null);

        } catch (error: any) {
            console.error("Erro ao gerar receituário:", error);
            toast({
                title: "Erro",
                description: "Falha ao gerar PDF.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Renovar Prescrições</DialogTitle>
                    <DialogDescription>
                        Selecione os medicamentos para renovação e configure o receituário.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Seleção de Médico */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Médico Responsável</h3>
                        {doctors.length === 0 ? (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ Você ainda não cadastrou nenhum médico.{" "}
                                    <button
                                        type="button"
                                        onClick={onOpenDoctorForm}
                                        className="underline font-medium hover:text-yellow-900"
                                    >
                                        Cadastrar agora
                                    </button>
                                </p>
                            </div>
                        ) : (
                            <div>
                                <label className="text-sm font-medium">Selecione o Médico *</label>
                                <Select
                                    value={selectedDoctorId?.toString() || ""}
                                    onValueChange={(value) => {
                                        setSelectedDoctorId(parseInt(value));
                                        const doctor = doctors.find((d: any) => d.id === parseInt(value));
                                        if (doctor) {
                                            setDoctorInfo({
                                                name: doctor.name,
                                                crm: doctor.crm,
                                                specialty: doctor.specialty || "",
                                            });
                                        }
                                    }}
                                >
                                    <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="Selecione um médico" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {doctors.map((doctor: any) => (
                                            <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <span>{doctor.name}</span>
                                                    <span className="text-xs text-gray-500">CRM: {doctor.crm}</span>
                                                    {doctor.isDefault && (
                                                        <Badge variant="outline" className="text-xs">Padrão</Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedDoctorId && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm">
                                        <p><strong>Nome:</strong> {doctorInfo.name}</p>
                                        <p><strong>CRM:</strong> {doctorInfo.crm}</p>
                                        {doctorInfo.specialty && <p><strong>Especialidade:</strong> {doctorInfo.specialty}</p>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Seleção de Medicamentos */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Medicamentos para Renovação</h3>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const allIds = medications.map((m: any) => m.id);
                                    setSelectedMedicationIds(
                                        selectedMedicationIds.length === medications.length ? [] : allIds
                                    );
                                }}
                                className="text-xs"
                            >
                                {selectedMedicationIds.length === medications.length ? "Desmarcar Todos" : "Selecionar Todos"}
                            </Button>
                        </div>
                        <div className="border rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
                            {medications.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    Nenhum medicamento ativo encontrado
                                </p>
                            ) : (
                                medications.map((medication: any) => (
                                    <div
                                        key={medication.id}
                                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedMedicationIds.includes(medication.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedMedicationIds([...selectedMedicationIds, medication.id]);
                                                } else {
                                                    setSelectedMedicationIds(
                                                        selectedMedicationIds.filter((id) => id !== medication.id)
                                                    );
                                                }
                                            }}
                                            className="mt-1 h-4 w-4 rounded border-gray-300"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-sm">{medication.name}</h4>
                                                <Badge variant="outline" className="text-[10px]">
                                                    {medication.format}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1">
                                                {medication.dosage} • {medication.frequency}
                                            </p>
                                            {medication.notes && (
                                                <p className="text-xs text-gray-500 mt-1">{medication.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Configurações da Prescrição */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium">Configurações da Prescrição</h3>
                        <div>
                            <label className="text-sm font-medium">Validade</label>
                            <Select
                                value={prescriptionValidityDays.toString()}
                                onValueChange={(value) => setPrescriptionValidityDays(parseInt(value))}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 dias</SelectItem>
                                    <SelectItem value="60">60 dias</SelectItem>
                                    <SelectItem value="90">90 dias</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Observações (opcional)</label>
                            <Textarea
                                value={prescriptionObservations}
                                onChange={(e) => setPrescriptionObservations(e.target.value)}
                                placeholder="Informações adicionais para o paciente..."
                                className="mt-1"
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            setSelectedMedicationIds([]);
                            setPrescriptionObservations("");
                            setDoctorInfo({ name: "", crm: "", specialty: "" });
                        }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        type="button"
                        disabled={selectedMedicationIds.length === 0 || !doctorInfo.name || !doctorInfo.crm}
                    >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Receituário
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
