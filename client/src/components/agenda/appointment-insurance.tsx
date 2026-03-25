import type { Appointment } from "@shared/schema";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AgendaAppointment = Appointment & {
  insuranceName?: string | null;
  planType?: string | null;
  patientInsuranceLabel?: string | null;
};

type AppointmentInsuranceSource = Pick<
  AgendaAppointment,
  "insuranceName" | "planType" | "patientInsuranceLabel"
>;

const normalizeInsuranceValue = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export const getAppointmentInsuranceLabel = (
  appointment: AppointmentInsuranceSource
) => {
  const explicitLabel = normalizeInsuranceValue(appointment.patientInsuranceLabel);
  if (explicitLabel) return explicitLabel;

  const insuranceName = normalizeInsuranceValue(appointment.insuranceName);
  const planType = normalizeInsuranceValue(appointment.planType);

  if (
    insuranceName &&
    planType &&
    insuranceName.localeCompare(planType, "pt-BR", {
      sensitivity: "accent",
    }) !== 0
  ) {
    return `${insuranceName} • ${planType}`;
  }

  return insuranceName ?? planType ?? null;
};

interface AppointmentInsuranceBadgeProps {
  appointment: AppointmentInsuranceSource;
  className?: string;
  compact?: boolean;
}

export function AppointmentInsuranceBadge({
  appointment,
  className,
  compact = false,
}: AppointmentInsuranceBadgeProps) {
  const label = getAppointmentInsuranceLabel(appointment);

  if (!label) return null;

  return (
    <Badge
      variant="secondary"
      className={cn(
        "max-w-full border border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100",
        compact ? "px-2 py-0 text-[10px] leading-4" : "px-2.5 py-0.5",
        className
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
    </Badge>
  );
}
