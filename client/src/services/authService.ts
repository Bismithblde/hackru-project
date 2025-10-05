import { API_BASE_URL } from "../constants/config";

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    displayName: string;
  };
  error?: string;
}

export interface CheckUsernameResponse {
  success: boolean;
  available?: boolean;
  error?: string;
}

export const authService = {
  /**
   * Register a new user
   */
  register: async (
    username: string,
    password: string,
    displayName?: string
  ): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, displayName }),
      });

      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        // Try to get JSON error if available
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || "Failed to register");
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  /**
   * Login user
   */
  login: async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const contentType = response.headers.get("content-type");

      if (!response.ok) {
        // Try to get JSON error if available
        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          throw new Error(error.error || "Failed to login");
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },

  /**
   * Check if username is available
   */
  checkUsername: async (username: string): Promise<CheckUsernameResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/check/${encodeURIComponent(username)}`
      );

      if (!response.ok) {
        throw new Error("Failed to check username");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network error. Please check your connection.");
    }
  },
};
