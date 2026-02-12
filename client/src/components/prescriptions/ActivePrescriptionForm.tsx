import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, AlertTriangle, Save, Printer, Pencil } from "lucide-react";
import { PrescriptionTypeBadge } from "@/components/dialogs";
import type { AcutePrescriptionItem } from "@/hooks/use-prescription-logic";

interface ActivePrescriptionFormProps {
    items: AcutePrescriptionItem[];
    observations: string;
    onObservationsChange: (value: string) => void;
    onRemoveItem: (id: string) => void;
    onEditItem: (id: string) => void;
    onSaveAndPrint: () => void;
    onFinalize: () => void;
    isEditing: boolean;
    isSigning?: boolean;
}

export function ActivePrescriptionForm({
    items,
    observations,
    onObservationsChange,
    onRemoveItem,
    onEditItem,
    onSaveAndPrint,
    onFinalize,
    isEditing,
    isSigning
}: ActivePrescriptionFormProps) {
    // Don't render anything when empty - MedicationSelector already provides context
    if (items.length === 0) {
        return null;
    }

    return (
        <Card className="border-gray-300 shadow-md h-fit">
            <CardHeader className="bg-gray-100 border-b border-gray-200 pb-3">
                <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    Receita Atual
                    <Badge variant="secondary" className="bg-gray-200 text-gray-700 hover:bg-gray-200 ml-2 text-xs">
                        {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </Badge>
                </CardTitle>
                <CardDescription className="text-xs">Revise os medicamentos antes de imprimir.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                        <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-sm text-gray-800">{item.name}</h4>
                                    <PrescriptionTypeBadge type={item.prescriptionType === 'padrao' ? 'common' : item.prescriptionType} />
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onEditItem(item.id)}
                                        className="text-gray-400 hover:text-gray-600 h-7 w-7 p-0"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemoveItem(item.id)}
                                        className="text-gray-400 hover:text-red-500 h-7 w-7 p-0"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mt-2">
                                <div><span className="font-medium text-gray-500">Dose:</span> {item.dosage}</div>
                                <div><span className="font-medium text-gray-500">Freq:</span> {item.frequency}</div>
                                {item.daysOfUse && (
                                    <div><span className="font-medium text-gray-500">Duração:</span> {item.daysOfUse} dias</div>
                                )}
                                {item.quantity && (
                                    <div><span className="font-medium text-gray-500">Qtd:</span> {item.quantity}</div>
                                )}
                            </div>
                            {item.notes && (
                                <div className="mt-2 text-sm bg-yellow-50 text-yellow-800 p-2 rounded flex items-start">
                                    <AlertTriangle className="h-3 w-3 mt-0.5 mr-1.5 flex-shrink-0" />
                                    {item.notes}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-gray-100 border-t border-gray-200 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Observações Gerais (opcional)
                        </label>
                        <Textarea
                            placeholder="Ex: Uso contínuo, Retorno em 30 dias, Recomendações dietéticas..."
                            value={observations}
                            onChange={(e) => onObservationsChange(e.target.value)}
                            className="bg-white resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            className="w-full bg-gray-800 hover:bg-gray-900 text-white shadow-sm text-sm"
                            size="lg"
                            onClick={onSaveAndPrint}
                            disabled={isSigning}
                        >
                            {isEditing ? (
                                <>
                                    <Save className="h-5 w-5 mr-2" />
                                    Atualizar e Imprimir Receita
                                </>
                            ) : (
                                <>
                                    <Printer className="h-5 w-5 mr-2" />
                                    Salvar e Imprimir Receita
                                </>
                            )}
                        </Button>

                        <Button
                            className="w-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 shadow-sm text-sm"
                            variant="outline"
                            size="lg"
                            onClick={onFinalize}
                            disabled={isSigning}
                        >
                            {isSigning ? (
                                <>Assinando Digitalmente...</>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Finalizar e Assinar (CFM)
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}
