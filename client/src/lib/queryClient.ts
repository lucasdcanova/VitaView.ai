import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`[API Request] ${method} ${url} - Request Data:`, data);
  document.cookie && console.log(`[API Request] Cookies:`, document.cookie);
  
  const requestOptions: RequestInit = {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include" as RequestCredentials,
  };
  
  console.log(`[API Request] Options:`, requestOptions);
  
  try {
    const res = await fetch(url, requestOptions);
    console.log(`[API Response] ${method} ${url} - Status:`, res.status);
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`[API Error] ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`[QueryFn] GET ${queryKey[0]} - ${new Date().toISOString()}`);
    document.cookie && console.log(`[QueryFn] Cookies:`, document.cookie);
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include" as RequestCredentials,
      });
      
      console.log(`[QueryFn] Response status: ${res.status} for ${queryKey[0]}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`[QueryFn] Returning null for 401 on ${queryKey[0]}`);
        return null;
      }
      
      await throwIfResNotOk(res);
      const data = await res.json();
      console.log(`[QueryFn] Success data for ${queryKey[0]}:`, data);
      return data;
    } catch (error) {
      console.error(`[QueryFn] Error for ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
