import axios from "axios";
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  RoomListResponse,
} from "../types";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: SERVER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const roomService = {
  /**
   * Create a new room
   */
  createRoom: async (data: CreateRoomRequest): Promise<CreateRoomResponse> => {
    try {
      const response = await api.post<CreateRoomResponse>(
        "/api/rooms/create",
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to create room",
      };
    }
  },

  /**
   * Join a room by code
   */
  joinRoom: async (data: JoinRoomRequest): Promise<JoinRoomResponse> => {
    try {
      const response = await api.post<JoinRoomResponse>(
        "/api/rooms/join",
        data
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to join room",
      };
    }
  },

  /**
   * Get list of active rooms
   */
  getRooms: async (): Promise<RoomListResponse> => {
    try {
      const response = await api.get<RoomListResponse>("/api/rooms");
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to fetch rooms",
      };
    }
  },

  /**
   * Get room by code
   */
  getRoomByCode: async (code: string): Promise<JoinRoomResponse> => {
    try {
      const response = await api.get<JoinRoomResponse>(`/api/rooms/${code}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Room not found",
      };
    }
  },

  /**
   * Delete a room (cleanup)
   */
  deleteRoom: async (
    code: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.delete(`/api/rooms/${code}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to delete room",
      };
    }
  },
};
