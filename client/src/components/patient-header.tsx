import { Profile } from "@shared/schema";
import { Calendar, FileText, ShieldCheck, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProfileSwitcher from "@/components/profile-switcher";

interface PatientHeaderProps {
  title: string;
  description?: string;
  patient?: Profile | null;
  lastExamDate?: string | null;
  showSwitcher?: boolean;
}

export default function PatientHeader({
  title,
  description,
  patient,
  lastExamDate,
  showSwitcher = true,
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
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-6 mb-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-primary-600">{title}</p>
          <h1 className="text-3xl font-semibold text-gray-900">{patientName}</h1>
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">{description}</p>
          )}
        </div>
        {showSwitcher && (
          <div className="w-full md:w-auto">
            <p className="text-xs font-medium text-gray-500 mb-1 text-center md:text-right">
              Trocar paciente
            </p>
            <ProfileSwitcher />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {highlightItems.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4"
          >
            <div className="rounded-full bg-white p-2 text-primary-600 shadow-sm">
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{item.label}</p>
              <p className="text-base font-semibold text-gray-900">{item.value}</p>
              {item.helper && <p className="text-xs text-gray-500 mt-1">{item.helper}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
