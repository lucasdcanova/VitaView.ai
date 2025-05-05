import { apiRequest } from "./queryClient";
import { ExamResult, Exam, HealthMetric, Notification } from "@shared/schema";

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
