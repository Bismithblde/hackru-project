const { pomodoroService } = require('../services/pomodoroService');

/**
 * Register Pomodoro timer socket events
 */
function registerPomodoroEvents(socket, io) {
  /**
   * Initialize Pomodoro settings for a room
   */
  socket.on('pomodoro:init', (payload) => {
    const { roomId, userId, config } = payload;
    if (!roomId || !userId) {
      return socket.emit('pomodoro:error', { message: 'roomId and userId required' });
    }

    const state = pomodoroService.initializeRoom({
      roomId,
      creatorUserId: userId,
      config: config || {
        enabled: true,
        workDuration: 25,
        breakDuration: 5,
      },
    });

    // Broadcast to all users in room
    io.to(roomId).emit('pomodoro:state', { roomId, state });
    console.log(`[Pomodoro] Initialized for room ${roomId}`);
  });

  /**
   * Update Pomodoro config
   */
  socket.on('pomodoro:config', (payload) => {
    const { roomId, userId, config } = payload;
    if (!roomId || !userId || !config) {
      return socket.emit('pomodoro:error', { message: 'Invalid config payload' });
    }

    const state = pomodoroService.updateConfig(roomId, userId, config);
    if (!state) {
      return socket.emit('pomodoro:error', { message: 'Only room creator can update config' });
    }

    io.to(roomId).emit('pomodoro:state', { roomId, state });
  });

  /**
   * Start Pomodoro timer
   */
  socket.on('pomodoro:start', (payload) => {
    const { roomId, userId } = payload;
    if (!roomId || !userId) return;

    const state = pomodoroService.start(roomId, userId);
    if (!state) {
      return socket.emit('pomodoro:error', { message: 'Cannot start timer' });
    }

    // Start server-side interval to tick every second
    startRoomTicker(roomId, io);

    io.to(roomId).emit('pomodoro:state', { roomId, state });
    io.to(roomId).emit('pomodoro:started', { roomId, startedBy: userId });
  });

  /**
   * Pause Pomodoro timer
   */
  socket.on('pomodoro:pause', (payload) => {
    const { roomId, userId } = payload;
    if (!roomId || !userId) return;

    const state = pomodoroService.pause(roomId, userId);
    if (!state) {
      return socket.emit('pomodoro:error', { message: 'Cannot pause timer' });
    }

    stopRoomTicker(roomId);
    io.to(roomId).emit('pomodoro:state', { roomId, state });
  });

  /**
   * Reset Pomodoro timer
   */
  socket.on('pomodoro:reset', (payload) => {
    const { roomId, userId } = payload;
    if (!roomId || !userId) return;

    const state = pomodoroService.reset(roomId, userId);
    if (!state) {
      return socket.emit('pomodoro:error', { message: 'Cannot reset timer' });
    }

    stopRoomTicker(roomId);
    io.to(roomId).emit('pomodoro:state', { roomId, state });
  });

  /**
   * Skip to next phase
   */
  socket.on('pomodoro:skip', (payload) => {
    const { roomId, userId } = payload;
    if (!roomId || !userId) return;

    const state = pomodoroService.skipPhase(roomId, userId);
    if (!state) {
      return socket.emit('pomodoro:error', { message: 'Cannot skip phase' });
    }

    io.to(roomId).emit('pomodoro:state', { roomId, state });
    io.to(roomId).emit('pomodoro:phaseSkipped', { roomId });
  });

  /**
   * Get current Pomodoro state
   */
  socket.on('pomodoro:getState', (payload) => {
    const { roomId } = payload;
    if (!roomId) return;

    const state = pomodoroService.getState(roomId);
    socket.emit('pomodoro:state', { roomId, state });
  });
}

// Map to track room ticker intervals
const roomTickers = new Map();

/**
 * Start server-side ticker for a room
 */
function startRoomTicker(roomId, io) {
  // Don't start if already ticking
  if (roomTickers.has(roomId)) return;

  const interval = setInterval(() => {
    const state = pomodoroService.tick(roomId);
    
    if (!state) {
      stopRoomTicker(roomId);
      return;
    }

    // Broadcast updated state
    io.to(roomId).emit('pomodoro:tick', { roomId, state });

    // Phase completed
    if (state.remainingSeconds === 0) {
      const phase = state.currentPhase === 'work' ? 'break' : 'work';
      io.to(roomId).emit('pomodoro:phaseComplete', {
        roomId,
        completedPhase: phase,
        cyclesCompleted: state.cyclesCompleted,
      });

      // Award bonus points for completing work phase
      if (phase === 'work') {
        const bonusPoints = pomodoroService.calculateBonusPoints(1);
        io.to(roomId).emit('pomodoro:bonusPoints', {
          roomId,
          points: bonusPoints,
          message: 'Pomodoro work session completed!',
        });
      }
    }
  }, 1000); // Tick every second

  roomTickers.set(roomId, interval);
  console.log(`[Pomodoro] Started ticker for room ${roomId}`);
}

/**
 * Stop ticker for a room
 */
function stopRoomTicker(roomId) {
  const interval = roomTickers.get(roomId);
  if (interval) {
    clearInterval(interval);
    roomTickers.delete(roomId);
    console.log(`[Pomodoro] Stopped ticker for room ${roomId}`);
  }
}

/**
 * Cleanup room ticker on room empty
 */
function cleanupRoomPomodoro(roomId) {
  stopRoomTicker(roomId);
  pomodoroService.cleanup(roomId);
}

module.exports = {
  registerPomodoroEvents,
  cleanupRoomPomodoro,
};
