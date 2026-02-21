import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;

    try {
      const json = JSON.parse(text);
      if (json?.message) {
        message = json.message;
      }
    } catch {
      // Ignore JSON parse errors and keep fallback message
    }

    throw new ApiError(message, res.status);
  }
}

// Helper to check for AI warnings
function checkAIWarning(res: Response) {
  const warning = res.headers.get("X-AI-Warning");
  if (warning) {
    const delay = res.headers.get("X-AI-Throttle-Delay");

    let title = "Aviso de uso de IA";
    let description = "Você está se aproximando do limite de uso.";
    let variant: "default" | "destructive" = "default";

    if (warning === 'weary') {
      title = "Uso de IA elevado";
      description = `Limite mensal excedido levemente. Pequeno atraso aplicado (${delay || '2000'}ms).`;
    } else if (warning === 'critical') {
      title = "Limite de IA excedido";
      description = `Você excedeu significativamente seu limite. A velocidade foi reduzida (${delay || '5000'}ms).`;
      variant = "destructive";
    }

    toast({
      title,
      description,
      variant: variant,
      duration: 5000,
    });
  }
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const normalizeNetworkError = (error: unknown): Error => {
  if (error instanceof Error) {
    const message = error.message || "";
    const isNetworkFailure =
      error.name === "TypeError" ||
      /failed to fetch|networkerror|load failed|err_connection_refused/i.test(message);

    if (isNetworkFailure) {
      return new Error("Não foi possível conectar ao servidor. Verifique se o backend está ativo em http://localhost:3000.");
    }

    return error;
  }

  return new Error("Erro de conexão com o servidor.");
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  maxRetries: number = 2,
): Promise<Response> {

  const requestOptions: RequestInit = {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include" as RequestCredentials,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, requestOptions);

      // If it's a 5xx error and we have retries left, retry
      if (res.status >= 500 && attempt < maxRetries) {
        console.log(`[API] Server error ${res.status}, retrying (${attempt + 1}/${maxRetries})...`);
        await delay(500 * (attempt + 1)); // Exponential backoff: 500ms, 1000ms, etc.
        continue;
      }

      await throwIfResNotOk(res);
      checkAIWarning(res);
      return res;
    } catch (error) {
      if (error instanceof ApiError) {
        // Do not retry client errors (4xx). For 5xx, retry path is handled above.
        throw error;
      }

      lastError = normalizeNetworkError(error);

      // If it's a network error and we have retries left, retry
      if (attempt < maxRetries) {
        console.log(`[API] Request failed, retrying (${attempt + 1}/${maxRetries})...`);
        await delay(500 * (attempt + 1));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {

      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include" as RequestCredentials,
        });


        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          return null;
        }

        checkAIWarning(res);
        await throwIfResNotOk(res);
        const data = await res.json();
        return data;
      } catch (error) {
        throw error;
      }
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
