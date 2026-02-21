import { Profile } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Calendar, FileText, ShieldCheck, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * VitaView AI Patient Header Component
 * 
 * Design Language:
 * - Fundo Pure White (#FFFFFF)
 * - Bordas Light Gray (#E0E0E0)
 * - Tipografia: Montserrat Bold para títulos, Open Sans para corpo
 * - Ícones de linha (outline) em Charcoal Gray (#212121)
 */

interface PatientHeaderProps {
  title: string;
  description?: string;
  patient?: Profile | null;
  lastExamDate?: string | null;
  showTitleAsMain?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function PatientHeader({
  title,
  description,
  patient,
  lastExamDate,
  showTitleAsMain = false,
  fullWidth = false,
  icon,
  children,
}: PatientHeaderProps) {
  const formatDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return format(parsed, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getAge = (birthDate?: string | null) => {
    if (!birthDate) return null;
    const parsed = new Date(birthDate);
    if (Number.isNaN(parsed.getTime())) return null;
    const diff = Date.now() - parsed.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const formatGender = (gender?: string | null) => {
    if (!gender) return "Não informado";
    const normalized = gender.toLowerCase();
    if (normalized.startsWith("f")) return "Feminino";
    if (normalized.startsWith("m")) return "Masculino";
    return gender;
  };

  const patientName = patient?.name || "Selecione um paciente";
  const age = getAge(patient?.birthDate);
  const formattedBirthDate = formatDate(patient?.birthDate);
  const formattedExamDate = formatDate(lastExamDate);

  const highlightItems = [
    {
      label: "Idade",
      value: age ? `${age} anos` : "Não informada",
      helper: patient?.birthDate ? `Nascimento: ${formattedBirthDate}` : undefined,
      icon: Calendar,
    },
    {
      label: "Sexo",
      value: formatGender(patient?.gender),
      helper: patient?.relationship ? `Relação: ${patient.relationship}` : undefined,
      icon: User,
    },
    {
      label: "Plano de cuidado",
      value: patient?.planType || "Sem plano definido",
      helper: patient?.bloodType ? `Tipo sanguíneo: ${patient.bloodType}` : undefined,
      icon: ShieldCheck,
    },
    {
      label: "Último exame",
      value: formattedExamDate || "Sem registros",
      helper: lastExamDate ? "Resultados mais recentes sincronizados" : undefined,
      icon: FileText,
    },
  ];

  return (
    <div className={cn(
      "p-4 md:p-6 border-border bg-card",
      fullWidth ? "border-b border-x-0 border-t-0 rounded-none" : "border rounded-2xl mb-6 shadow-sm"
    )}>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          {showTitleAsMain ? (
            <>
              {patient && (
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body">
                  PACIENTE: {patientName}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-foreground flex items-center gap-2">
                {icon && <span className="text-muted-foreground">{icon}</span>}
                {title}
              </h1>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-body">{title}</p>
              <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-foreground">{patientName}</h1>
            </>
          )}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl font-body">{description}</p>
          )}
        </div>
        {children && (
          <div className="w-full md:w-auto flex-shrink-0 mt-4 md:mt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
