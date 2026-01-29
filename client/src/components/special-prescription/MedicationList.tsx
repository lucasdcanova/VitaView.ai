import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Pill } from "lucide-react";
import { PrescriptionTypeKey, PRESCRIPTION_TYPES } from "@/constants/special-prescription-types";

interface MedicationListProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredMedications: any[];
    selectedMedicationName?: string;
    onSelectMedication: (name: string) => void;
    selectedType: PrescriptionTypeKey;
}

export function MedicationList({
    searchQuery,
    setSearchQuery,
    filteredMedications,
    selectedMedicationName,
    onSelectMedication,
    selectedType
}: MedicationListProps) {
    const info = PRESCRIPTION_TYPES[selectedType];

    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar medicamento..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-sm"
                />
            </div>

            <div className="grid gap-2 max-h-[300px] overflow-y-auto">
                {filteredMedications.length > 0 ? (
                    filteredMedications.map((med) => (
                        <button
                            key={med.name}
                            onClick={() => onSelectMedication(med.name)}
                            className={`p-3 text-left rounded-lg border transition-all ${selectedMedicationName === med.name
                                ? `${info.bgColor} ${info.borderColor} border-2`
                                : 'bg-white border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-gray-900">{med.name}</span>
                                    <span className="text-xs text-gray-500 ml-2">{med.category}</span>
                                </div>
                                {selectedMedicationName === med.name && (
                                    <Badge variant="secondary" className={info.textColor}>Selecionado</Badge>
                                )}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        <Pill className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhum medicamento encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
}
