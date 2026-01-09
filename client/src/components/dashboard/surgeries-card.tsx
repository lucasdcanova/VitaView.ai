import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Surgery {
    id: number;
    procedureName: string;
    surgeryDate: string;
}

interface SurgeriesCardProps {
    surgeries: Surgery[];
    onAdd?: () => void;
}

export function SurgeriesCard({ surgeries, onAdd }: SurgeriesCardProps) {
    return (
        <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        Cirurgias Prévias
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-50">{surgeries.length}</Badge>
                        {onAdd && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-purple-50 hover:text-purple-600"
                                onClick={onAdd}
                                title="Adicionar cirurgia"
                            >
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {Array.isArray(surgeries) && surgeries.length > 0 ? (
                    <div className="grid gap-2">
                        {surgeries.slice(0, 5).map((surgery) => (
                            <div key={surgery.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="bg-purple-50 p-1.5 rounded-md mt-0.5 flex-shrink-0">
                                    <Activity className="h-3 w-3 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 line-clamp-1" title={surgery.procedureName}>
                                        {surgery.procedureName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(parseISO(surgery.surgeryDate), "dd/MM/yy", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <Activity className="h-5 w-5 mb-1 opacity-50" />
                        <p className="text-xs">Nenhuma registrada</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
