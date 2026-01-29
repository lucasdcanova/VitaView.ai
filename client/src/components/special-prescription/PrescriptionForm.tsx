import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Printer, Info } from "lucide-react";
import { PrescriptionTypeKey, PRESCRIPTION_TYPES } from "@/constants/special-prescription-types";

interface PrescriptionFormProps {
    prescriptionItem: any;
    setPrescriptionItem: React.Dispatch<React.SetStateAction<any>>;
    onGeneratePDF: () => void;
    selectedType: PrescriptionTypeKey;
}

export function PrescriptionForm({
    prescriptionItem,
    setPrescriptionItem,
    onGeneratePDF,
    selectedType
}: PrescriptionFormProps) {
    const info = PRESCRIPTION_TYPES[selectedType];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dados da Prescrição
            </h3>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                    <label className="text-xs font-medium text-gray-500">Medicamento</label>
                    <Input
                        value={prescriptionItem.name || ""}
                        onChange={(e) => setPrescriptionItem((prev: any) => ({ ...prev, name: e.target.value }))}
                        placeholder="Selecione ou digite o medicamento"
                        className="h-9 text-sm mt-1"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-500">Dosagem</label>
                        <Input
                            value={prescriptionItem.dosage || ""}
                            onChange={(e) => setPrescriptionItem((prev: any) => ({ ...prev, dosage: e.target.value }))}
                            placeholder="Ex: 50mg"
                            className="h-9 text-sm mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Quantidade</label>
                        <Input
                            value={prescriptionItem.quantity || ""}
                            onChange={(e) => setPrescriptionItem((prev: any) => ({ ...prev, quantity: e.target.value }))}
                            placeholder="Ex: 30 comp"
                            className="h-9 text-sm mt-1"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500">Posologia</label>
                    <Input
                        value={prescriptionItem.frequency || ""}
                        onChange={(e) => setPrescriptionItem((prev: any) => ({ ...prev, frequency: e.target.value }))}
                        placeholder="Ex: 1 comprimido 1x ao dia"
                        className="h-9 text-sm mt-1"
                    />
                </div>

                <div>
                    <label className="text-xs font-medium text-gray-500">Observações (opcional)</label>
                    <Input
                        value={prescriptionItem.notes || ""}
                        onChange={(e) => setPrescriptionItem((prev: any) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Instruções adicionais"
                        className="h-9 text-sm mt-1"
                    />
                </div>
            </div>

            <Button
                onClick={onGeneratePDF}
                disabled={!prescriptionItem.name || !prescriptionItem.dosage || !prescriptionItem.frequency || !prescriptionItem.quantity}
                className="w-full"
                style={{ backgroundColor: info.color }}
            >
                <Printer className="h-4 w-4 mr-2" />
                Gerar Modelo de Receituário
            </Button>

            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                    Este modelo serve apenas como referência. A prescrição oficial deve ser
                    feita em formulário físico apropriado e assinada pelo médico.
                </p>
            </div>
        </div>
    );
}
