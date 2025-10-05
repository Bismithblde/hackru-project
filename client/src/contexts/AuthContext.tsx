import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { AuthResponse } from "../services/authService";

interface User {
  id: string;
  username: string;
  displayName: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (username: string, password: string, displayName?: string) => Promise<boolean>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("studybunny_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user:", e);
        localStorage.removeItem("studybunny_user");
      }
    }
  }, []);

  const register = async (
    username: string,
    password: string,
    displayName?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response: AuthResponse = await authService.register(
        username,
        password,
        displayName
      );

      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem("studybunny_user", JSON.stringify(response.user));
        // Also keep username in old format for compatibility
        localStorage.setItem("studybunny_username", response.user.displayName);
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response: AuthResponse = await authService.login(username, password);

      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem("studybunny_user", JSON.stringify(response.user));
        // Also keep username in old format for compatibility
        localStorage.setItem("studybunny_username", response.user.displayName);
        return true;
      }

      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("studybunny_user");
    localStorage.removeItem("studybunny_username");
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
