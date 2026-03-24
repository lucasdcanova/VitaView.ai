import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, CalendarClock, ArrowUpRight, ArrowDownRight, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MedicationHistoryEntry } from "@/hooks/use-continuous-medications";

interface MedicationTreatmentSummaryProps {
    medications: any[];
    history: MedicationHistoryEntry[];
}

const formatTimelineDate = (value?: string | Date | null) => {
    if (!value) return "Data não informada";
    const normalizedValue =
        typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? `${value}T12:00:00`
            : value;
    const parsed = new Date(normalizedValue);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return format(parsed, "dd 'de' MMM", { locale: ptBR });
};

const formatMedicationLine = (medication: {
    dosage?: string | null;
    dosageUnit?: string | null;
    frequency?: string | null;
}) => {
    const dosage = [medication.dosage, medication.dosageUnit].filter(Boolean).join(" ");
    if (dosage && medication.frequency) {
        return `${dosage} • ${medication.frequency}`;
    }

    return dosage || medication.frequency || "Posologia não informada";
};

export function MedicationTreatmentSummary({ medications, history }: MedicationTreatmentSummaryProps) {
    const recentHistory = history
        .filter((entry) => entry.eventType === "started" || entry.eventType === "stopped")
        .slice(0, 12);

    return (
        <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-sm">
            <CardHeader className="border-b border-slate-200/80 bg-white/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                            <Pill className="h-4 w-4 text-slate-600" />
                            Panorama Terapêutico
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Medicamentos em uso atualmente e mudanças recentes deste paciente.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                            {medications.length} em uso
                        </Badge>
                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                            {recentHistory.length} mudanças recentes
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 lg:p-5">
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <CalendarClock className="h-4 w-4 text-slate-500" />
                        Em uso agora
                    </div>
                    {medications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                            Nenhum medicamento ativo registrado para este paciente.
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {medications.map((medication) => (
                                <div key={medication.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-slate-900">{medication.name}</p>
                                            <p className="mt-1 text-xs text-slate-500">{formatMedicationLine(medication)}</p>
                                        </div>
                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                            Ativo
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-slate-500">
                                        <span>Iniciado em {formatTimelineDate(medication.startDate || medication.createdAt)}</span>
                                        {medication.notes ? <span className="truncate">{medication.notes}</span> : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <History className="h-4 w-4 text-slate-500" />
                        Histórico de início e interrupção
                    </div>
                    {recentHistory.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5 text-sm text-slate-500">
                            O histórico será preenchido conforme os medicamentos forem iniciados ou interrompidos.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentHistory.map((entry) => {
                                const isStarted = entry.eventType === "started";
                                return (
                                    <div
                                        key={`${entry.id}-${entry.eventType}`}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 rounded-full p-2 ${isStarted ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                                                {isStarted ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{entry.name}</p>
                                                <p className="mt-1 text-xs text-slate-500">{formatMedicationLine(entry)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <Badge
                                                variant="outline"
                                                className={isStarted ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700"}
                                            >
                                                {isStarted ? "Iniciado" : "Interrompido"}
                                            </Badge>
                                            <span className="text-slate-500">{formatTimelineDate(entry.occurredAt || entry.endDate || entry.startDate)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </CardContent>
        </Card>
    );
}
