import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { History, FileSignature, Printer } from "lucide-react";
import { format } from "date-fns";
import type { Certificate } from "@shared/schema";

interface CertificateHistoryProps {
    history: Certificate[];
    onReprint: (c: Certificate) => void;
}

export function CertificateHistory({ history, onReprint }: CertificateHistoryProps) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <History className="h-5 w-5 text-gray-600" />
                    Histórico de Atestados
                </CardTitle>
                <CardDescription>Atestados emitidos para este paciente.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {history.length > 0 ? (
                        <div className="space-y-3">
                            {history.map(c => (
                                <div key={c.id} className={`flex flex-col gap-3 p-4 rounded-lg border ${c.status === 'cancelled' ? 'bg-red-50 border-red-100 opacity-70' : 'bg-gray-50 border-gray-100 hover:bg-white hover:shadow-sm transition-all'}`}>
                                    <div className="flex gap-3 items-start">
                                        <div className="bg-blue-100 p-2 rounded-lg mt-0.5">
                                            <FileSignature className="h-4 w-4 text-blue-700" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold text-gray-900 text-sm">Atestado de {c.type.charAt(0).toUpperCase() + c.type.slice(1)}</p>
                                                <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                    {format(new Date(c.issueDate), "dd/MM/yyyy")}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                Dr(a). {c.doctorName}
                                            </p>
                                            {c.cid && (
                                                <div className="flex mt-2">
                                                    <span className="text-[10px] font-medium bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">CID: {c.cid}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end border-t border-gray-100 pt-3 mt-1">
                                        {c.status === 'active' ? (
                                            <Button variant="outline" size="sm" className="h-7 text-xs w-full sm:w-auto" onClick={() => onReprint(c)}>
                                                <Printer className="h-3 w-3 mr-1.5" /> Re-Imprimir PDF
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-red-600 font-bold px-2 py-1">CANCELADO</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <History className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 italic">Nenhum atestado emitido ainda.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
