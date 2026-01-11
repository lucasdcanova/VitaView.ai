import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = { email: string; password: string };

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Configurar o cookie auxiliar para autenticação
      document.cookie = `auth_user_id=${user.id}; max-age=${7 * 24 * 60 * 60}; path=/; SameSite=Lax`;
      queryClient.setQueryData(["/api/user"], user);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      // Popup de login bem-sucedido removido conforme solicitado
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no login",
        description: "Email ou senha incorretos.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: SelectUser) => {
      // Configurar o cookie auxiliar para autenticação
      document.cookie = `auth_user_id=${user.id}; max-age=${7 * 24 * 60 * 60}; path=/; SameSite=Lax`;
      queryClient.setQueryData(["/api/user"], user);
      // Popup de registro bem-sucedido removido conforme solicitado
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no registro",
        description: error.message || "Este email já está cadastrado.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      // Remover o cookie auxiliar
      document.cookie = "auth_user_id=; max-age=0; path=/; SameSite=Lax";
      queryClient.setQueryData(["/api/user"], null);
      // Redirecionar para a página de login após logout
      navigate("/auth");
      // Popup de logout removido conforme solicitado
    },
    onError: (error: Error) => {
      toast({
        title: "Falha no logout",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
