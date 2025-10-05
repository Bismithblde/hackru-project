import type { DailyCall } from "@daily-co/daily-js";
import type { DailyCallbacks } from "../../types";
import {
  createAudioElementForParticipant,
  removeAudioElementForParticipant,
} from "./audioManager";

/**
 * Set up all Daily event listeners
 */
export function setupEventListeners(
  callObject: DailyCall,
  callbacks?: DailyCallbacks,
  manualAudioMode: boolean = false
): void {
  callObject
    .on("participant-joined", (event) => {
      console.log("[Daily] Participant joined:", event.participant.user_name);

      // Handle audio for new participant (manual mode only)
      if (manualAudioMode && event.participant.tracks?.audio?.track) {
        createAudioElementForParticipant(
          event.participant.session_id,
          event.participant.tracks.audio.track
        );
      }

      callbacks?.onParticipantJoined?.(event.participant);
    })
    .on("participant-left", (event) => {
      console.log("[Daily] Participant left:", event.participant.user_name);

      // Clean up audio element (manual mode only)
      if (manualAudioMode) {
        removeAudioElementForParticipant(event.participant.session_id);
      }

      callbacks?.onParticipantLeft?.(event.participant);
    })
    .on("participant-updated", (event) => {
      console.log(
        "[Daily] Participant updated:",
        event.participant.user_name,
        "Audio track:",
        event.participant.tracks?.audio?.state
      );

      // Handle audio track updates (manual mode only)
      if (manualAudioMode && event.participant.tracks?.audio?.track) {
        createAudioElementForParticipant(
          event.participant.session_id,
          event.participant.tracks.audio.track
        );
      }

      callbacks?.onParticipantUpdated?.(event.participant);
    })
    .on("track-started", (event) => {
      console.log(
        "[Daily] Track started:",
        event.participant?.user_name,
        event.track.kind
      );

      // Handle audio tracks when they start (manual mode only)
      if (
        manualAudioMode &&
        event.track.kind === "audio" &&
        event.participant
      ) {
        createAudioElementForParticipant(
          event.participant.session_id,
          event.track
        );
      }
    })
    .on("error", (event) => {
      console.error("[Daily] Error:", event);
      callbacks?.onError?.(new Error(event.errorMsg));
    });
}

/**
 * Handle existing participants in the room
 */
export function handleExistingParticipants(
  callObject: DailyCall,
  manualAudioMode: boolean
): void {
  if (!manualAudioMode) return;

  const participants = callObject.participants();
  console.log("[Daily] Participants:", participants);

  // Create audio elements for all existing participants
  Object.entries(participants).forEach(([sessionId, participant]) => {
    if (participant.local) return; // Skip local participant

    if (participant.tracks?.audio?.track) {
      console.log(
        "[Daily] Setting up audio for existing participant:",
        participant.user_name
      );
      createAudioElementForParticipant(
        sessionId,
        participant.tracks.audio.track
      );
    }
  });
}
