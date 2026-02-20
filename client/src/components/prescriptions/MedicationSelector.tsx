import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, ChevronsUpDown, Sparkles, RefreshCw, Pencil, Trash2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
    setQuantity?: (val: string) => void;
    onAddCustomMedication?: (name: string) => void;
    customMedications?: any[];
    onDeleteCustomMedication?: (id: number) => void;
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
    setQuantity,
    onAddCustomMedication,
    customMedications = [],
    onDeleteCustomMedication
}: MedicationSelectorProps) {
    const { toast } = useToast();
    const [medOpen, setMedOpen] = useState(false);
    const [dosePopoverOpen, setDosePopoverOpen] = useState(false);
    const [suggestionPopoverOpen, setSuggestionPopoverOpen] = useState(false);
    const [patientWeight, setPatientWeight] = useState("");
    const [frequency, setFrequency] = useState("");

    // Fetch user subscription to check for premium plan
    const { data: subscriptionData } = useQuery({
        queryKey: ['/api/user-subscription'],
        // We don't need to block rendering if this fails, default to false (locked) or true depending on strategy.
        // Safer to default to restricted if undefined, but let's see. 
        // Actually, let's just fetch it.
    });

    // Check if user has a premium plan (Vita)
    const isPremium = useMemo(() => {
        if (!subscriptionData || !(subscriptionData as any).plan) return false;
        const planName = (subscriptionData as any).plan.name || "";
        return planName.includes("Vita");
    }, [subscriptionData]);

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

    // Get full medication info (all presentations) for AI suggestions
    const selectedMedInfo = useMemo(() => {
        if (!selectedListItem) return null;
        return MEDICATION_DATABASE.find(m => m.name === selectedListItem.baseName) || null;
    }, [selectedListItem]);

    // Apply dosage suggestion
    const applyDosageSuggestion = (presentation: any) => {
        const formatLower = presentation.format.toLowerCase();

        // Set dose unit based on format
        let unit = "cp"; // Default to comprimido (cp)
        if (formatLower.includes('capsula') || formatLower.includes('cápsula')) {
            unit = "cps";
            setDose("1");
        } else if (formatLower.includes('gotas')) {
            unit = "gt";
            if (presentation.commonDose) {
                const match = presentation.commonDose.match(/(\d+)/);
                setDose(match ? match[1] : "20");
            } else {
                setDose("20");
            }
        } else if (formatLower.includes('suspencao') || formatLower.includes('suspensão') || formatLower.includes('suspensao') ||
            formatLower.includes('solucao') || formatLower.includes('solução') ||
            formatLower.includes('xarope')) {
            unit = "ml";
            setDose("5");
        } else if (formatLower.includes('spray') || formatLower.includes('aerosol') || formatLower.includes('aerossol')) {
            unit = "puff";
            if (presentation.commonDose) {
                const match = presentation.commonDose.match(/(\d+)/);
                setDose(match ? match[1] : "1");
            } else {
                setDose("1");
            }
        } else if (formatLower.includes('injecao') || formatLower.includes('injeção') || formatLower.includes('ampola') || formatLower.includes('injetavel') || formatLower.includes('injetável')) {
            unit = "amp";
            setDose("1");
        } else {
            // Sólidos (comprimido)
            unit = "cp";
            setDose("1");
        }

        // Parse common dose string for details (e.g. "200mg 5x/dia por 5 dias")
        if (presentation.commonDose) {
            const commonDoseLower = presentation.commonDose.toLowerCase();

            // Extract Frequency
            const frequencyMatch = presentation.commonDose.match(/(\d+x\s*(?:ao|por)\s*dia|\d+x\/dia|\d{1,2}h\s*em\s*\d{1,2}h|\d+x\s*semana)/i);
            if (frequencyMatch) {
                // Map matched frequency to standard value if possible
                const matchedFreq = frequencyMatch[0];
                let mappedFreq = matchedFreq.trim();

                // Normalization attempts
                if (matchedFreq.includes('5x')) mappedFreq = "4h em 4h"; // ou "5x ao dia" se houver opção
                else if (matchedFreq.includes('4x')) mappedFreq = "6h em 6h";
                else if (matchedFreq.includes('3x')) mappedFreq = "8h em 8h";
                else if (matchedFreq.includes('2x')) mappedFreq = "12h em 12h";
                else if (matchedFreq.includes('1x')) mappedFreq = "1x ao dia";

                // If we have an exact match in our DB, use it, otherwise try to set it directly or closest
                // For now, if presentation has explicit frequency field, use that preferred
                if (!presentation.frequency) {
                    setFrequency(mappedFreq);
                }
            } else if (commonDoseLower.includes('dose única') || commonDoseLower.includes('dose unicia') || commonDoseLower.includes('dose unica')) {
                setFrequency("Dose única");
                setDaysOfUse("1");
            }

            // Extract Days
            const daysMatch = commonDoseLower.match(/por\s*(\d+)\s*dias/);
            if (daysMatch) {
                setDaysOfUse(daysMatch[1]);
            }
        }

        // Apply explicit duration if available
        if (presentation.duration) {
            setDaysOfUse(String(presentation.duration));
        }
        // Use explicit frequency from presentation if available (more reliable)
        if (presentation.frequency) {
            setFrequency(presentation.frequency);
        }

        setDoseUnit(unit);
        setSuggestionPopoverOpen(false);
    };


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

    const handleClear = () => {
        setSearchValue("");
        setFrequency("");
        setDose("");
        setDoseUnit("mg");
        setDaysOfUse("");
        setNotes("");
        setPatientWeight("");
    };

    const filteredMeds = useMemo(() => {
        const customItems = (customMedications || []).map((c: any) => ({
            baseName: c.name,
            displayName: c.name,
            dosage: c.dosage || "",
            unit: "",
            format: c.format || "Personalizado",
            isCustom: true,
            id: c.id
        }));

        const allItems = [...customItems, ...ALL_MEDICATIONS_WITH_PRESENTATIONS];

        if (!searchValue) return allItems;
        const lowerSearch = searchValue.toLowerCase();
        return allItems.filter((med) =>
            med.displayName.toLowerCase().includes(lowerSearch)
        );
    }, [searchValue, customMedications]);

    const handleSuggestionClick = () => {
        if (!isPremium) {
            toast({
                title: "Recurso exclusivo",
                description: "Sugestões por IA disponíveis apenas nos planos Vita.",
                variant: "destructive"
            });
            return;
        }
        setSuggestionPopoverOpen(true);
    };

    return (
        <Card className="border-gray-800 shadow-md overflow-visible z-10">
            <CardHeader className="bg-white border-b border-gray-200 pb-3">
                <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    <PlusCircle className="h-4 w-4 text-gray-600" />
                    Nova Prescrição
                </CardTitle>
                <CardDescription className="text-xs">Adicione medicamentos à receita.</CardDescription>
            </CardHeader>
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
                                                // Removed auto-fill of dose and unit as requested
                                                // setDose(med.dosage || "");
                                                // setDoseUnit(med.unit || "mg");
                                                setMedOpen(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-2 w-full">
                                                <span className="text-emerald-600 h-4 w-4 flex-shrink-0">
                                                    {getMedicationIcon(med.format)}
                                                </span>
                                                <div className="flex flex-col overflow-hidden items-start flex-1 min-w-0">
                                                    <span className="font-medium truncate">{med.baseName}</span>
                                                    <span className="text-xs text-gray-500 truncate">
                                                        {med.dosage} {med.unit} ({med.format})
                                                    </span>
                                                </div>
                                                {(med as any).isCustom && onDeleteCustomMedication && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDeleteCustomMedication((med as any).id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
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
                                                    // If onAddCustomMedication provided, call it. 
                                                    // This creates the custom med silently.
                                                    if (onAddCustomMedication) {
                                                        onAddCustomMedication(searchValue);
                                                    }
                                                }}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Adicionar "{searchValue}" como personalizado
                                            </Button>
                                        </div>
                                    )}
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

                <div className="grid grid-cols-4 gap-3">
                    {/* Dose Value with AI Suggestion */}
                    <div className="col-span-1 space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 h-5 flex items-center justify-between">
                            Dose
                        </label>
                        <div className="relative">
                            <Input
                                value={dose}
                                onChange={(e) => setDose(e.target.value)}
                                placeholder="0"
                                className="bg-white text-sm pr-8"
                            />
                            {selectedMedInfo ? (
                                <Popover open={suggestionPopoverOpen} onOpenChange={setSuggestionPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors z-10 p-1 flex items-center justify-center rounded-sm hover:bg-gray-100"
                                            title={isPremium ? "Ver sugestões de dose (IA)" : "Recurso exclusivo planos Vita"}
                                            onClick={(e) => {
                                                // Prevent default popover trigger if not premium
                                                if (!isPremium) {
                                                    e.preventDefault();
                                                    handleSuggestionClick();
                                                }
                                            }}
                                        >
                                            {isPremium ? (
                                                <Sparkles className="h-4 w-4 text-yellow-500" />
                                            ) : (
                                                <Lock className="h-3 w-3 text-gray-400" />
                                            )}
                                        </button>
                                    </PopoverTrigger>
                                    {isPremium && (
                                        <PopoverContent className="w-[320px] p-0" align="start" side="bottom">
                                            <div className="bg-gray-50 p-2 border-b">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <Sparkles className="h-4 w-4 text-yellow-500" />
                                                    <span className="font-medium text-sm">Sugestão IA</span>
                                                    {selectedMedInfo.category && (
                                                        <Badge variant="outline" className="text-xs ml-auto border-gray-200 text-gray-700">{selectedMedInfo.category}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-2 max-h-[280px] overflow-y-auto">
                                                {/* Adult presentations */}
                                                {selectedMedInfo.presentations.filter(p => !p.isPediatric).length > 0 && (
                                                    <>
                                                        {selectedMedInfo.presentations.filter(p => !p.isPediatric).map((pres, idx) => (
                                                            <div
                                                                key={`adult-${idx}`}
                                                                className="flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                                                                onClick={() => applyDosageSuggestion(pres)}
                                                            >
                                                                <div>
                                                                    <span className="font-semibold text-gray-900">{pres.dosage}{pres.unit}</span>
                                                                    <span className="text-gray-500 ml-2 text-sm">
                                                                        ({pres.format})
                                                                    </span>
                                                                </div>
                                                                {pres.commonDose && (
                                                                    <div className="flex flex-col">
                                                                        <span className="text-xs text-gray-500">{pres.commonDose}</span>
                                                                        {pres.duration && (
                                                                            <span className="text-xs text-gray-400">Por {pres.duration} dias</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </>
                                                )}

                                                <div className="mt-2 pt-2 border-t">

                                                    {/* Pediatric section */}
                                                    {selectedMedInfo.presentations.filter(p => p.isPediatric).length > 0 && (
                                                        <div className="mt-2 pt-2 border-t">
                                                            <div className="flex items-center justify-between px-2 py-1">
                                                                <span className="text-xs text-gray-600 font-medium">👶 Pediátrico</span>
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        type="number"
                                                                        placeholder="Peso"
                                                                        value={patientWeight}
                                                                        onChange={(e) => setPatientWeight(e.target.value)}
                                                                        className="h-6 w-16 text-xs px-2"
                                                                        min="0"
                                                                        step="0.1"
                                                                    />
                                                                    <span className="text-xs text-gray-500">kg</span>
                                                                </div>
                                                            </div>
                                                            {selectedMedInfo.presentations.filter(p => p.isPediatric).map((pres, idx) => {
                                                                const weight = parseFloat(patientWeight);
                                                                const calculation = weight > 0 ? calculatePediatricDose(pres, weight) : null;
                                                                const showRange = calculation && calculation.mlPerAdminLow !== calculation.mlPerAdminHigh;
                                                                const doseDisplay = calculation
                                                                    ? (showRange ? `${calculation.mlPerAdminLow}-${calculation.mlPerAdminHigh}` : `${calculation.mlPerAdminLow}`)
                                                                    : null;

                                                                return (
                                                                    <div
                                                                        key={`ped-${idx}`}
                                                                        className="p-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors border-l-2 border-gray-300 ml-2 mt-1"
                                                                        onClick={() => {
                                                                            if (calculation) {
                                                                                setDose(doseDisplay || "");
                                                                                setDoseUnit("ml");

                                                                                // Auto-fill frequency for pediatric
                                                                                if (pres.frequency) {
                                                                                    let freqString = "";
                                                                                    switch (pres.frequency) {
                                                                                        case 1: freqString = "1x ao dia"; break;
                                                                                        case 2: freqString = "12h em 12h"; break;
                                                                                        case 3: freqString = "8h em 8h"; break;
                                                                                        case 4: freqString = "6h em 6h"; break;
                                                                                        case 6: freqString = "4h em 4h"; break;
                                                                                        default: freqString = "";
                                                                                    }
                                                                                    if (freqString) setFrequency(freqString);
                                                                                }

                                                                                // Auto-fill duration for pediatric
                                                                                if (pres.duration) {
                                                                                    setDaysOfUse(String(pres.duration));
                                                                                }


                                                                                setSuggestionPopoverOpen(false);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-sm text-gray-800">{pres.format} {pres.dosage}{pres.unit}</span>
                                                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                                                    {pres.frequency && (
                                                                                        <span>
                                                                                            {pres.frequency === 1 ? "1x ao dia" :
                                                                                                pres.frequency === 2 ? "12h em 12h" :
                                                                                                    pres.frequency === 3 ? "8h em 8h" :
                                                                                                        pres.frequency === 4 ? "6h em 6h" :
                                                                                                            pres.frequency === 6 ? "4h em 4h" :
                                                                                                                `${pres.frequency}x ao dia`}
                                                                                        </span>
                                                                                    )}
                                                                                    {pres.frequency && pres.duration && <span>•</span>}
                                                                                    {pres.duration && <span>Por {pres.duration} dias</span>}
                                                                                </div>
                                                                            </div>

                                                                            {calculation && (
                                                                                <span className="text-xs text-gray-700 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                                                                    {doseDisplay} ml
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {pres.dosePerKg && (
                                                                            <span className="text-xs text-gray-400 mt-0.5 block">{pres.dosePerKg}mg/kg/dia</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-2 bg-gray-50 border-t text-xs text-gray-400 flex items-start gap-1">
                                                ⚕️ Sugestões baseadas em referências gerais.
                                            </div>
                                        </PopoverContent>
                                    )}
                                </Popover>
                            ) : (
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 cursor-not-allowed z-10 p-1 flex items-center justify-center"
                                    title="Selecione um medicamento para ver sugestões"
                                    disabled
                                >
                                    <Sparkles className="h-4 w-4 text-yellow-500" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Dose Unit */}
                    <div className="col-span-1 space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 h-5 flex items-center">Unidade</label>
                        <Select value={doseUnit} onValueChange={setDoseUnit}>
                            <SelectTrigger className="bg-white text-sm">
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

                    {/* Days of Use */}
                    <div className="col-span-1 space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 h-5 flex items-center">Dias</label>
                        <Input
                            type="number"
                            value={daysOfUse}
                            onChange={(e) => setDaysOfUse(e.target.value)}
                            placeholder="7"
                            className="bg-white text-sm"
                        />
                    </div>

                    {/* Quantity (Auto-calc display + override) */}
                    <div className="col-span-1 space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 h-5 flex items-center gap-1">
                            Quantidade
                            {quantity && <RefreshCw className="h-3 w-3 text-gray-400" />}
                        </label>
                        <Input
                            value={quantity}
                            onChange={(e) => setQuantity && setQuantity(e.target.value)}
                            className="bg-white text-sm"
                            placeholder="Auto"
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

                <div className="pt-2 flex gap-2">
                    <Button
                        variant="outline"
                        className="w-1/3 text-gray-600 hover:bg-gray-50"
                        onClick={handleClear}
                        title="Limpar todos os campos"
                    >
                        Limpar
                    </Button>
                    <Button
                        className="w-2/3 bg-gray-800 hover:bg-gray-900 text-white text-sm"
                        onClick={handleAdd}
                        disabled={!searchValue || !frequency || !dose}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar à Receita
                    </Button>
                </div>
            </CardContent>
        </Card >
    );
}
