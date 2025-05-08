import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Profile } from "@shared/schema";

interface ProfileContextType {
  profiles: Profile[];
  isLoading: boolean;
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  createProfile: (data: Omit<Profile, "id" | "userId" | "createdAt">) => void;
  updateProfile: (id: number, data: Partial<Profile>) => void;
  deleteProfile: (id: number) => void;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);

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
        console.error("Error fetching profiles:", error);
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
        title: "Perfil criado",
        description: "O perfil foi criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar perfil",
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
        title: "Perfil atualizado",
        description: "O perfil foi atualizado com sucesso",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      
      // Update active profile if it was the one that was updated
      if (activeProfile && activeProfile.id === updatedProfile.id) {
        setActiveProfileState(updatedProfile);
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
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
        title: "Perfil removido",
        description: "O perfil foi removido com sucesso",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      
      // If active profile was deleted, select a different one
      if (activeProfile && activeProfile.id === deletedId) {
        const defaultProfile = profiles.find(p => p.isDefault);
        if (defaultProfile) {
          setActiveProfileState(defaultProfile);
        } else if (profiles.length > 0) {
          setActiveProfileState(profiles[0]);
        } else {
          setActiveProfileState(null);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover perfil",
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
        title: "Perfil alterado",
        description: `Agora você está usando o perfil "${profile.name}"`,
      });
      
      // Refresh all data for the new profile
      queryClient.invalidateQueries({ queryKey: ["/api/exams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao mudar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize active profile
  useEffect(() => {
    if (profiles.length > 0 && !activeProfile) {
      const defaultProfile = profiles.find((p: Profile) => p.isDefault);
      if (defaultProfile) {
        setActiveProfileState(defaultProfile);
      } else {
        setActiveProfileState(profiles[0]);
      }
    }
  }, [profiles, activeProfile]);

  // Wrapper functions
  const setActiveProfile = (profile: Profile) => {
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