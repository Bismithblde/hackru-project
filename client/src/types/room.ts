export interface Room {
  id: string;
  code: string;
  name: string;
  createdBy: string;
  createdAt: number;
  participantCount: number;
  maxParticipants?: number;
  isPrivate?: boolean;
}

export interface CreateRoomRequest {
  name: string;
  createdBy: string;
  maxParticipants?: number;
  isPrivate?: boolean;
}

export interface CreateRoomResponse {
  success: boolean;
  room?: Room;
  error?: string;
}

export interface JoinRoomRequest {
  code: string;
  username: string;
}

export interface JoinRoomResponse {
  success: boolean;
  room?: Room;
  error?: string;
}

export interface RoomListResponse {
  success: boolean;
  rooms?: Room[];
  error?: string;
}
