/**
 * Audio element management for Daily.co participants
 */

const audioElements = new Map<string, HTMLAudioElement>();

/**
 * Create and play audio element for a remote participant
 */
export function createAudioElementForParticipant(
  sessionId: string,
  track: MediaStreamTrack
): void {
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
export function removeAudioElementForParticipant(sessionId: string): void {
  const audio = audioElements.get(sessionId);
  if (audio) {
    audio.pause();
    audio.remove();
    audioElements.delete(sessionId);
    console.log("[Daily] Removed audio element for participant:", sessionId);
  }
}

/**
 * Clean up all audio elements
 */
export function cleanupAllAudioElements(): void {
  audioElements.forEach((audio) => {
    audio.pause();
    audio.remove();
  });
  audioElements.clear();
  console.log("[Daily] Cleaned up all audio elements");
}
