/**
 * Quiz Controller - Handles quiz socket events
 */

// In-memory storage for room quizzes and scores
const roomQuizzes = new Map(); // roomId -> quiz
const roomScores = new Map(); // roomId -> { username: score }
const persistentRoomService = require("../services/persistentRoomService");

/**
 * Get room owner from persistent storage
 */
async function getRoomOwner(roomId) {
  try {
    const room = await persistentRoomService.getRoom(roomId);
    return room?.createdBy || null;
  } catch (error) {
    console.error('[Quiz] Error getting room owner:', error.message);
    return null;
  }
}

function registerQuizEvents(socket, io, roomService) {
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
  socket.on('quiz:create', async (payload) => {
    const { roomId, quiz } = payload;
    if (!roomId || !quiz) {
      return socket.emit('quiz:error', { message: 'Invalid quiz data' });
    }

    // Verify owner
    const owner = await getRoomOwner(roomId);
    if (!owner || quiz.createdBy !== owner) {
      return socket.emit('quiz:error', { 
        message: 'Only the room owner can create quizzes' 
      });
    }

    // Store quiz for room
    roomQuizzes.set(roomId, quiz);
    
    // Initialize scores for this room
    roomScores.set(roomId, new Map());

    // Broadcast to all users in room
    io.to(roomId).emit('quiz:created', { roomId, quiz });
    console.log(`[Quiz] Quiz created in room ${roomId}: ${quiz.title} by ${quiz.createdBy}`);
  });

  /**
   * Start quiz (owner only)
   */
  socket.on('quiz:start', async (payload) => {
    const { roomId, quizId } = payload;
    if (!roomId || !quizId) return;

    const quiz = roomQuizzes.get(roomId);
    if (!quiz) {
      return socket.emit('quiz:error', { message: 'Quiz not found' });
    }

    // Reset scores for new quiz session
    roomScores.set(roomId, new Map());

    // Broadcast quiz start to all users
    io.to(roomId).emit('quiz:started', { roomId, quiz });
    console.log(`[Quiz] Quiz started in room ${roomId}: ${quiz.title}`);
  });

  /**
   * End/delete quiz (owner only)
   */
  socket.on('quiz:end', async (payload) => {
    const { roomId, quizId } = payload;
    if (!roomId) return;

    // Get final scores before cleanup
    const scores = roomScores.get(roomId);
    
    // Award points to participants based on their scores
    if (scores) {
      const quiz = roomQuizzes.get(roomId);
      const totalQuestions = quiz?.questions?.length || 1;
      
      for (const [username, score] of scores.entries()) {
        // Award points: 10 points per correct answer
        const points = score * 10;
        if (points > 0) {
          io.to(roomId).emit('points:update', {
            userId: username,
            username,
            points,
            source: 'quiz',
            roomId
          });
          console.log(`[Quiz] Awarded ${points} points to ${username} (${score}/${totalQuestions} correct)`);
        }
      }
    }

    // Broadcast final results
    const finalScores = scores ? Array.from(scores.entries()).map(([username, score]) => ({
      username,
      score
    })) : [];
    
    io.to(roomId).emit('quiz:ended', { 
      roomId, 
      quizId,
      results: finalScores
    });

    // Remove quiz and scores
    roomQuizzes.delete(roomId);
    roomScores.delete(roomId);

    console.log(`[Quiz] Quiz ended in room ${roomId}`);
  });

  /**
   * Submit quiz answer
   */
  socket.on('quiz:submitAnswer', (payload) => {
    const { roomId, quizId, questionId, answer, username, isCorrect } = payload;
    if (!roomId || !quizId || !questionId || answer === undefined || !username) return;

    // Update user's score
    let scores = roomScores.get(roomId);
    if (!scores) {
      scores = new Map();
      roomScores.set(roomId, scores);
    }

    // Increment score if correct
    if (isCorrect) {
      const currentScore = scores.get(username) || 0;
      scores.set(username, currentScore + 1);
      console.log(`[Quiz] ${username} answered correctly! Score: ${currentScore + 1}`);
    } else {
      // Initialize score if not exists
      if (!scores.has(username)) {
        scores.set(username, 0);
      }
      console.log(`[Quiz] ${username} answered incorrectly. Score: ${scores.get(username)}`);
    }

    console.log(
      `[Quiz] ${username} answered question ${questionId} in room ${roomId}: ${answer} (${isCorrect ? 'correct' : 'incorrect'})`
    );

    // Broadcast answer submission (for real-time feedback)
    io.to(roomId).emit('quiz:answerSubmitted', {
      roomId,
      quizId,
      questionId,
      username,
      answer,
      isCorrect
    });
  });
}

/**
 * Clean up quiz when room is empty
 */
function cleanupRoomQuiz(roomId) {
  roomQuizzes.delete(roomId);
  roomScores.delete(roomId);
  console.log(`[Quiz] Cleaned up quiz for room ${roomId}`);
}

module.exports = {
  registerQuizEvents,
  cleanupRoomQuiz,
};
