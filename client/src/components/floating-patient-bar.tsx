import { useProfiles } from "@/hooks/use-profiles";
import { User, ChevronDown, Calendar, Activity, Users } from "lucide-react";
import { differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

/**
 * VitaView AI Floating Patient Bar Component
 * 
 * Design Language:
 * - Fundo Pure White (#FFFFFF) com blur sutil
 * - Bordas Light Gray (#E0E0E0)
 * - Avatar em Charcoal Gray (#212121)
 * - Badge ativo em Charcoal Gray
 * - Tipografia: Montserrat Bold para nomes, Open Sans para labels
 */

interface FloatingPatientBarProps {
    className?: string;
}

export default function FloatingPatientBar({ className }: FloatingPatientBarProps) {
    const { activeProfile, profiles, setActiveProfile } = useProfiles();
    const [isQuickSelectOpen, setIsQuickSelectOpen] = useState(false);

    const getAge = (birthDate?: string | null) => {
        if (!birthDate) return null;
        try {
            return differenceInYears(new Date(), new Date(birthDate));
        } catch {
            return null;
        }
    };

    if (!activeProfile) return null;

    const age = getAge(activeProfile.birthDate);
    const initials = activeProfile.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    return (
        <>
            {/* Floating Bar */}
            <div
                className={cn(
                    "sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-lightGray",
                    className
                )}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between px-4 py-2">
                        {/* Patient Info - Clickable */}
                        <button
                            onClick={() => setIsQuickSelectOpen(true)}
                            className="flex items-center gap-3 group"
                        >
                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full bg-charcoal flex items-center justify-center text-pureWhite text-sm font-heading font-bold transition-all duration-200 group-hover:bg-[#424242]">
                                    {initials}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-charcoal rounded-full border-2 border-pureWhite flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-pureWhite rounded-full" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="text-left">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-mediumGray">
                                        Atendimento ativo
                                    </span>
                                    <Activity className="w-3 h-3 text-charcoal" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-heading font-bold text-sm text-charcoal group-hover:text-[#424242] transition-colors">
                                        {activeProfile.name}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5 text-mediumGray group-hover:text-charcoal transition-colors" />
                                </div>
                            </div>
                        </button>

                        {/* Quick Stats */}
                        <div className="hidden md:flex items-center gap-4">
                            {age && (
                                <div className="flex items-center gap-1.5 text-xs text-mediumGray font-body">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>{age} anos</span>
                                </div>
                            )}
                            {activeProfile.gender && (
                                <div className="flex items-center gap-1.5 text-xs text-mediumGray font-body">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{activeProfile.gender}</span>
                                </div>
                            )}
                            {activeProfile.planType && (
                                <span className="px-2 py-0.5 bg-lightGray text-charcoal rounded-full text-xs font-heading font-bold">
                                    {activeProfile.planType}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Select Dialog */}
            <Dialog open={isQuickSelectOpen} onOpenChange={setIsQuickSelectOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5 text-charcoal" />
                            Trocar paciente
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2 max-h-[60vh] overflow-y-auto py-2">
                        {profiles.map((profile) => {
                            const profileInitials = profile.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();
                            const profileAge = getAge(profile.birthDate);
                            const isActive = activeProfile?.id === profile.id;

                            return (
                                <button
                                    key={profile.id}
                                    onClick={() => {
                                        setActiveProfile(profile);
                                        setIsQuickSelectOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
                                        isActive
                                            ? "bg-charcoal text-pureWhite"
                                            : "border border-lightGray hover:bg-backgroundGray"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <div
                                            className={cn(
                                                "w-11 h-11 rounded-full flex items-center justify-center text-sm font-heading font-bold transition-colors",
                                                isActive
                                                    ? "bg-pureWhite text-charcoal"
                                                    : "bg-lightGray text-charcoal"
                                            )}
                                        >
                                            {profileInitials}
                                        </div>
                                        {isActive && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-pureWhite rounded-full border-2 border-charcoal" />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={cn(
                                                "font-heading font-bold text-sm truncate",
                                                isActive ? "text-pureWhite" : "text-charcoal"
                                            )}
                                        >
                                            {profile.name}
                                        </p>
                                        <div className={cn(
                                            "flex items-center gap-2 text-xs font-body",
                                            isActive ? "text-pureWhite/70" : "text-mediumGray"
                                        )}>
                                            {profileAge && <span>{profileAge} anos</span>}
                                            {profile.gender && (
                                                <>
                                                    {profileAge && <span>•</span>}
                                                    <span>{profile.gender}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Badge */}
                                    {isActive && (
                                        <span className="flex-shrink-0 px-2 py-0.5 bg-pureWhite text-charcoal rounded-full text-xs font-heading font-bold">
                                            Ativo
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {profiles.length === 0 && (
                        <div className="py-8 text-center">
                            <Users className="w-12 h-12 mx-auto mb-3 text-lightGray" />
                            <p className="text-mediumGray font-body">Nenhum paciente cadastrado</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
