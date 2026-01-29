import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, FileText, AlertTriangle, Save, Printer } from "lucide-react";
import { PrescriptionTypeBadge } from "@/components/dialogs";
import type { AcutePrescriptionItem } from "@/hooks/use-prescription-logic";

interface ActivePrescriptionFormProps {
    items: AcutePrescriptionItem[];
    observations: string;
    onObservationsChange: (value: string) => void;
    onRemoveItem: (id: string) => void;
    onSaveAndPrint: () => void;
    isEditing: boolean;
}

export function ActivePrescriptionForm({
    items,
    observations,
    onObservationsChange,
    onRemoveItem,
    onSaveAndPrint,
    isEditing
}: ActivePrescriptionFormProps) {
    if (items.length === 0) {
        return (
            <Card className="border-dashed border-2 bg-gray-50/50 h-full flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>Nenhum medicamento adicionado.</p>
                <p className="text-sm">Selecione um medicamento acima para começar.</p>
            </Card>
        );
    }

    return (
        <Card className="border-green-100 shadow-md h-fit">
            <CardHeader className="bg-green-50/50 border-b border-green-100 pb-4">
                <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-700" />
                    Receita Atual
                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 ml-2">
                        {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </Badge>
                </CardTitle>
                <CardDescription>Revise os medicamentos antes de imprimir.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                        <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors group">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                                    <PrescriptionTypeBadge type={item.prescriptionType === 'padrao' ? 'common' : item.prescriptionType} />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRemoveItem(item.id)}
                                    className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
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

                <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
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

                    <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        size="lg"
                        onClick={onSaveAndPrint}
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
                </div>
            </CardContent>
        </Card>
    );
}
