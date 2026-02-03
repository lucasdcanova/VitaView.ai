import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { History, Printer, Pencil, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import type { Prescription } from "@shared/schema";

interface PrescriptionHistoryProps {
    prescriptions: Prescription[];
    onReprint: (p: Prescription) => void;
    onEdit: (p: Prescription) => void;
}

export function PrescriptionHistory({ prescriptions, onReprint, onEdit }: PrescriptionHistoryProps) {
    if (!prescriptions || prescriptions.length === 0) {
        return null;
    }

    // Helper to format medication names for display (copied from original file)
    const formatMedicationNames = (meds: any[]): string => {
        if (!meds || meds.length === 0) return "Receita vazia";
        const names = meds.map(m => m.name.split(" ")[0]);
        if (names.length <= 3) {
            return names.join(", ");
        }
        return `${names.slice(0, 3).join(", ")} +${names.length - 3}`;
    };

    return (
        <Card className="border-gray-200 mt-8">
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-3">
                <CardTitle className="text-base text-gray-800 flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-500" />
                    Histórico de Receitas
                </CardTitle>
                <CardDescription className="text-xs">
                    Acesse e reimprima receitas anteriores.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                    {prescriptions.map((prescription) => (
                        <AccordionItem key={prescription.id} value={`item-${prescription.id}`} className="hover:bg-gray-50/50">
                            <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center justify-between w-full text-left pr-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-gray-400" />
                                                {format(new Date(prescription.issueDate), "dd/MM/yyyy")}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <User className="h-3 w-3" />
                                                {prescription.doctorName}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-sm font-medium text-gray-700 max-w-[200px] truncate text-right">
                                            {formatMedicationNames(prescription.medications as any[])}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {(prescription.medications as any[]).length} medicamento(s)
                                        </span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 border-t border-gray-100 bg-gray-50/30">
                                <div className="space-y-3 pt-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {(prescription.medications as any[]).map((med, idx) => (
                                            <div key={idx} className="text-sm bg-white border border-gray-200 p-2 rounded-md shadow-sm">
                                                <div className="font-medium text-gray-900">{med.name}</div>
                                                <div className="text-gray-600 text-xs">
                                                    {med.dosage} - {med.frequency}
                                                    {med.daysOfUse ? ` (${med.daysOfUse} dias)` : ""}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {prescription.observations && (
                                        <div className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100">
                                            <span className="font-semibold text-yellow-800">Obs:</span> {prescription.observations}
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-200/50">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(prescription);
                                            }}
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Editar / Copiar
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onReprint(prescription);
                                            }}
                                        >
                                            <Printer className="h-4 w-4 mr-2" />
                                            Reimprimir
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                {prescriptions.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma receita emitida anteriormente.
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
