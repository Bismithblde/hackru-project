import type { DailyParticipant } from "@daily-co/daily-js";

export interface DailyCallbacks {
  onParticipantJoined?: (participant: DailyParticipant) => void;
  onParticipantLeft?: (participant: DailyParticipant) => void;
  onParticipantUpdated?: (participant: DailyParticipant) => void;
  onError?: (error: Error) => void;
}

export interface DailyRoomResponse {
  url: string;
  name: string;
}
