import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TriageBadge } from "@/components/triage/triage-badge";

interface TriageData {
    manchesterPriority: string;
    chiefComplaint: string;
    painScale?: number;
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
}

interface TriageCardProps {
    triage: TriageData | null;
}

export function TriageCard({ triage }: TriageCardProps) {
    if (!triage) return null;

    return (
        <Card className="border border-blue-200 bg-blue-50 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Triagem do Dia
                    </CardTitle>
                    <TriageBadge priority={triage.manchesterPriority as "emergent" | "very_urgent" | "urgent" | "standard" | "non_urgent"} showLabel={false} />
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Queixa Principal:</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{triage.chiefComplaint}</p>
                </div>

                {triage.painScale && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Dor:</span>
                        <span className="font-medium text-gray-900">{triage.painScale}/10</span>
                    </div>
                )}

                {(triage.systolicBp || triage.heartRate || triage.temperature) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                        {triage.systolicBp && (
                            <div className="text-xs">
                                <div className="text-gray-600">PA</div>
                                <div className="font-medium text-gray-900">
                                    {triage.systolicBp}/{triage.diastolicBp}
                                </div>
                            </div>
                        )}
                        {triage.heartRate && (
                            <div className="text-xs">
                                <div className="text-gray-600">FC</div>
                                <div className="font-medium text-gray-900">{triage.heartRate} bpm</div>
                            </div>
                        )}
                        {triage.temperature && (
                            <div className="text-xs">
                                <div className="text-gray-600">Temp</div>
                                <div className="font-medium text-gray-900">{triage.temperature}°C</div>
                            </div>
                        )}
                        {triage.oxygenSaturation && (
                            <div className="text-xs">
                                <div className="text-gray-600">SpO2</div>
                                <div className="font-medium text-gray-900">{triage.oxygenSaturation}%</div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
