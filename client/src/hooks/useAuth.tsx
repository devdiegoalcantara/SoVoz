import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ token: string; user: User } | null>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if the user is already logged in (token in localStorage)
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      fetchUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const res = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(authToken);
      } else {
        // If the token is invalid, clear it
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      toast({
        title: "Login bem-sucedido",
        description: "Você está conectado agora.",
      });

      // Redirect based on user role
      if (data.user.role === 'admin') {
        setLocation("/dashboard");
      } else {
        setLocation("/tickets");
      }
      return data;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro de login",
        description: "Email ou senha inválidos.",
        variant: "destructive",
      });
      return null;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await apiRequest("POST", "/api/auth/register", {
        name,
        email,
        password,
      });
      const data = await res.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem("token", data.token);
      toast({
        title: "Registro bem-sucedido",
        description: "Sua conta foi criada.",
      });
      setLocation("/tickets");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Erro no registro",
        description: "Não foi possível criar sua conta.",
        variant: "destructive",
      });
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    setLocation("/login");
    toast({
      title: "Logout bem-sucedido",
      description: "Você saiu da sua conta.",
    });
  };

  const apiRequestWithAuth = async (method: string, url: string, body?: any) => {
    const authToken = localStorage.getItem('token');
    const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
    return apiRequest(method, url, body, headers);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        apiRequestWithAuth
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};