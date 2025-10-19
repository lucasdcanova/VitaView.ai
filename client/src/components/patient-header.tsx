import ProfileSwitcher from "@/components/profile-switcher";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles } from "@/hooks/use-profiles";

interface PatientHeaderProps {
  title: string;
  description?: string;
}

export default function PatientHeader({ title, description }: PatientHeaderProps) {
  const { user } = useAuth();
  const { activeProfile } = useProfiles();

  const clinicianName = user?.fullName || user?.username || "Profissional";
  const normalizedGender = user?.gender?.toLowerCase();
  const clinicianPrefix = normalizedGender?.startsWith("f") || normalizedGender?.includes("femin")
    ? "Dra."
    : "Dr.";
  const clinicianLabel = `${clinicianPrefix} ${clinicianName}`.trim();

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
              {activeProfile ? activeProfile.name : "Nenhum paciente selecionado"}
            </p>
            {activeProfile?.planType && (
              <p className="text-xs text-gray-500">Plano: {activeProfile.planType}</p>
            )}
          </div>
          <ProfileSwitcher />
        </div>
      </div>
    </div>
  );
}
