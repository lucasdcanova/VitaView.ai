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
        <Card className="border-blue-100 shadow-md h-fit">
            <CardHeader className="bg-blue-50/50 border-b border-blue-100 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                            <Pill className="h-5 w-5 text-blue-700" />
                            Medicamentos de Uso Contínuo
                        </CardTitle>
                        <CardDescription className="text-sm">Selecione para renovar receita.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {medications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                        <p>Nenhum medicamento cadastrado.</p>
                        <Button variant="link" onClick={onAddMedication} className="mt-2 text-blue-600">
                            Cadastrar Medicamento
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-blue-50">
                        <div className="p-3 bg-blue-50/30 flex items-center gap-3">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleSelectAll}
                                id="select-all"
                            />
                            <label htmlFor="select-all" className="text-sm font-medium text-blue-900 cursor-pointer select-none">
                                Selecionar Todos
                            </label>
                        </div>
                        {medications.map((med) => (
                            <div key={med.id} className="p-4 flex items-start gap-3 hover:bg-blue-50/20 transition-colors group">
                                <Checkbox
                                    checked={selectedMedications.has(med.id)}
                                    onCheckedChange={() => onToggleSelection(med.id)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">{med.name}</h4>
                                    <p className="text-sm text-gray-600 mt-0.5">
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
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-3">
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        disabled={selectedMedications.size === 0}
                        onClick={onRenewPrescription}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Renovar Selecionados ({selectedMedications.size})
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
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
