import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Profile } from "@shared/schema";
import { z } from "zod";

interface ProfileContextType {
  profiles: Profile[];
  isLoading: boolean;
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  createProfile: (data: Omit<Profile, "id" | "userId" | "createdAt">) => void;
  updateProfile: (id: number, data: Partial<Profile>) => void;
  deleteProfile: (id: number) => void;
  // Patient in service state
  inServiceAppointmentId: number | null;
  setPatientInService: (profileId: number, appointmentId: number) => void;
  clearPatientInService: () => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);
  const [inServiceAppointmentId, setInServiceAppointmentId] = useState<number | null>(null);

  // Fetch user's profiles
  const {
    data: profiles = [],
    isLoading,
    refetch: refetchProfiles,
  } = useQuery({
    queryKey: ["/api/profiles"],
    queryFn: async () => {
      if (!user) return [];

      try {
        const res = await apiRequest("GET", "/api/profiles");
        return await res.json();
      } catch (error) {
        // Error fetching profiles
        return [];
      }
    },
    enabled: !!user,
  });

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

        setActiveProfileState(nextProfile || null);

        try {
          if (nextProfile) {
            document.cookie = `active_profile_id=${nextProfile.id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
          } else {
            document.cookie = `active_profile_id=; path=/; max-age=0; SameSite=Lax`;
          }
        } catch (err) {
          // ignore cookie errors
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
      setActiveProfileState(profile);

      toast({
        title: "Paciente selecionado",
        description: `Visualizando histórico de "${profile.name}"`,
      });

      try {
        document.cookie = `active_profile_id=${profile.id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      } catch (err) {
        // Ignore cookie errors no-op
      }

      // Refresh patient dashboard data for the new profile
      queryClient.invalidateQueries({ queryKey: ["/api/patient-dashboard", profile.id] });
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

  // Wrapper functions
  const setActiveProfile = (profile: Profile | null) => {
    if (!profile) {
      setActiveProfileState(null);
      setInServiceAppointmentId(null);
      document.cookie = `active_profile_id=; path=/; max-age=0; SameSite=Lax`;
      return;
    }
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
      setActiveProfileState(profile);
      setInServiceAppointmentId(appointmentId);
      try {
        document.cookie = `active_profile_id=${profile.id}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      } catch (err) {
        // Ignore cookie errors
      }
      // Refresh patient dashboard data for the new profile
      queryClient.invalidateQueries({ queryKey: ["/api/patient-dashboard", profile.id] });
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
        activeProfile,
        setActiveProfile,
        createProfile,
        updateProfile,
        deleteProfile,
        inServiceAppointmentId,
        setPatientInService,
        clearPatientInService,
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
