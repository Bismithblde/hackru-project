import DailyIframe from "@daily-co/daily-js";
import type { DailyCall, DailyParticipant } from "@daily-co/daily-js";

let callObject: DailyCall | null = null;
const audioElements = new Map<string, HTMLAudioElement>(); // Track audio elements per participant

interface DailyCallbacks {
  onParticipantJoined?: (participant: DailyParticipant) => void;
  onParticipantLeft?: (participant: DailyParticipant) => void;
  onParticipantUpdated?: (participant: DailyParticipant) => void;
  onError?: (error: Error) => void;
}

/**
 * Create and play audio element for a remote participant
 */
function createAudioElementForParticipant(
  sessionId: string,
  track: MediaStreamTrack
) {
  // Remove existing audio element if it exists
  if (audioElements.has(sessionId)) {
    const oldAudio = audioElements.get(sessionId);
    oldAudio?.pause();
    oldAudio?.remove();
    audioElements.delete(sessionId);
  }

  // Create new audio element
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.srcObject = new MediaStream([track]);
  
  // Add to DOM (hidden)
  audio.style.display = "none";
  document.body.appendChild(audio);
  
  audioElements.set(sessionId, audio);
  
  console.log("[Daily] Created audio element for participant:", sessionId);
  
  // Start playing
  audio.play().catch((err) => {
    console.error("[Daily] Failed to play audio:", err);
  });
}

/**
 * Remove audio element for a participant
 */
function removeAudioElementForParticipant(sessionId: string) {
  const audio = audioElements.get(sessionId);
  if (audio) {
    audio.pause();
    audio.remove();
    audioElements.delete(sessionId);
    console.log("[Daily] Removed audio element for participant:", sessionId);
  }
}

/**
 * Initialize and join a Daily.co room with manual audio handling
 */
export async function joinDailyRoom(
  roomUrl: string,
  userName: string,
  callbacks?: DailyCallbacks,
  iframeContainer?: HTMLElement
): Promise<DailyCall> {
  try {
    // Create call object if it doesn't exist
    if (!callObject) {
      // Use createFrame if container provided (handles audio automatically)
      // Otherwise use createCallObject (requires manual audio handling)
      if (iframeContainer) {
        console.log("[Daily] Creating iframe in container for automatic audio playback");
        callObject = DailyIframe.createFrame(iframeContainer, {
          showLeaveButton: true,
          showFullscreenButton: false,
          iframeStyle: {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '300px',
            border: '2px solid #333',
            borderRadius: '8px',
            zIndex: '9999',
          },
        });
      } else {
        console.log("[Daily] Creating call object with manual audio handling");
        callObject = DailyIframe.createCallObject({
          audioSource: true,
          videoSource: false,
          subscribeToTracksAutomatically: true,
        });
      }

      // Set up event listeners
      callObject
        .on("participant-joined", (event) => {
          console.log(
            "[Daily] Participant joined:",
            event.participant.user_name
          );
          
          // Handle audio for new participant
          if (!iframeContainer && event.participant.tracks?.audio?.track) {
            createAudioElementForParticipant(
              event.participant.session_id,
              event.participant.tracks.audio.track
            );
          }
          
          if (callbacks?.onParticipantJoined) {
            callbacks.onParticipantJoined(event.participant);
          }
        })
        .on("participant-left", (event) => {
          console.log("[Daily] Participant left:", event.participant.user_name);
          
          // Clean up audio element
          if (!iframeContainer) {
            removeAudioElementForParticipant(event.participant.session_id);
          }
          
          if (callbacks?.onParticipantLeft) {
            callbacks.onParticipantLeft(event.participant);
          }
        })
        .on("participant-updated", (event) => {
          console.log(
            "[Daily] Participant updated:",
            event.participant.user_name,
            "Audio track:",
            event.participant.tracks?.audio?.state
          );
          
          // Handle audio track updates
          if (!iframeContainer && event.participant.tracks?.audio?.track) {
            createAudioElementForParticipant(
              event.participant.session_id,
              event.participant.tracks.audio.track
            );
          }
          
          if (callbacks?.onParticipantUpdated) {
            callbacks.onParticipantUpdated(event.participant);
          }
        })
        .on("track-started", (event) => {
          console.log(
            "[Daily] Track started:",
            event.participant?.user_name,
            event.track.kind
          );
          
          // Handle audio tracks when they start
          if (!iframeContainer && event.track.kind === "audio" && event.participant) {
            createAudioElementForParticipant(
              event.participant.session_id,
              event.track
            );
          }
        })
        .on("error", (event) => {
          console.error("[Daily] Error:", event);
          if (callbacks?.onError) {
            callbacks.onError(new Error(event.errorMsg));
          }
        });
    }

    console.log("[Daily] Joining room:", roomUrl, "as", userName);

    // Join the room
    await callObject.join({
      url: roomUrl,
      userName: userName,
    });

    console.log("[Daily] Successfully joined room!");
    
    // Handle existing participants' audio tracks
    const participants = callObject.participants();
    console.log("[Daily] Participants:", participants);
    
    if (!iframeContainer) {
      // Create audio elements for all existing participants
      Object.entries(participants).forEach(([sessionId, participant]) => {
        if (participant.local) return; // Skip local participant
        
        if (participant.tracks?.audio?.track) {
          console.log("[Daily] Setting up audio for existing participant:", participant.user_name);
          createAudioElementForParticipant(
            sessionId,
            participant.tracks.audio.track
          );
        }
      });
    }

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
    
    // Clean up all audio elements
    audioElements.forEach((audio) => {
      audio.pause();
      audio.remove();
    });
    audioElements.clear();
    
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
