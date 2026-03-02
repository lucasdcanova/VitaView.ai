import { useEffect, useMemo, useState } from "react";
import { Profile } from "@shared/schema";
import { cn } from "@/lib/utils";
import { getPatientAvatarUrl, getPatientInitials } from "@/lib/patient-avatar";

interface PatientAvatarProps {
  profile: Pick<Profile, "id" | "name" | "email" | "notes">;
  className?: string;
  fallbackClassName?: string;
}

export default function PatientAvatar({
  profile,
  className,
  fallbackClassName,
}: PatientAvatarProps) {
  const src = useMemo(
    () => getPatientAvatarUrl(profile),
    [profile.id, profile.name, profile.email, profile.notes]
  );
  const initials = useMemo(() => getPatientInitials(profile.name), [profile.name]);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-lightGray text-charcoal font-heading font-bold",
          className,
          fallbackClassName
        )}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Foto de ${profile.name}`}
      className={cn("object-cover object-center", className)}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}
