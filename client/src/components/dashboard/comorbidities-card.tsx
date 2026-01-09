import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText } from "lucide-react";
import { CID10_DATABASE } from "@/data/cid10-database";

interface Diagnosis {
    id: number;
    cidCode: string;
}

interface ComorbiditiesCardProps {
    diagnoses: Diagnosis[];
    onAdd?: () => void;
}

export function ComorbiditiesCard({ diagnoses, onAdd }: ComorbiditiesCardProps) {
    const getCIDDescription = (code: string) => {
        const entry = CID10_DATABASE.find((c) => c.code === code);
        return entry ? `${code} - ${entry.description}` : code;
    };

    return (
        <Card className="border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Comorbidades
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-gray-50">{diagnoses.length}</Badge>
                        {onAdd && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                                onClick={onAdd}
                                title="Adicionar comorbidade"
                            >
                                <PlusCircle className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {Array.isArray(diagnoses) && diagnoses.length > 0 ? (
                    <div className="grid gap-2">
                        {diagnoses.slice(0, 5).map((diagnosis) => (
                            <div key={diagnosis.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 line-clamp-1" title={getCIDDescription(diagnosis.cidCode)}>
                                        {getCIDDescription(diagnosis.cidCode)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-20 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                        <FileText className="h-5 w-5 mb-1 opacity-50" />
                        <p className="text-xs">Nenhuma ativa</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
