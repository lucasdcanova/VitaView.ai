import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useProfiles } from "@/hooks/use-profiles";
import { User, ChevronRight, Calendar, Activity, Users, Search, X, UserPlus, Heart } from "lucide-react";
import { differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Profile } from "@shared/schema";
import CreatePatientDialog from "@/components/create-patient-dialog";
import PatientAvatar from "@/components/patient-avatar";

/**
 * VitaView AI Active Patient Indicator Component
 * 
 * Design Language:
 * - Paleta monocromática em escala de cinza
 * - Avatar: Charcoal Gray (#212121)
 * - Bordas: Light Gray (#E0E0E0)
 * - Ativo: Charcoal Gray com texto branco
 * - Tipografia: Montserrat Bold para nomes
 */

interface ActivePatientIndicatorProps {
    variant?: "compact" | "full";
    collapsed?: boolean;
    surface?: "solid" | "glass";
    className?: string;
    patientClickTarget?: string;
}

export default function ActivePatientIndicator({
    variant = "full",
    collapsed = false,
    surface = "solid",
    className,
    patientClickTarget,
}: ActivePatientIndicatorProps) {
    const { activeProfile, profiles, setActiveProfile } = useProfiles();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [location, setLocation] = useLocation();

    const handleCreatePatient = () => {
        setIsDialogOpen(false);
        setIsCreateDialogOpen(true);
    };

    const getAge = (birthDate?: string | null) => {
        if (!birthDate) return null;
        try {
            return differenceInYears(new Date(), new Date(birthDate));
        } catch {
            return null;
        }
    };

    const filteredProfiles = profiles.filter((profile) =>
        profile.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handlePatientSelectorClick = () => {
        if (patientClickTarget) {
            setLocation(patientClickTarget);
            return;
        }

        setIsDialogOpen(true);
    };

    const handleSelect = (profile: Profile) => {
        setActiveProfile(profile);
        setIsDialogOpen(false);
        setSearchQuery("");
    };

    // Dialog components wrapper to avoid repetition
    const Dialogs = () => (
        <>
            <PatientSelectionDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                profiles={filteredProfiles}
                activeProfile={activeProfile}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onSelect={handleSelect}
                getAge={getAge}
                totalProfiles={profiles.length}
                onCreatePatient={handleCreatePatient}
            />

            <CreatePatientDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
            />
        </>
    );

    // Collapsed State (Just Avatar)
    if (collapsed) {
        return (
            <>
                <div
                    onClick={handlePatientSelectorClick}
                    className={cn(
                        "group flex justify-center items-center w-10 h-10 rounded-full cursor-pointer transition-all duration-200",
                        activeProfile
                            ? "bg-charcoal text-pureWhite hover:bg-[#424242]"
                            : "bg-lightGray text-mediumGray hover:bg-charcoal hover:text-pureWhite",
                        className
                    )}
                    title={activeProfile ? activeProfile.name : "Selecionar Paciente"}
                >
                    {activeProfile ? (
                        <PatientAvatar
                            profile={activeProfile}
                            className="w-10 h-10 rounded-md border border-lightGray/70"
                            fallbackClassName="bg-charcoal text-pureWhite text-xs"
                        />
                    ) : (
                        <User className="w-5 h-5" />
                    )}
                </div>
                {!patientClickTarget && <Dialogs />}
            </>
        );
    }

    // Empty state - no patient selected
    if (!activeProfile) {
        return (
            <>
                <div
                    onClick={handlePatientSelectorClick}
                    className={cn(
                        "group flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200",
                        surface === "glass"
                            ? "bg-pureWhite/40 border border-dashed border-lightGray/70 backdrop-blur-sm hover:border-charcoal/70 hover:bg-pureWhite/55"
                            : "bg-pureWhite border-2 border-dashed border-lightGray hover:border-charcoal hover:bg-backgroundGray",
                        className
                    )}
                >
                    <div className="w-10 h-10 rounded-full bg-lightGray flex items-center justify-center group-hover:bg-charcoal transition-colors">
                        <User className="w-5 h-5 text-mediumGray group-hover:text-pureWhite" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-heading font-bold text-mediumGray group-hover:text-charcoal">
                            Selecionar paciente
                        </p>
                        <p className="text-xs text-mediumGray font-body">
                            {profiles.length > 0
                                ? `${profiles.length} paciente${profiles.length > 1 ? "s" : ""} cadastrado${profiles.length > 1 ? "s" : ""}`
                                : "Clique para cadastrar"}
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-mediumGray group-hover:text-charcoal transition-colors" />
                </div>
                {!patientClickTarget && <Dialogs />}
            </>
        );
    }

    const age = getAge(activeProfile.birthDate);

    // Compact variant
    if (variant === "compact") {
        return (
            <>
                <div
                    onClick={handlePatientSelectorClick}
                    className={cn(
                        "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200",
                        "bg-charcoal border border-charcoal",
                        "hover:bg-[#424242]",
                        className
                    )}
                >
                    <div className="relative">
                        <PatientAvatar
                            profile={activeProfile}
                            className="w-8 h-8 rounded-md border border-pureWhite/80"
                            fallbackClassName="bg-pureWhite text-charcoal text-xs"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-pureWhite rounded-full border-2 border-charcoal" />
                    </div>
                    <span className="font-heading font-bold text-sm text-pureWhite truncate max-w-[120px]">
                        {activeProfile.name.split(" ")[0]}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-pureWhite/70" />
                </div>
                {!patientClickTarget && <Dialogs />}
            </>
        );
    }

    // Full variant (default)
    return (
        <>
            <div
                className={cn(
                    "group relative overflow-hidden rounded-lg transition-all duration-200",
                    surface === "glass"
                        ? "bg-pureWhite/42 backdrop-blur-md border border-lightGray/70 hover:border-charcoal/60 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset]"
                        : "bg-pureWhite border border-lightGray hover:border-charcoal hover:shadow-sm",
                    className
                )}
            >
                {/* Decorative line at top */}
                <div className={cn("absolute top-0 left-0 right-0 h-1 bg-charcoal", surface === "glass" && "opacity-85")} />

                {/* End Attendance Button (Red X) */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveProfile(null);
                    }}
                    className="absolute top-2 right-2 z-20 p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all cursor-pointer"
                    title="Encerrar atendimento"
                >
                    <X className="w-4 h-4" />
                </div>

                {/* Top Section: Patient Selection */}
                <div
                    onClick={handlePatientSelectorClick}
                    className={cn(
                        "p-4 pt-5 cursor-pointer transition-colors",
                        surface === "glass" ? "hover:bg-pureWhite/28" : "hover:bg-gray-50"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-3.5 h-3.5 text-charcoal" />
                        <span className="text-[10px] font-heading font-bold uppercase tracking-[0.15em] text-charcoal">
                            Paciente em Atendimento
                        </span>
                    </div>

                    {/* Patient Info */}
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <PatientAvatar
                                profile={activeProfile}
                                className="w-12 h-12 rounded-md border border-lightGray/80"
                                fallbackClassName="bg-charcoal text-pureWhite text-base"
                            />
                            {/* Active indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-charcoal rounded-full border-2 border-pureWhite flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-pureWhite rounded-full" />
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-heading font-bold text-charcoal truncate text-sm leading-tight">
                                {activeProfile.name}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-mediumGray font-body">
                                {age && (
                                    <span className="inline-flex items-center gap-0.5">
                                        <Calendar className="w-2.5 h-2.5" />
                                        {age}a
                                    </span>
                                )}
                                {activeProfile.gender && (
                                    <>
                                        <span className="w-0.5 h-0.5 rounded-full bg-mediumGray" />
                                        <span>{activeProfile.gender === "Masculino" ? "M" : activeProfile.gender === "Feminino" ? "F" : activeProfile.gender}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action: Switch Patient */}
                        <div className="flex-shrink-0">
                            <div className="w-7 h-7 rounded-full bg-lightGray flex items-center justify-center group-hover:bg-charcoal transition-colors">
                                <ChevronRight className="w-3.5 h-3.5 text-mediumGray group-hover:text-pureWhite" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className={cn("h-px w-full", surface === "glass" ? "bg-lightGray/70" : "bg-lightGray")} />

                {/* Bottom Section: Atendimento Action */}
                <div
                    onClick={() => setLocation("/atendimento")}
                    className={cn(
                        "group/atendimento relative flex cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-[18px] border px-4 py-3 transition-all duration-300",
                        location === "/atendimento"
                            ? "border-white/70 bg-[#f7f7f6] text-[#111827] shadow-[0_12px_28px_rgba(0,0,0,0.16)]"
                            : "border-white/75 bg-[#f8f8f7] text-[#111827] shadow-[0_14px_34px_rgba(0,0,0,0.24)] hover:-translate-y-[1px] hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)] active:translate-y-0"
                    )}
                >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_left_center,rgba(255,255,255,0.92),transparent_46%)] opacity-35" />
                    <div className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[#111827]/80" />
                    <div className="relative flex min-w-0 flex-1 items-center gap-3 pl-1.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
                            <Heart className="h-[17px] w-[17px]" />
                        </div>
                        <div className="min-w-0">
                            <span className="block whitespace-normal break-words font-heading text-[13px] font-extrabold leading-none tracking-[0.01em] text-[#111827] sm:text-[14px] md:text-[15px]">
                                Ir para atendimento
                            </span>
                        </div>
                    </div>
                    <div className="relative flex items-center">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#111827]/12 bg-white/80 text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] transition-transform duration-300 group-hover/atendimento:translate-x-0.5">
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            {!patientClickTarget && (
                <>
                    <PatientSelectionDialog
                        isOpen={isDialogOpen}
                        onClose={() => setIsDialogOpen(false)}
                        profiles={filteredProfiles}
                        activeProfile={activeProfile}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onSelect={handleSelect}
                        getAge={getAge}
                        totalProfiles={profiles.length}
                        onCreatePatient={handleCreatePatient}
                    />

                    <CreatePatientDialog
                        open={isCreateDialogOpen}
                        onOpenChange={setIsCreateDialogOpen}
                    />
                </>
            )}
        </>
    );
}

// Separate dialog component for patient selection
interface PatientSelectionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: Profile[];
    activeProfile: Profile | null;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onSelect: (profile: Profile) => void;
    getAge: (birthDate?: string | null) => number | null;
    totalProfiles: number;
    onCreatePatient: () => void;
}

