import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
        <Card className="overflow-hidden border-border/70 shadow-sm dark:border-white/10">
            <CardHeader className="border-b border-border/70 bg-muted/40 dark:border-white/10 dark:bg-muted/30">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-base text-foreground">
                            <Pill className="h-4 w-4 text-muted-foreground dark:text-slate-300" />
                            Panorama Terapêutico
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground dark:text-slate-400">
                            Medicamentos em uso atualmente e mudanças recentes deste paciente.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="border border-border/70 bg-muted/80 text-foreground hover:bg-muted dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15">
                            {medications.length} em uso
                        </Badge>
                        <Badge variant="secondary" className="border border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/55">
                            {recentHistory.length} mudanças recentes
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-4 lg:p-5">
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <CalendarClock className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                        Em uso agora
                    </div>
                    {medications.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                            Nenhum medicamento ativo registrado para este paciente.
                        </div>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {medications.map((medication) => (
                                <div key={medication.id} className="rounded-xl border border-border/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-foreground dark:text-slate-100">{medication.name}</p>
                                            <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">{formatMedicationLine(medication)}</p>
                                        </div>
                                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
                                            Ativo
                                        </Badge>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground dark:text-slate-500">
                                        <span>Iniciado em {formatTimelineDate(medication.startDate || medication.createdAt)}</span>
                                        {medication.notes ? <span className="truncate">{medication.notes}</span> : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <History className="h-4 w-4 text-muted-foreground dark:text-slate-400" />
                        Histórico de início e interrupção
                    </div>
                    {recentHistory.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-border/80 bg-muted/40 px-4 py-5 text-sm text-muted-foreground dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
                            O histórico será preenchido conforme os medicamentos forem iniciados ou interrompidos.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentHistory.map((entry) => {
                                const isStarted = entry.eventType === "started";
                                return (
                                    <div
                                        key={`${entry.id}-${entry.eventType}`}
                                        className="flex flex-col gap-3 rounded-xl border border-border/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={cn(
                                                    "mt-0.5 rounded-full p-2",
                                                    isStarted
                                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                                                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
                                                )}
                                            >
                                                {isStarted ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground dark:text-slate-100">{entry.name}</p>
                                                <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">{formatMedicationLine(entry)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <Badge
                                                variant="outline"
                                                className={
                                                    isStarted
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200"
                                                        : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200"
                                                }
                                            >
                                                {isStarted ? "Iniciado" : "Interrompido"}
                                            </Badge>
                                            <span className="text-muted-foreground dark:text-slate-400">{formatTimelineDate(entry.occurredAt || entry.endDate || entry.startDate)}</span>
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
