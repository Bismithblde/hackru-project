import DailyIframe from "@daily-co/daily-js";
import type { DailyCall, DailyParticipant } from "@daily-co/daily-js";

let callObject: DailyCall | null = null;

interface DailyCallbacks {
  onParticipantJoined?: (participant: DailyParticipant) => void;
  onParticipantLeft?: (participant: DailyParticipant) => void;
  onParticipantUpdated?: (participant: DailyParticipant) => void;
  onError?: (error: Error) => void;
}

/**
 * Initialize and join a Daily.co room
 */
export async function joinDailyRoom(
  roomUrl: string,
  userName: string,
  callbacks?: DailyCallbacks
): Promise<DailyCall> {
  try {
    // Create call object if it doesn't exist
    if (!callObject) {
      callObject = DailyIframe.createCallObject({
        audioSource: true,
        videoSource: false, // We only want audio
      });

      // Set up event listeners
      callObject
        .on("participant-joined", (event) => {
          console.log("[Daily] Participant joined:", event.participant);
          if (callbacks?.onParticipantJoined) {
            callbacks.onParticipantJoined(event.participant);
          }
        })
        .on("participant-left", (event) => {
          console.log("[Daily] Participant left:", event.participant);
          if (callbacks?.onParticipantLeft) {
            callbacks.onParticipantLeft(event.participant);
          }
        })
        .on("participant-updated", (event) => {
          console.log("[Daily] Participant updated:", event.participant);
          if (callbacks?.onParticipantUpdated) {
            callbacks.onParticipantUpdated(event.participant);
          }
        })
        .on("error", (event) => {
          console.error("[Daily] Error:", event);
          if (callbacks?.onError) {
            callbacks.onError(new Error(event.errorMsg));
          }
        });
    }

    // Join the room
    await callObject.join({
      url: roomUrl,
      userName: userName,
    });

    console.log("[Daily] Joined room:", roomUrl);
    return callObject;
  } catch (error) {
    console.error("[Daily] Failed to join room:", error);
    throw error;
  }
}

/**
 * Leave the Daily.co room and cleanup
 */
export async function leaveDailyRoom(): Promise<void> {
  if (callObject) {
    await callObject.leave();
    await callObject.destroy();
    callObject = null;
    console.log("[Daily] Left room and cleaned up");
  }
}

/**
 * Toggle microphone on/off
 */
export async function setMicEnabled(enabled: boolean): Promise<void> {
  if (callObject) {
    await callObject.setLocalAudio(enabled);
    console.log("[Daily] Microphone", enabled ? "enabled" : "disabled");
  }
}

/**
 * Get current call object
 */
export function getCallObject(): DailyCall | null {
  return callObject;
}

/**
 * Check if currently in a call
 */
export function isInCall(): boolean {
  return callObject !== null && callObject.meetingState() === "joined-meeting";
}
