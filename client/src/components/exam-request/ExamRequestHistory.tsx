import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { History, Printer, Search, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExamRequestRecord } from "@/hooks/use-exam-request-logic";

interface ExamRequestHistoryProps {
    history: ExamRequestRecord[];
    onReprint: (request: ExamRequestRecord) => void;
    onEdit: (request: ExamRequestRecord) => void;
}

export function ExamRequestHistory({ history, onReprint, onEdit }: ExamRequestHistoryProps) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">Histórico de Solicitações (Últimas 10)</h3>
                </div>
            </div>

            <div className="divide-y divide-gray-100">
                {history.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        <History className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">Nenhuma solicitação anterior encontrada.</p>
                    </div>
                ) : (
                    history.slice(0, 10).map((request) => (
                        <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-50 text-blue-700 font-mono text-xs px-2 py-1 rounded">
                                    {format(new Date(request.issueDate), "dd/MM/yyyy", { locale: ptBR })}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-gray-900">
                                            {request.exams.length} exames solicitados
                                        </span>
                                        {request.status === 'pending' && (
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-yellow-50 text-yellow-700">Pendente</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1">
                                        {request.exams.map(e => e.name).join(", ")}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Imprimir"
                                    onClick={() => onReprint(request)}
                                >
                                    <Printer className="h-4 w-4 text-gray-500 hover:text-gray-900" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    title="Copiar/Editar"
                                    onClick={() => onEdit(request)}
                                >
                                    <Copy className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
