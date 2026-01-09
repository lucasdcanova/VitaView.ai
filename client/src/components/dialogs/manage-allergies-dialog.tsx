import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, PlusCircle } from "lucide-react";

interface ManageAllergiesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    allergies: any[];
    onEdit: (allergy: any) => void;
    onRemove: (id: number) => void;
    onAdd: () => void;
}

export function ManageAllergiesDialog({
    open,
    onOpenChange,
    allergies,
    onEdit,
    onRemove,
    onAdd,
}: ManageAllergiesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gerenciar Alergias</DialogTitle>
                    <DialogDescription>
                        Visualize, edite ou remova alergias registradas
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {Array.isArray(allergies) && allergies.length > 0 ? (
                        <div className="space-y-3">
                            {allergies.map((allergy: any) => (
                                <div
                                    key={allergy.id}
                                    className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <AlertTriangle className="h-4 w-4 text-red-500" />
                                            <h4 className="font-semibold text-gray-900">{allergy.allergen}</h4>
                                            <Badge variant="outline" className="text-xs">
                                                {allergy.allergen_type === 'medication' ? 'Medicamento' :
                                                    allergy.allergen_type === 'food' ? 'Alimento' : 'Ambiental'}
                                            </Badge>
                                        </div>
                                        {allergy.reaction && (
                                            <p className="text-sm text-gray-600 mb-1">
                                                <span className="font-medium">Reação:</span> {allergy.reaction}
                                            </p>
                                        )}
                                        {allergy.severity && (
                                            <p className="text-sm text-gray-600">
                                                <span className="font-medium">Gravidade:</span> {allergy.severity}
                                            </p>
                                        )}
                                        {allergy.notes && (
                                            <p className="text-sm text-gray-500 mt-1">{allergy.notes}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                onEdit(allergy);
                                                onOpenChange(false);
                                            }}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemove(allergy.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>Nenhuma alergia registrada</p>
                        </div>
                    )}
                    <div className="pt-4 border-t">
                        <Button
                            onClick={() => {
                                onOpenChange(false);
                                onAdd();
                            }}
                            className="w-full"
                        >
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Adicionar Nova Alergia
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
