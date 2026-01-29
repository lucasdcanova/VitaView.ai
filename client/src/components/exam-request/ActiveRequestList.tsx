import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Printer, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SelectedExam {
    id: string;
    name: string;
    type: 'laboratorial' | 'imagem' | 'outros';
    notes?: string;
}

interface ActiveRequestListProps {
    selectedExams: SelectedExam[];
    clinicalIndication: string;
    setClinicalIndication: (val: string) => void;
    observations: string;
    setObservations: (val: string) => void;
    onRemoveExam: (id: string) => void;
    onUpdateExamNotes: (id: string, notes: string) => void;
    onSaveAndPrint: () => void;
    isEditing: boolean;
}

export function ActiveRequestList({
    selectedExams,
    clinicalIndication,
    setClinicalIndication,
    observations,
    setObservations,
    onRemoveExam,
    onUpdateExamNotes,
    onSaveAndPrint,
    isEditing
}: ActiveRequestListProps) {
    return (
        <Card className="border-emerald-100 shadow-md h-fit">
            <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-emerald-700" />
                            {isEditing ? "Editando Solicitação" : "Nova Solicitação"}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {selectedExams.length} exame(s) selecionado(s)
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-200">
                        {isEditing ? "Modo Edição" : "Rascunho"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Clinical Indication */}
                <div className="p-4 border-b border-gray-100 space-y-3 bg-white">
                    <Label htmlFor="clinical-indication" className="text-gray-700">Indicação Clínica (opcional)</Label>
                    <Input
                        id="clinical-indication"
                        value={clinicalIndication}
                        onChange={(e) => setClinicalIndication(e.target.value)}
                        placeholder="Ex: Check-up anual, Investigação de anemia..."
                        className="bg-gray-50/50"
                    />
                </div>

                {/* Exam List */}
                <div className="max-h-[500px] overflow-y-auto">
                    {selectedExams.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>Nenhum exame selecionado.</p>
                            <p className="text-sm">Utilize a busca ou protocolos ao lado.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {selectedExams.map((exam, index) => (
                                <div key={exam.id} className="p-3 hover:bg-gray-50 transition-colors group">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-gray-400 w-5">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </span>
                                                <span className="font-medium text-gray-900">{exam.name}</span>
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-gray-100 text-gray-500">
                                                    {exam.type}
                                                </Badge>
                                            </div>
                                            <Input
                                                placeholder="Observações (opcional)"
                                                value={exam.notes || ""}
                                                onChange={(e) => onUpdateExamNotes(exam.id, e.target.value)}
                                                className="mt-2 h-7 text-xs bg-transparent border-transparent hover:border-gray-200 focus:border-emerald-500 focus:bg-white transition-all px-0 hover:px-2"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onRemoveExam(exam.id)}
                                            className="opacity-10 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:opacity-100 transition-all h-8 w-8 p-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-gray-500 uppercase font-semibold">Observações Gerais</Label>
                        <Textarea
                            value={observations}
                            onChange={(e) => setObservations(e.target.value)}
                            placeholder="Observações que sairão no rodapé do pedido..."
                            className="bg-white min-h-[80px] text-sm"
                        />
                    </div>

                    <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base shadow-sm"
                        onClick={onSaveAndPrint}
                        disabled={selectedExams.length === 0}
                    >
                        <Printer className="mr-2 h-5 w-5" />
                        {isEditing ? "Salvar Alterações e Imprimir" : "Salvar Solicitação e Imprimir"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
