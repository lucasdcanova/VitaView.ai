interface PatientHeaderProps {
  title: string;
  description?: string;
  clinicianLabel: string;
  patientName?: string;
  planType?: string | null;
  showSwitcher?: boolean;
}

import ProfileSwitcher from "@/components/profile-switcher";

export default function PatientHeader({
  title,
  description,
  clinicianLabel,
  patientName,
  planType,
  showSwitcher = true,
}: PatientHeaderProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 md:p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs uppercase tracking-wide text-primary-600">Profissional responsável</div>
          <div className="text-sm font-semibold text-gray-900">{clinicianLabel}</div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-600 leading-relaxed">{description}</p>}
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <div className="text-left md:text-right">
            <p className="text-xs uppercase tracking-wide text-primary-600">Paciente ativo</p>
            <p className="text-sm font-semibold text-gray-900">
              {patientName || "Nenhum paciente selecionado"}
            </p>
            {planType && (
              <p className="text-xs text-gray-500">Plano: {planType}</p>
            )}
          </div>
          {showSwitcher && <ProfileSwitcher />}
        </div>
      </div>
    </div>
  );
}
