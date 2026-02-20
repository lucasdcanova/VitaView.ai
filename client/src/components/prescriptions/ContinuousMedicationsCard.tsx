import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pill, PlusCircle, RefreshCw, Trash2, Pencil, Sparkles, Loader2 } from "lucide-react";
import { MedicationDialog } from "@/components/dialogs";
import type { MedicationFormData } from "@/components/dialogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FeatureGate } from "@/components/ui/feature-gate";

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
    const { toast } = useToast();
    const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
    const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
    const [interactionResult, setInteractionResult] = useState<any>(null);

    const handleCheckInteractions = async () => {
        if (medications.length < 2) {
            toast({
                title: "Medicamentos insuficientes",
                description: "Adicione pelo menos 2 medicamentos para verificar interações.",
                variant: "destructive"
            });
            return;
        }

        setIsCheckingInteractions(true);
        try {
            const medNames = medications.map(m => m.name);
            const response = await apiRequest("POST", "/api/medications/interactions", { medications: medNames });

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                setInteractionResult(data);
                setIsInteractionDialogOpen(true);
            } else {
                throw new Error("Resposta inválida do servidor (HTML/Texto). Tente novamente.");
            }
        } catch (error) {
            toast({
                title: "Erro ao verificar interações",
                description: error instanceof Error ? error.message : "Não foi possível realizar a análise no momento.",
                variant: "destructive"
            });
            console.error("Interaction Check Error:", error);
        } finally {
            setIsCheckingInteractions(false);
        }
    };

    const getPrescriptionBadge = (type: string | undefined | null) => {
        const map: Record<string, { label: string; className: string }> = {
            padrao: { label: 'Básica', className: 'bg-gray-100 text-gray-700 border-gray-300' },
            C: { label: 'Básica', className: 'bg-gray-100 text-gray-700 border-gray-300' },
            especial: { label: 'Especial', className: 'bg-orange-100 text-orange-800 border-orange-300' },
            C1: { label: 'Especial', className: 'bg-orange-100 text-orange-800 border-orange-300' },
            B1: { label: 'Azul B1', className: 'bg-blue-100 text-blue-800 border-blue-300' },
            B2: { label: 'Azul B2', className: 'bg-sky-100 text-sky-800 border-sky-300' },
            A: { label: 'Amarela', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        };
        const info = map[type || 'padrao'] || map.padrao;
        return (
            <Badge variant="outline" className={`text-[10px] h-5 border whitespace-nowrap ${info.className}`}>
                {info.label}
            </Badge>
        );
    };

    return (
        <Card className="border-gray-800 shadow-md h-fit">
            <CardHeader className="bg-white border-b border-gray-200 pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-gray-600" />
                            Medicamentos de Uso Contínuo
                        </CardTitle>
                        <CardDescription className="text-xs">Selecione para renovar receita.</CardDescription>
                    </div>
                    <FeatureGate>
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                            onClick={handleCheckInteractions}
                            disabled={isCheckingInteractions || medications.length < 2}
                        >
                            {isCheckingInteractions ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                            )}
                            Checar Interação com IA
                        </Button>
                    </FeatureGate>
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
                                {getPrescriptionBadge(med.prescriptionType)}
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
                        Renovar Selecionados ({selectedMedications.size}) (Assinatura Digital)
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

            <Dialog open={isInteractionDialogOpen} onOpenChange={setIsInteractionDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-black" />
                            Análise de Interações Medicamentosas (IA)
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {interactionResult?.summary && (
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
                                <h4 className="font-medium text-sm mb-2 text-gray-900">Resumo</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">{interactionResult.summary}</p>
                            </div>
                        )}

                        {interactionResult?.interactions && interactionResult.interactions.length > 0 ? (
                            <div className="space-y-3">
                                <h4 className="font-medium text-sm text-gray-900">Interações Identificadas</h4>
                                {interactionResult.interactions.map((interaction: any, idx: number) => (
                                    <div key={idx} className={`p-4 rounded-md border-l-4 ${interaction.severity === 'Alta' ? 'bg-red-50 border-red-500' :
                                        interaction.severity === 'Moderada' ? 'bg-amber-50 border-amber-500' :
                                            'bg-blue-50 border-blue-500'
                                        }`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-semibold text-sm text-gray-900">
                                                {interaction.medications.join(" + ")}
                                            </div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${interaction.severity === 'Alta' ? 'bg-red-100 text-red-700' :
                                                interaction.severity === 'Moderada' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                Severidade: {interaction.severity}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 mb-2">{interaction.description}</p>
                                        {interaction.management && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                <strong>Sugestão:</strong> {interaction.management}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Nenhuma interação significativa encontrada entre os medicamentos analisados.</p>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <Button onClick={() => setIsInteractionDialogOpen(false)}>Fechar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
