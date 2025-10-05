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
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, displayName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to register");
    }

    return await response.json();
  },

  /**
   * Login user
   */
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to login");
    }

    return await response.json();
  },

  /**
   * Check if username is available
   */
  checkUsername: async (username: string): Promise<CheckUsernameResponse> => {
    const response = await fetch(
      `${API_BASE_URL}/auth/check/${encodeURIComponent(username)}`
    );

    if (!response.ok) {
      throw new Error("Failed to check username");
    }

    return await response.json();
  },
};
