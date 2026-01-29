import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PlusCircle, Search, ChevronsUpDown, Sparkles, RefreshCw, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ALL_MEDICATIONS_WITH_PRESENTATIONS,
    MEDICATION_DATABASE,
    FREQUENCIES,
    DOSAGE_UNITS,
    getMedicationIcon
} from "@/components/dialogs";

interface MedicationSelectorProps {
    onAdd: (name: string, freq: string, dose: string, unit: string, qty: string) => void;
    searchValue: string;
    setSearchValue: (val: string) => void;
    daysOfUse: string;
    setDaysOfUse: (val: string) => void;
    notes: string;
    setNotes: (val: string) => void;
    dose: string;
    setDose: (val: string) => void;
    doseUnit: string;
    setDoseUnit: (val: string) => void;
    quantity: string;
    openCustomMedicationDialog: () => void;
}

export function MedicationSelector({
    onAdd,
    searchValue,
    setSearchValue,
    daysOfUse,
    setDaysOfUse,
    notes,
    setNotes,
    dose,
    setDose,
    doseUnit,
    setDoseUnit,
    quantity,
    openCustomMedicationDialog
}: MedicationSelectorProps) {

    const [medOpen, setMedOpen] = useState(false);
    const [dosePopoverOpen, setDosePopoverOpen] = useState(false);
    const [patientWeight, setPatientWeight] = useState("");
    const [frequency, setFrequency] = useState("");

    // Find the selected item from the simplified list
    const selectedListItem = useMemo(() =>
        ALL_MEDICATIONS_WITH_PRESENTATIONS.find(
            m => m.displayName.toLowerCase() === searchValue.toLowerCase()
        ),
        [searchValue]);

    // Lookup the full presentation details from the database if a standard med is selected
    const selectedMedData = useMemo(() => {
        if (!selectedListItem) return null;

        const baseMed = MEDICATION_DATABASE.find(m => m.name === selectedListItem.baseName);
        if (!baseMed) return null;

        const presentation = baseMed.presentations.find(p =>
            p.format === selectedListItem.format &&
            p.dosage === selectedListItem.dosage &&
            p.unit === selectedListItem.unit
        );

        return presentation || null;
    }, [selectedListItem]);


    // Calculate pediatric dose helper
    const calculatePediatricDose = (pres: any, weight: number) => {
        if (!pres || !pres.isPediatric || !pres.dosePerKg || !pres.concentration || !pres.frequency) {
            return null;
        }
        const dailyDoseLow = pres.dosePerKg * weight;
        const dailyDoseHigh = (pres.dosePerKgMax || pres.dosePerKg) * weight;
        const maxDaily = pres.maxDailyDose || Infinity;
        const effectiveDailyLow = Math.min(dailyDoseLow, maxDaily);
        const effectiveDailyHigh = Math.min(dailyDoseHigh, maxDaily);
        // Avoid division by zero
        const freq = pres.frequency || 1;
        const dosePerAdminLow = effectiveDailyLow / freq;
        const dosePerAdminHigh = effectiveDailyHigh / freq;
        const mlPerAdminLow = dosePerAdminLow / pres.concentration;
        const mlPerAdminHigh = dosePerAdminHigh / pres.concentration;
        return {
            mlPerAdminLow: Math.round(mlPerAdminLow * 10) / 10,
            mlPerAdminHigh: Math.round(mlPerAdminHigh * 10) / 10,
        };
    };

    const handleAdd = () => {
        onAdd(searchValue, frequency, dose, doseUnit, quantity);
        // Reset local state handled by parent via props (except frequency which is local here)
        setFrequency("");
    };

    const filteredMeds = useMemo(() => {
        if (!searchValue) return ALL_MEDICATIONS_WITH_PRESENTATIONS;
        return ALL_MEDICATIONS_WITH_PRESENTATIONS.filter((med) =>
            med.displayName.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [searchValue]);

    return (
        <Card className="border-emerald-100 shadow-sm overflow-visible z-10">
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Medication Search */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Medicamento</label>
                        <Popover open={medOpen} onOpenChange={setMedOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={medOpen}
                                    className="w-full justify-between bg-white border-gray-200 text-left font-normal"
                                >
                                    {searchValue ? (
                                        <div className="flex items-center gap-2 truncate">
                                            {selectedListItem ? (
                                                <span className="text-emerald-600 h-4 w-4">
                                                    {getMedicationIcon(selectedListItem.format)}
                                                </span>
                                            ) : (
                                                <Search className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="truncate">{searchValue}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 flex items-center gap-2">
                                            <Search className="h-4 w-4" />
                                            Buscar medicamento...
                                        </span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[400px] p-0" align="start">
                                <div className="p-2 border-b">
                                    <div className="flex items-center px-3 pb-1">
                                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                        <input
                                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                            placeholder="Digitar nome do medicamento..."
                                            value={searchValue}
                                            onChange={(e) => setSearchValue(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-1">
                                    {filteredMeds.map((med) => (
                                        <div
                                            key={med.displayName}
                                            className={cn(
                                                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                searchValue === med.displayName && "bg-accent text-accent-foreground"
                                            )}
                                            onClick={() => {
                                                setSearchValue(med.displayName);
                                                setDose(med.dosage || "");
                                                setDoseUnit(med.unit || "mg");
                                                setMedOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <span className="text-emerald-600 h-4 w-4 flex-shrink-0">
                                                    {getMedicationIcon(med.format)}
                                                </span>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-medium truncate">{med.baseName}</span>
                                                    <span className="text-xs text-gray-500 truncate">
                                                        {med.dosage} {med.unit} ({med.format})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {searchValue && filteredMeds.length === 0 && (
                                        <div className="p-2 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-emerald-600 w-full justify-start"
                                                onClick={() => {
                                                    setMedOpen(false);
                                                }}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Usar "{searchValue}"
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="p-2 border-t bg-gray-50">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs"
                                        onClick={() => {
                                            setMedOpen(false);
                                            openCustomMedicationDialog();
                                        }}
                                    >
                                        <Pencil className="mr-2 h-3 w-3" />
                                        Gerenciar Personalizados
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Frequency */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Frequência</label>
                        <Select value={frequency} onValueChange={setFrequency}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {FREQUENCIES.map((freq) => (
                                    <SelectItem key={freq.value} value={freq.value}>
                                        {freq.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Dose */}
                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center justify-between">
                            Dose
                            {selectedMedData?.isPediatric && (
                                <Popover open={dosePopoverOpen} onOpenChange={setDosePopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-emerald-600">
                                            <Sparkles className="h-3 w-3" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4">
                                        <div className="space-y-3">
                                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-emerald-500" />
                                                Calculadora Pediátrica
                                            </h4>
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1 space-y-1">
                                                    <label className="text-xs text-gray-500">Peso (kg)</label>
                                                    <Input
                                                        type="number"
                                                        value={patientWeight}
                                                        onChange={(e) => setPatientWeight(e.target.value)}
                                                        placeholder="Ex: 15"
                                                    />
                                                </div>
                                                <Button
                                                    size="sm"
                                                    disabled={!patientWeight}
                                                    onClick={() => {
                                                        const result = calculatePediatricDose(selectedMedData, parseFloat(patientWeight));
                                                        if (result) {
                                                            setDose(`${result.mlPerAdminLow} - ${result.mlPerAdminHigh}`);
                                                            setDoseUnit('ml');
                                                            setDosePopoverOpen(false);
                                                        }
                                                    }}
                                                >
                                                    Calcular
                                                </Button>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Baseado em {selectedMedData.dosePerKg}mg/kg/dia
                                            </p>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            )}
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={dose}
                                onChange={(e) => setDose(e.target.value)}
                                placeholder="0"
                                className="bg-white min-w-[60px]"
                            />
                            <Select value={doseUnit} onValueChange={setDoseUnit}>
                                <SelectTrigger className="w-[100px] bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DOSAGE_UNITS.map((unit) => (
                                        <SelectItem key={unit.value} value={unit.value}>
                                            {unit.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Days of Use */}
                    <div className="col-span-1 space-y-2">
                        <label className="text-sm font-medium text-gray-700">Dias</label>
                        <Input
                            type="number"
                            value={daysOfUse}
                            onChange={(e) => setDaysOfUse(e.target.value)}
                            placeholder="7"
                            className="bg-white"
                        />
                    </div>

                    {/* Quantity (Auto-calc display + override) */}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex justify-between">
                            Quantidade
                            {quantity && <span className="text-xs text-emerald-600 font-normal flex items-center"><RefreshCw className="h-3 w-3 mr-1" />Calculado</span>}
                        </label>
                        <Input
                            value={quantity}
                            readOnly
                            className="bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                            placeholder="Calculado automaticamente..."
                        />
                    </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Observações (opcional)</label>
                    <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ex: Tomar após as refeições"
                        className="bg-white"
                    />
                </div>

                <div className="pt-2">
                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleAdd}
                        disabled={!searchValue || !frequency || !dose}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar à Receita
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
