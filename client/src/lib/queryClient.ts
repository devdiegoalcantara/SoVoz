import { QueryClient } from "@tanstack/react-query";

export const apiRequest = async (
  method: string,
  url: string,
  body?: any
): Promise<any> => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const baseUrl = "/api";
    const fullUrl = url.startsWith("/api") ? url : `${baseUrl}${url}`;
    
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });

    const data = await response.json();
    // console.log('API Response:', data);

    if (!response.ok) {
      throw new Error(data.message || `Erro na requisição: ${response.status}`);
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    throw new Error(error.message || 'Erro ao conectar com o servidor');
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});