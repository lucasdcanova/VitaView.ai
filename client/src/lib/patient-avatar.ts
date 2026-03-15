import { Profile } from "@shared/schema";

const AVATAR_NOTE_REGEX = /avatar:\s*(https?:\/\/[^\s]+)/i;

export function getPatientInitials(name?: string | null): string {
  if (!name) return "P";
  const tokens = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return "P";

  return tokens
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function getPatientAvatarUrl(
  profile: Pick<Profile, "id" | "name" | "email" | "notes">
): string | null {
  const notes = typeof profile.notes === "string" ? profile.notes : "";
  const customFromNotes = notes.match(AVATAR_NOTE_REGEX)?.[1];
  if (customFromNotes) return customFromNotes;

  return null;
}
