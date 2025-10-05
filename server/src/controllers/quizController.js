/**
 * Quiz Controller - Handles quiz socket events
 */

// In-memory storage for room quizzes
const roomQuizzes = new Map(); // roomId -> quiz

function registerQuizEvents(socket, io) {
  /**
   * Get current quiz state for a room
   */
  socket.on('quiz:getState', (payload) => {
    const { roomId } = payload;
    if (!roomId) return;

    const quiz = roomQuizzes.get(roomId);
    if (quiz) {
      socket.emit('quiz:created', { roomId, quiz });
    }
  });

  /**
   * Create a new quiz (owner only)
   */
  socket.on('quiz:create', (payload) => {
    const { roomId, quiz } = payload;
    if (!roomId || !quiz) {
      return socket.emit('quiz:error', { message: 'Invalid quiz data' });
    }

    // Store quiz for room
    roomQuizzes.set(roomId, quiz);

    // Broadcast to all users in room
    io.to(roomId).emit('quiz:created', { roomId, quiz });
    console.log(`[Quiz] Quiz created in room ${roomId}: ${quiz.title}`);
  });

  /**
   * Start quiz (owner only)
   */
  socket.on('quiz:start', (payload) => {
    const { roomId, quizId } = payload;
    if (!roomId || !quizId) return;

    const quiz = roomQuizzes.get(roomId);
    if (!quiz) {
      return socket.emit('quiz:error', { message: 'Quiz not found' });
    }

    // Broadcast quiz start to all users
    io.to(roomId).emit('quiz:started', { roomId, quiz });
    console.log(`[Quiz] Quiz started in room ${roomId}`);
  });

  /**
   * End/delete quiz (owner only)
   */
  socket.on('quiz:end', (payload) => {
    const { roomId, quizId } = payload;
    if (!roomId) return;

    // Remove quiz
    roomQuizzes.delete(roomId);

    // Broadcast quiz end to all users
    io.to(roomId).emit('quiz:ended', { roomId, quizId });
    console.log(`[Quiz] Quiz ended in room ${roomId}`);
  });

  /**
   * Submit quiz answer
   */
  socket.on('quiz:submitAnswer', (payload) => {
    const { roomId, quizId, questionId, answer, username } = payload;
    if (!roomId || !quizId || !questionId || answer === undefined) return;

    console.log(
      `[Quiz] ${username} answered question ${questionId} in room ${roomId}: ${answer}`
    );

    // Broadcast answer submission (optional - for leaderboard tracking)
    io.to(roomId).emit('quiz:answerSubmitted', {
      roomId,
      quizId,
      questionId,
      username,
      answer,
    });
  });
}

/**
 * Clean up quiz when room is empty
 */
function cleanupRoomQuiz(roomId) {
  roomQuizzes.delete(roomId);
  console.log(`[Quiz] Cleaned up quiz for room ${roomId}`);
}

module.exports = {
  registerQuizEvents,
  cleanupRoomQuiz,
};
