import DailyIframe from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";
import { DAILY_CONFIG } from "../../constants";
import type { DailyCallbacks } from "../../types";
import { setupEventListeners } from "./eventHandlers";

let callObject: DailyCall | null = null;

/**
 * Create Daily call object with iframe or manual mode
 */
export function createDailyCallObject(
  iframeContainer?: HTMLElement,
  callbacks?: DailyCallbacks
): DailyCall {
  if (callObject) {
    return callObject;
  }

  if (iframeContainer) {
    console.log(
      "[Daily] Creating iframe in container for automatic audio playback"
    );
    callObject = DailyIframe.createFrame(iframeContainer, {
      showLeaveButton: true,
      showFullscreenButton: false,
      iframeStyle: DAILY_CONFIG.IFRAME_STYLE,
    });
  } else {
    console.log("[Daily] Creating call object with manual audio handling");
    callObject = DailyIframe.createCallObject({
      audioSource: DAILY_CONFIG.AUDIO_SOURCE,
      videoSource: DAILY_CONFIG.VIDEO_SOURCE,
      subscribeToTracksAutomatically:
        DAILY_CONFIG.SUBSCRIBE_TRACKS_AUTOMATICALLY,
    });
  }

  // Set up event listeners
  setupEventListeners(callObject, callbacks, !iframeContainer);

  return callObject;
}

/**
 * Get the current call object
 */
export function getCallObject(): DailyCall | null {
  return callObject;
}

/**
 * Clear the call object reference
 */
export function clearCallObject(): void {
  callObject = null;
}

/**
 * Check if currently in a call
 */
export function isInCall(): boolean {
  return callObject !== null;
}
