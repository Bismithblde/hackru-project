export interface Message {
  userId: string;
  username?: string;
  message: string;
  ts: number;
}

export interface ChatMessagePayload {
  roomId: string;
  userId: string;
  username: string;
  message: string;
  ts: number;
}
