/**
 * Simple sound effects using Web Audio API
 * Lightweight alternative to audio files
 */

class SoundEffects {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize on first user interaction to comply with autoplay policies
    if (typeof window !== "undefined") {
      this.audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = "sine"
  ) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + duration
    );

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Pleasant notification sound
  notification() {
    this.playTone(800, 0.1);
    setTimeout(() => this.playTone(1000, 0.1), 50);
  }

  // Success sound (two rising tones)
  success() {
    this.playTone(523, 0.1); // C5
    setTimeout(() => this.playTone(659, 0.15), 100); // E5
  }

  // Error sound (descending tone)
  error() {
    this.playTone(400, 0.2);
    setTimeout(() => this.playTone(300, 0.2), 100);
  }

  // Message received (subtle pop)
  message() {
    this.playTone(600, 0.05);
  }

  // User joined (pleasant chime)
  userJoined() {
    this.playTone(523, 0.1); // C5
    setTimeout(() => this.playTone(659, 0.1), 80); // E5
    setTimeout(() => this.playTone(784, 0.15), 160); // G5
  }

  // Quiz started (exciting alert)
  quizStart() {
    this.playTone(659, 0.1); // E5
    setTimeout(() => this.playTone(784, 0.1), 100); // G5
    setTimeout(() => this.playTone(1047, 0.2), 200); // C6
  }

  // Points awarded (rewarding sound)
  pointsAwarded() {
    this.playTone(698, 0.08); // F5
    setTimeout(() => this.playTone(880, 0.08), 80); // A5
    setTimeout(() => this.playTone(1047, 0.12), 160); // C6
  }

  // Enable/disable sounds
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

// Export singleton instance
export const sounds = new SoundEffects();
