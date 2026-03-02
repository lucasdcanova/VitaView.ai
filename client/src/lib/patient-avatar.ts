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
): string {
  const notes = typeof profile.notes === "string" ? profile.notes : "";
  const customFromNotes = notes.match(AVATAR_NOTE_REGEX)?.[1];
  if (customFromNotes) return customFromNotes;

  const seedRaw = `${profile.id ?? "x"}-${profile.email ?? profile.name ?? "patient"}`;
  const seed = encodeURIComponent(seedRaw.toLowerCase().replace(/\s+/g, "-"));
  return `https://picsum.photos/seed/vitaview-${seed}/320/320`;
}
