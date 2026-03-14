import { useState, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Profile } from "@shared/schema";
import { z } from "zod";

interface ProfileContextType {
  profiles: Profile[];
  isLoading: boolean;
  isFetchingProfiles: boolean;
  profilesError: Error | null;
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  createProfile: (data: Omit<Profile, "id" | "userId" | "createdAt">) => void;
  updateProfile: (id: number, data: Partial<Profile>) => void;
  deleteProfile: (id: number) => void;
  refreshProfiles: () => Promise<void>;
  // Patient in service state
  inServiceAppointmentId: number | null;
  setPatientInService: (profileId: number, appointmentId: number) => void;
  clearPatientInService: () => void;
  // Secretária
  selectedProfessionalId: number | null;
  setSelectedProfessionalId: (id: number | null) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isSecretarySession = user?.clinicRole === "secretary";
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [inServiceAppointmentId, setInServiceAppointmentId] = useState<number | null>(null);
  const previousUserIdRef = useRef<number | null>(null);
  const previousClinicIdRef = useRef<number | null>(null);

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<number | null>(null);
  const effectiveProfessionalId = isSecretarySession ? selectedProfessionalId : null;

  const persistActiveProfileCookie = (profileId: number | null) => {
    try {
      if (profileId) {
        document.cookie = `active_profile_id=${profileId}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        return;
      }

      document.cookie = `active_profile_id=; path=/; max-age=0; SameSite=Lax`;
    } catch (err) {
      // ignore cookie errors
    }
  };

  const syncActiveProfileLocally = (profile: Profile | null) => {
    setActiveProfileState(profile);
    persistActiveProfileCookie(profile?.id ?? null);

    if (profile) {
      queryClient.invalidateQueries({ queryKey: ["/api/patient-dashboard", profile.id] });
    }
  };

  const clearActiveProfile = () => {
    setActiveProfileState(null);
    setInServiceAppointmentId(null);
    persistActiveProfileCookie(null);
  };

  // Fetch user's profiles
  const {
    data: profiles = [],
    isLoading,
    isFetching: isFetchingProfiles,
    error: profilesError,
    refetch: refetchProfiles,
  } = useQuery<Profile[], Error>({
    queryKey: ["/api/profiles", user?.id ?? null, user?.clinicId ?? null, effectiveProfessionalId],
    queryFn: async () => {
      if (!user) return [];

      const url = effectiveProfessionalId
        ? `/api/profiles?professionalId=${effectiveProfessionalId}`
        : `/api/profiles`;

      const res = await apiRequest("GET", url);
      const payload = await res.json();

      if (!Array.isArray(payload)) {
        throw new Error("Resposta inválida ao carregar pacientes.");
      }

      return payload as Profile[];
    },
    enabled: !!user,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
    retry: 2,
  });

  const refreshProfiles = async () => {
    await refetchProfiles();
  };

  // Create new profile
  const createProfileMutation = useMutation({
    mutationFn: async (data: Omit<Profile, "id" | "userId" | "createdAt">) => {
      const res = await apiRequest("POST", "/api/profiles", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Paciente cadastrado",
        description: "O paciente foi adicionado ao seu painel",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao cadastrar paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update profile
  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Profile> }) => {
      const res = await apiRequest("PUT", `/api/profiles/${id}`, data);
      return await res.json();
    },
    onSuccess: (updatedProfile) => {
      toast({
        title: "Paciente atualizado",
        description: "Os dados do paciente foram atualizados",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });

      // Update active profile if it was the one that was updated
      if (activeProfile && activeProfile.id === updatedProfile.id) {
        setActiveProfileState(updatedProfile);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete profile
  const deleteProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/profiles/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      toast({
        title: "Paciente removido",
        description: "O paciente foi removido do painel",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });

      // If active profile was deleted, select a different one
      if (activeProfile && activeProfile.id === deletedId) {
        const remainingProfiles = profiles.filter((p: Profile) => p.id !== deletedId);
        const defaultProfile = remainingProfiles.find((p: Profile) => p.isDefault);
        const nextProfile = defaultProfile || remainingProfiles[0] || null;

        if (nextProfile) {
          syncActiveProfileLocally(nextProfile);
        } else {
          clearActiveProfile();
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Switch active profile
  const setActiveProfileMutation = useMutation({
    mutationFn: async (profile: Profile) => {
      const res = await apiRequest("PUT", `/api/users/active-profile`, {
        profileId: profile.id,
      });
      return profile;
    },
    onSuccess: (profile) => {
      toast({
        title: "Paciente selecionado",
        description: `Visualizando histórico de "${profile.name}"`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao selecionar paciente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize active profile
  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, ...rest] = cookie.trim().split('=');
        if (key) acc[key] = rest.join('=');
        return acc;
      }, {} as Record<string, string>);

      const cookieProfileId = cookies['active_profile_id'] ? Number(cookies['active_profile_id']) : undefined;

      if (cookieProfileId) {
        const storedProfile = profiles.find((p: Profile) => p.id === cookieProfileId);
        if (storedProfile) {
          setActiveProfileState(storedProfile);
          return;
        }
      }

      // Do not auto-select a profile if none is found in cookies
      // The user must explicitly select a patient
      setActiveProfileState(null);
    }
  }, [profiles, activeProfile]);

  // Clear stale profile when session switches to a different user
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const previousUserId = previousUserIdRef.current;

    if (previousUserId !== null && previousUserId !== currentUserId) {
      clearActiveProfile();
      setSelectedProfessionalId(null);
    }

    previousUserIdRef.current = currentUserId;
  }, [user?.id]);

  // Safety: changing active clinic must reset patient/professional selections to avoid context leakage.
  useEffect(() => {
    const currentClinicId = user?.clinicId ?? null;
    const previousClinicId = previousClinicIdRef.current;

    if (previousClinicId !== null && previousClinicId !== currentClinicId) {
      clearActiveProfile();
      setSelectedProfessionalId(null);
    }

    previousClinicIdRef.current = currentClinicId;
  }, [user?.clinicId]);

  // Safety: never keep a stale professional selection when the session is not a secretary.
  useEffect(() => {
    if (!isSecretarySession && selectedProfessionalId !== null) {
      setSelectedProfessionalId(null);
    }
  }, [isSecretarySession, selectedProfessionalId]);

  // Defensive cleanup when active profile no longer belongs to the loaded profile list
  useEffect(() => {
    if (!activeProfile) return;
    const profileStillExists = profiles.some((p: Profile) => p.id === activeProfile.id);
    if (!profileStillExists) {
      clearActiveProfile();
    }
  }, [profiles, activeProfile]);

  // Wrapper functions
  const setActiveProfile = (profile: Profile | null) => {
    if (!profile) {
      clearActiveProfile();
      return;
    }

    syncActiveProfileLocally(profile);
    setActiveProfileMutation.mutate(profile);
  };

  const createProfile = (data: Omit<Profile, "id" | "userId" | "createdAt">) => {
    createProfileMutation.mutate(data);
  };

  const updateProfile = (id: number, data: Partial<Profile>) => {
    updateProfileMutation.mutate({ id, data });
  };

  const deleteProfile = (id: number) => {
    deleteProfileMutation.mutate(id);
  };

  // Set patient in service - automatically select the patient and track the appointment
  const setPatientInService = (profileId: number, appointmentId: number) => {
    const profile = profiles.find((p: Profile) => p.id === profileId);
    if (profile) {
      syncActiveProfileLocally(profile);
      setInServiceAppointmentId(appointmentId);
    }
  };

  // Clear patient in service
  const clearPatientInService = () => {
    setInServiceAppointmentId(null);
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        isLoading,
        isFetchingProfiles,
        profilesError: profilesError ?? null,
        activeProfile,
        setActiveProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        refreshProfiles,
        inServiceAppointmentId,
        setPatientInService,
        clearPatientInService,
        selectedProfessionalId,
        setSelectedProfessionalId,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfiles() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfiles must be used within a ProfileProvider");
  }
  return context;
}
