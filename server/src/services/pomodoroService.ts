import type {
  PomodoroConfig,
  PomodoroState,
  PomodoroSettings,
} from '../types/pomodoro';

/**
 * Pomodoro Service - Manages synchronized Pomodoro timers per room
 */
class PomodoroService {
  // Map: roomId -> PomodoroState
  private roomStates: Map<string, PomodoroState>;
  
  // Map: roomId -> NodeJS.Timeout (for auto-advance)
  private timers: Map<string, NodeJS.Timeout>;
  
  // Map: roomId -> creatorUserId (only creator can control)
  private roomCreators: Map<string, string>;

  constructor() {
    this.roomStates = new Map();
    this.timers = new Map();
    this.roomCreators = new Map();
  }

  /**
   * Initialize Pomodoro for a room (called by room creator)
   */
  initializeRoom(settings: PomodoroSettings): PomodoroState {
    const { roomId, config, creatorUserId } = settings;

    this.roomCreators.set(roomId, creatorUserId);

    const state: PomodoroState = {
      config,
      isActive: false,
      currentPhase: 'idle',
      remainingSeconds: config.workDuration * 60,
      cyclesCompleted: 0,
    };

    this.roomStates.set(roomId, state);
    console.log(`[Pomodoro] Initialized for room ${roomId}:`, config);

    return state;
  }

  /**
   * Update Pomodoro config (only by creator)
   */
  updateConfig(
    roomId: string,
    userId: string,
    config: Partial<PomodoroConfig>
  ): PomodoroState | null {
    if (!this.isCreator(roomId, userId)) {
      console.log(`[Pomodoro] User ${userId} is not creator of room ${roomId}`);
      return null;
    }

    const state = this.roomStates.get(roomId);
    if (!state) return null;

    // Update config
    state.config = { ...state.config, ...config };

    // If timer is not active, update remaining seconds
    if (!state.isActive && state.currentPhase === 'idle') {
      state.remainingSeconds = state.config.workDuration * 60;
    }

    console.log(`[Pomodoro] Updated config for room ${roomId}:`, state.config);
    return state;
  }

  /**
   * Start the Pomodoro timer
   */
  start(roomId: string, userId: string): PomodoroState | null {
    if (!this.isCreator(roomId, userId)) {
      return null;
    }

    const state = this.roomStates.get(roomId);
    if (!state || !state.config.enabled) return null;

    // Start work phase if idle
    if (state.currentPhase === 'idle') {
      state.currentPhase = 'work';
      state.remainingSeconds = state.config.workDuration * 60;
    }

    state.isActive = true;
    state.startedAt = Date.now();
    state.pausedAt = undefined;

    console.log(`[Pomodoro] Started in room ${roomId}, phase: ${state.currentPhase}`);
    return state;
  }

  /**
   * Pause the timer
   */
  pause(roomId: string, userId: string): PomodoroState | null {
    if (!this.isCreator(roomId, userId)) {
      return null;
    }

    const state = this.roomStates.get(roomId);
    if (!state || !state.isActive) return null;

    state.isActive = false;
    state.pausedAt = Date.now();

    console.log(`[Pomodoro] Paused in room ${roomId}`);
    return state;
  }

  /**
   * Reset the timer
   */
  reset(roomId: string, userId: string): PomodoroState | null {
    if (!this.isCreator(roomId, userId)) {
      return null;
    }

    const state = this.roomStates.get(roomId);
    if (!state) return null;

    state.isActive = false;
    state.currentPhase = 'idle';
    state.remainingSeconds = state.config.workDuration * 60;
    state.cyclesCompleted = 0;
    state.startedAt = undefined;
    state.pausedAt = undefined;

    this.clearTimer(roomId);

    console.log(`[Pomodoro] Reset in room ${roomId}`);
    return state;
  }

  /**
   * Skip to next phase
   */
  skipPhase(roomId: string, userId: string): PomodoroState | null {
    if (!this.isCreator(roomId, userId)) {
      return null;
    }

    const state = this.roomStates.get(roomId);
    if (!state) return null;

    return this.advancePhase(roomId);
  }

  /**
   * Advance to the next phase (work -> break -> work)
   */
  private advancePhase(roomId: string): PomodoroState | null {
    const state = this.roomStates.get(roomId);
    if (!state) return null;

    if (state.currentPhase === 'work') {
      // Work completed, go to break
      state.currentPhase = 'break';
      state.remainingSeconds = state.config.breakDuration * 60;
      state.cyclesCompleted += 1;
      console.log(`[Pomodoro] Room ${roomId} completed work cycle ${state.cyclesCompleted}`);
    } else if (state.currentPhase === 'break') {
      // Break completed, go to work
      state.currentPhase = 'work';
      state.remainingSeconds = state.config.workDuration * 60;
      console.log(`[Pomodoro] Room ${roomId} starting new work phase`);
    }

    state.startedAt = Date.now();
    return state;
  }

  /**
   * Tick the timer (called every second by socket controller)
   */
  tick(roomId: string): PomodoroState | null {
    const state = this.roomStates.get(roomId);
    if (!state || !state.isActive) return null;

    state.remainingSeconds -= 1;

    // Phase complete
    if (state.remainingSeconds <= 0) {
      const completedPhase = state.currentPhase;
      this.advancePhase(roomId);
      
      return {
        ...state,
        // Signal phase completion
        remainingSeconds: 0,
      };
    }

    return state;
  }

  /**
   * Get current state for a room
   */
  getState(roomId: string): PomodoroState | null {
    return this.roomStates.get(roomId) || null;
  }

  /**
   * Check if user is room creator
   */
  isCreator(roomId: string, userId: string): boolean {
    return this.roomCreators.get(roomId) === userId;
  }

  /**
   * Clean up when room is empty
   */
  cleanup(roomId: string): void {
    this.clearTimer(roomId);
    this.roomStates.delete(roomId);
    this.roomCreators.delete(roomId);
    console.log(`[Pomodoro] Cleaned up room ${roomId}`);
  }

  /**
   * Clear interval timer for room
   */
  private clearTimer(roomId: string): void {
    const timer = this.timers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomId);
    }
  }

  /**
   * Calculate bonus points for completing Pomodoro cycles
   */
  calculateBonusPoints(cyclesCompleted: number): number {
    // 5 points per completed work session
    return cyclesCompleted * 5;
  }
}

// Singleton instance
export const pomodoroService = new PomodoroService();
