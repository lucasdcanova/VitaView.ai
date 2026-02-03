import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, PlusCircle, RefreshCw, Trash2, Pencil } from "lucide-react";
import { MedicationDialog } from "@/components/dialogs";
import type { MedicationFormData } from "@/components/dialogs";

interface ContinuousMedicationsCardProps {
    medications: any[];
    selectedMedications: Set<number>;
    onToggleSelection: (id: number) => void;
    onToggleSelectAll: () => void;
    onAddMedication: () => void;
    onEditMedication: (med: any) => void;
    onDeleteMedication: (id: number) => void;
    onRenewPrescription: () => void;
}

export function ContinuousMedicationsCard({
    medications,
    selectedMedications,
    onToggleSelection,
    onToggleSelectAll,
    onAddMedication,
    onEditMedication,
    onDeleteMedication,
    onRenewPrescription
}: ContinuousMedicationsCardProps) {
    const allSelected = medications.length > 0 && selectedMedications.size === medications.length;

    return (
        <Card className="border-gray-200 shadow-sm h-fit">
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-gray-600" />
                            Medicamentos de Uso Contínuo
                        </CardTitle>
                        <CardDescription className="text-xs">Selecione para renovar receita.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {medications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        <p className="text-sm">Nenhum medicamento cadastrado.</p>
                        <Button variant="link" onClick={onAddMedication} className="mt-2 text-gray-600 text-sm">
                            Cadastrar Medicamento
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        <div className="p-3 bg-gray-50 flex items-center gap-3">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleSelectAll}
                                id="select-all"
                            />
                            <label htmlFor="select-all" className="text-xs font-medium text-gray-700 cursor-pointer select-none">
                                Selecionar Todos
                            </label>
                        </div>
                        {medications.map((med) => (
                            <div key={med.id} className="p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors group">
                                <Checkbox
                                    checked={selectedMedications.has(med.id)}
                                    onCheckedChange={() => onToggleSelection(med.id)}
                                    className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm text-gray-900">{med.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {med.dosage} {med.dosageUnit} - {med.frequency}
                                    </p>
                                    {med.notes && (
                                        <p className="text-xs text-gray-500 mt-1 italic">Obs: {med.notes}</p>
                                    )}
                                </div>
                                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEditMedication(med)}
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onDeleteMedication(med.id)}
                                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-3 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
                    <Button
                        className="w-full bg-gray-800 hover:bg-gray-900 text-white shadow-sm text-sm"
                        disabled={selectedMedications.size === 0}
                        onClick={onRenewPrescription}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renovar Selecionados ({selectedMedications.size})
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full border-gray-200 text-gray-700 hover:bg-gray-100 text-sm"
                        onClick={onAddMedication}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Novo Medicamento
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
