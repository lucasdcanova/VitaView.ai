import { apiRequest } from "./queryClient";
import { ExamResult, Exam, HealthMetric, Notification } from "@shared/schema";

// Tipo para dados do paciente usados na análise
export interface PatientData {
  gender?: string;
  age?: number;
  diseases?: string[];
  surgeries?: string[];
  allergies?: string[];
  familyHistory?: string;
  [key: string]: any;
}

// Exams API
export const uploadExam = async (examData: FormData) => {
  const res = await fetch("/api/exams/upload", {
    method: "POST",
    body: examData,
    credentials: "include"
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
};

export const getExamDetails = async (examId: number): Promise<{ exam: Exam, result: ExamResult }> => {
  const res = await fetch(`/api/exams/${examId}`, {
    credentials: "include"
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
};

export const getExamInsights = async (examId: number) => {
  const res = await fetch(`/api/exams/${examId}/insights`, {
    credentials: "include"
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
};

// Nova função: Analisa um exame já extraído usando OpenAI
export const analyzeExtractedExam = async (examId: number, patientData?: PatientData) => {
  console.log(`Solicitando análise OpenAI para exame ID ${examId}`);
  
  try {
    const res = await apiRequest("POST", `/api/exams/${examId}/analyze`, { patientData });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Erro na análise do exame ${examId}:`, errorText);
      throw new Error(errorText || res.statusText);
    }
    
    return await res.json();
  } catch (error) {
    console.error("Erro ao analisar exame com OpenAI:", error);
    throw error;
  }
};

// Health Metrics API
export const getLatestHealthMetrics = async (): Promise<HealthMetric[]> => {
  const res = await fetch("/api/health-metrics/latest", {
    credentials: "include"
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
};

// Notifications API
export const getNotifications = async (): Promise<Notification[]> => {
  const res = await fetch("/api/notifications", {
    credentials: "include"
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || res.statusText);
  }
  
  return res.json();
};

export const markNotificationAsRead = async (notificationId: number): Promise<Notification> => {
  const res = await apiRequest("POST", `/api/notifications/${notificationId}/read`);
  return await res.json();
};

// User Profile API
export const updateUserProfile = async (profileData: any) => {
  try {
    // Usar apiRequest para garantir que 'credentials: include' seja enviado
    const res = await apiRequest("PUT", "/api/user/profile", profileData);
    return await res.json();
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error(error instanceof Error ? error.message : "Erro ao atualizar perfil");
  }
};

// Função para excluir um exame
export const deleteExam = async (examId: number): Promise<{ message: string }> => {
  try {
    const res = await apiRequest("DELETE", `/api/exams/${examId}`);
    return await res.json();
  } catch (error) {
    console.error("Erro ao excluir exame:", error);
    throw new Error(error instanceof Error ? error.message : "Erro ao excluir o exame");
  }
};

// Função para excluir todas as métricas de saúde de um usuário
export const deleteAllHealthMetrics = async (userId: number): Promise<{ message: string, count: number }> => {
  try {
    const res = await apiRequest("DELETE", `/api/health-metrics/user/${userId}`);
    return await res.json();
  } catch (error) {
    console.error("Erro ao excluir métricas de saúde:", error);
    throw new Error(error instanceof Error ? error.message : "Erro ao excluir métricas de saúde");
  }
};
