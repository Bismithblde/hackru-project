import { createContext, useContext, useReducer } from "react";
import type { ReactNode } from "react";
import type { Room, CreateRoomRequest, JoinRoomRequest } from "../types";
import { roomService } from "../services/roomService";

interface RoomState {
  rooms: Room[];
  currentRoom: Room | null;
  loading: boolean;
  error: string | null;
}

type RoomAction =
  | { type: "SET_ROOMS"; payload: Room[] }
  | { type: "SET_CURRENT_ROOM"; payload: Room | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "ADD_ROOM"; payload: Room }
  | { type: "UPDATE_ROOM"; payload: Room }
  | { type: "REMOVE_ROOM"; payload: string };

interface RoomContextType extends RoomState {
  createRoom: (data: CreateRoomRequest) => Promise<Room | null>;
  joinRoom: (data: JoinRoomRequest) => Promise<Room | null>;
  fetchRooms: () => Promise<void>;
  leaveRoom: () => void;
  deleteRoom: (code: string) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const roomReducer = (state: RoomState, action: RoomAction): RoomState => {
  switch (action.type) {
    case "SET_ROOMS":
      return { ...state, rooms: action.payload };
    case "SET_CURRENT_ROOM":
      return { ...state, currentRoom: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "ADD_ROOM":
      return { ...state, rooms: [...state.rooms, action.payload] };
    case "UPDATE_ROOM":
      return {
        ...state,
        rooms: state.rooms.map((room) =>
          room.code === action.payload.code ? action.payload : room
        ),
        currentRoom:
          state.currentRoom?.code === action.payload.code
            ? action.payload
            : state.currentRoom,
      };
    case "REMOVE_ROOM":
      return {
        ...state,
        rooms: state.rooms.filter((room) => room.code !== action.payload),
        currentRoom:
          state.currentRoom?.code === action.payload ? null : state.currentRoom,
      };
    default:
      return state;
  }
};

const initialState: RoomState = {
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,
};

export const RoomProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(roomReducer, initialState);

  const createRoom = async (data: CreateRoomRequest): Promise<Room | null> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await roomService.createRoom(data);
      if (!response.room) {
        throw new Error("Invalid response from server");
      }

      const newRoom = response.room;

      dispatch({ type: "ADD_ROOM", payload: newRoom });
      dispatch({ type: "SET_CURRENT_ROOM", payload: newRoom });

      return newRoom;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create room";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return null;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const joinRoom = async (data: JoinRoomRequest): Promise<Room | null> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await roomService.joinRoom(data);
      if (!response.room) {
        throw new Error("Invalid response from server");
      }

      const room = response.room;

      // Update room in list if it exists, otherwise add it
      const existingRoom = state.rooms.find((r) => r.code === room.code);
      if (existingRoom) {
        dispatch({ type: "UPDATE_ROOM", payload: room });
      } else {
        dispatch({ type: "ADD_ROOM", payload: room });
      }

      dispatch({ type: "SET_CURRENT_ROOM", payload: room });

      return room;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to join room";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return null;
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const fetchRooms = async (): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      const response = await roomService.getRooms();
      dispatch({ type: "SET_ROOMS", payload: response.rooms || [] });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch rooms";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const leaveRoom = (): void => {
    dispatch({ type: "SET_CURRENT_ROOM", payload: null });
  };

  const deleteRoom = async (code: string): Promise<void> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "SET_ERROR", payload: null });

      await roomService.deleteRoom(code);
      dispatch({ type: "REMOVE_ROOM", payload: code });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete room";
      dispatch({ type: "SET_ERROR", payload: errorMessage });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const value: RoomContextType = {
    ...state,
    createRoom,
    joinRoom,
    fetchRooms,
    leaveRoom,
    deleteRoom,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export const useRoomContext = (): RoomContextType => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error("useRoomContext must be used within a RoomProvider");
  }
  return context;
};
