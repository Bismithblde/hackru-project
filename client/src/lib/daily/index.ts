import type { DailyCall } from "@daily-co/daily-js";
import type { DailyCallbacks } from "../../types";
import {
  createDailyCallObject,
  getCallObject,
  clearCallObject,
} from "./callManager";
import { handleExistingParticipants } from "./eventHandlers";
import { cleanupAllAudioElements } from "./audioManager";

/**
 * Join a Daily.co room
 */
export async function joinDailyRoom(
  roomUrl: string,
  userName: string,
  callbacks?: DailyCallbacks,
  iframeContainer?: HTMLElement
): Promise<DailyCall> {
  try {
    console.log("[Daily] Joining room:", roomUrl, "as", userName);

    // Create call object if it doesn't exist
    const callObject = createDailyCallObject(iframeContainer, callbacks);
    const manualAudioMode = !iframeContainer;

    // Join the room
    await callObject.join({
      url: roomUrl,
      userName: userName,
    });

    console.log("[Daily] Successfully joined room!");

    // Handle existing participants' audio tracks (manual mode only)
    handleExistingParticipants(callObject, manualAudioMode);

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
  const callObject = getCallObject();

  if (callObject) {
    await callObject.leave();
    await callObject.destroy();
    clearCallObject();
    cleanupAllAudioElements();

    console.log("[Daily] Left room and cleaned up");
  }
}

/**
 * Toggle microphone on/off
 */
export async function setMicEnabled(enabled: boolean): Promise<void> {
  const callObject = getCallObject();

  if (callObject) {
    await callObject.setLocalAudio(enabled);
    console.log("[Daily] Microphone", enabled ? "enabled" : "disabled");
  }
}

/**
 * Get current call object
 */
export { getCallObject };

/**
 * Check if currently in a call
 */
export { isInCall } from "./callManager";
