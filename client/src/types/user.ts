export interface User {
  userId: string;
  username: string;
  socketId: string;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  points: number;
}
