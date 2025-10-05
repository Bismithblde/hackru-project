/**
 * Pomodoro Timer Types
 */

export interface PomodoroConfig {
  enabled: boolean;
  workDuration: number; // minutes
  breakDuration: number; // minutes
}

export interface PomodoroState {
  config: PomodoroConfig;
  isActive: boolean;
  currentPhase: 'work' | 'break' | 'idle';
  remainingSeconds: number;
  cyclesCompleted: number;
  startedAt?: number;
  pausedAt?: number;
}

export interface PomodoroSettings {
  roomId: string;
  config: PomodoroConfig;
  creatorUserId: string;
}

export interface PomodoroTimerUpdate {
  roomId: string;
  state: PomodoroState;
}

export interface PomodoroCompleteEvent {
  roomId: string;
  userId: string;
  username: string;
  phase: 'work' | 'break';
  cycleNumber: number;
}