function PatientSelectionDialog({
    isOpen,
    onClose,
    profiles,
    activeProfile,
    searchQuery,
    setSearchQuery,
    onSelect,
    getAge,
    totalProfiles,
    onCreatePatient,
}: PatientSelectionDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <DialogHeader className="p-5 pb-4 border-b border-lightGray bg-backgroundGray">
                    <DialogTitle className="flex items-center gap-2 text-lg font-heading font-bold text-charcoal">
                        <div className="w-8 h-8 rounded-full bg-charcoal flex items-center justify-center">
                            <Users className="w-4 h-4 text-pureWhite" />
                        </div>
                        Selecionar Paciente
                    </DialogTitle>
                </DialogHeader>

                {/* Search */}
                <div className="p-4 border-b border-lightGray">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mediumGray" />
                        <Input
                            placeholder="Buscar por nome..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-9"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-lightGray rounded transition-colors"
                            >
                                <X className="w-3.5 h-3.5 text-mediumGray" />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-xs text-mediumGray mt-2 font-body">
                            {profiles.length} de {totalProfiles} pacientes
                        </p>
                    )}
                </div>

                {/* Patient List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
                    {profiles.length === 0 ? (
                        <div className="py-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-lightGray flex items-center justify-center">
                                <Users className="w-8 h-8 text-mediumGray" />
                            </div>
                            <p className="font-heading font-bold text-charcoal">
                                {totalProfiles === 0 ? "Nenhum paciente cadastrado" : "Nenhum resultado encontrado"}
                            </p>
                            <p className="text-sm text-mediumGray mt-1 font-body">
                                {totalProfiles === 0 ? "Cadastre seu primeiro paciente" : "Tente outra busca"}
                            </p>
                        </div>
                    ) : (
                        profiles.map((profile) => {
                            const isActive = activeProfile?.id === profile.id;
                            const profileAge = getAge(profile.birthDate);

                            return (
                                <button
                                    key={profile.id}
                                    onClick={() => onSelect(profile)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
                                        isActive
                                            ? "bg-charcoal text-pureWhite"
                                            : "border border-lightGray hover:bg-backgroundGray"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <PatientAvatar
                                            profile={profile}
                                            className={cn(
                                                "w-11 h-11 rounded-md border transition-all",
                                                isActive ? "border-pureWhite/80" : "border-lightGray/80"
                                            )}
                                            fallbackClassName={cn(
                                                "text-sm",
                                                isActive ? "bg-pureWhite text-charcoal" : "bg-lightGray text-charcoal"
                                            )}
                                        />
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
                                            "flex items-center gap-1.5 text-xs font-body mt-0.5",
                                            isActive ? "text-pureWhite/70" : "text-mediumGray"
                                        )}>
                                            {profileAge && <span>{profileAge} anos</span>}
                                            {profile.gender && (
                                                <>
                                                    {profileAge && <span>•</span>}
                                                    <span>{profile.gender}</span>
                                                </>
                                            )}
                                            {profile.planType && (
                                                <>
                                                    <span>•</span>
                                                    <span className="truncate">{profile.planType}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Badge */}
                                    {isActive && (
                                        <span className="flex-shrink-0 px-2.5 py-1 bg-pureWhite text-charcoal rounded-full text-xs font-heading font-bold">
                                            Ativo
                                        </span>
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Footer with Add Button */}
                <div className="p-4 border-t border-lightGray bg-backgroundGray">
                    <Button
                        onClick={() => {
                            onClose();
                            onCreatePatient();
                        }}
                        className="w-full"
                        variant="outline"
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Cadastrar novo paciente
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
