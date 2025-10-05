import React, { useState, useEffect } from "react";
import { getSocket, on, off, emit } from "../lib/socket";
import { SOCKET_EVENTS } from "../constants";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdBy: string;
}

interface QuizProps {
  roomId: string;
  username: string;
  isOwner: boolean;
}

const QuizComponent: React.FC<QuizProps> = ({ roomId, username, isOwner }) => {
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [showStartNotification, setShowStartNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Quiz creation form state
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: "1",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    },
  ]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      console.error("[Quiz] No socket available!");
      return;
    }

    console.log("[Quiz] Setting up event listeners for room:", roomId);

    // Listen for quiz events
    const handleQuizCreated = (data: any) => {
      console.log("[Quiz] ✅ Quiz created event received:", data);
      setActiveQuiz(data.quiz);
      setShowCreateForm(false);
      setErrorMessage("");
    };

    const handleQuizStarted = (data: any) => {
      console.log("[Quiz] ✅ Quiz started event received:", data);
      setActiveQuiz(data.quiz);
      setCurrentQuestionIndex(0);
      setScore(0);
      setShowResult(false);
      setUserAnswers({});
      setErrorMessage("");
      
      // Show notification that quiz has started
      if (!isOwner) {
        setShowStartNotification(true);
        setTimeout(() => setShowStartNotification(false), 5000);
        
        // Auto-scroll to quiz section if not owner
        const quizElement = document.getElementById('quiz-section');
        if (quizElement) {
          quizElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    };

    const handleQuizEnded = (data: any) => {
      console.log("[Quiz] ✅ Quiz ended event received:", data);
      
      // Show results if available
      if (data.results && data.results.length > 0) {
        console.log("[Quiz] Final results:", data.results);
      }
      
      setActiveQuiz(null);
      setShowResult(false);
      setErrorMessage("");
    };

    const handleAnswerSubmitted = (data: any) => {
      console.log("[Quiz] ✅ Answer submitted event received:", data);
    };

    const handleQuizError = (data: any) => {
      console.error("[Quiz] ❌ Quiz error event received:", data);
      setErrorMessage(data.message || "An error occurred");
      setTimeout(() => setErrorMessage(""), 5000);
    };

    console.log("[Quiz] Registering event listeners...");
    on(SOCKET_EVENTS.QUIZ_CREATED, handleQuizCreated);
    on(SOCKET_EVENTS.QUIZ_STARTED, handleQuizStarted);
    on(SOCKET_EVENTS.QUIZ_ENDED, handleQuizEnded);
    on(SOCKET_EVENTS.QUIZ_ANSWER_SUBMITTED, handleAnswerSubmitted);
    on(SOCKET_EVENTS.QUIZ_ERROR, handleQuizError);
    console.log("[Quiz] Event listeners registered");

    // Request current quiz state
    console.log("[Quiz] Requesting current quiz state for room:", roomId);
    emit(SOCKET_EVENTS.QUIZ_GET_STATE, { roomId });

    return () => {
      console.log("[Quiz] Cleaning up event listeners");
      off(SOCKET_EVENTS.QUIZ_CREATED, handleQuizCreated);
      off(SOCKET_EVENTS.QUIZ_STARTED, handleQuizStarted);
      off(SOCKET_EVENTS.QUIZ_ENDED, handleQuizEnded);
      off(SOCKET_EVENTS.QUIZ_ANSWER_SUBMITTED, handleAnswerSubmitted);
      off(SOCKET_EVENTS.QUIZ_ERROR, handleQuizError);
    };
  }, [roomId]);

  const handleCreateQuiz = () => {
    console.log("[Quiz] handleCreateQuiz called");
    console.log("[Quiz] Quiz title:", quizTitle);
    console.log("[Quiz] Questions:", questions);
    
    if (!quizTitle.trim()) {
      setErrorMessage("Please enter a quiz title");
      console.error("[Quiz] Validation failed: no title");
      return;
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setErrorMessage(`Please enter question ${i + 1}`);
        console.error(`[Quiz] Validation failed: question ${i + 1} is empty`);
        return;
      }
      if (q.options.some((opt) => !opt.trim())) {
        setErrorMessage(`Please fill all options for question ${i + 1}`);
        console.error(`[Quiz] Validation failed: question ${i + 1} has empty options`);
        return;
      }
    }

    const quiz: Quiz = {
      id: Date.now().toString(),
      title: quizTitle,
      questions: questions,
      createdBy: username,
    };

    console.log("[Quiz] Emitting quiz:create with payload:", { roomId, quiz });
    emit(SOCKET_EVENTS.QUIZ_CREATE, { roomId, quiz });
    console.log("[Quiz] Quiz create event emitted successfully");
  };

  const handleStartQuiz = () => {
    if (!activeQuiz) return;
    emit(SOCKET_EVENTS.QUIZ_START, { roomId, quizId: activeQuiz.id });
  };

  const handleEndQuiz = () => {
    if (!activeQuiz) return;
    emit(SOCKET_EVENTS.QUIZ_END, { roomId, quizId: activeQuiz.id });
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: (questions.length + 1).toString(),
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length === 1) {
      alert("Quiz must have at least one question");
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleQuestionChange = (
    index: number,
    field: keyof QuizQuestion,
    value: any
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSelectAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || answered || !activeQuiz) return;

    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    setAnswered(true);

    // Save user's answer
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: selectedAnswer,
    });

    // Check if answer is correct
    if (isCorrect) {
      setScore(score + 1);
    }

    // Emit answer to server with correctness flag
    emit(SOCKET_EVENTS.QUIZ_SUBMIT_ANSWER, {
      roomId,
      quizId: activeQuiz.id,
      questionId: currentQuestion.id,
      answer: selectedAnswer,
      username,
      isCorrect,
    });
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    
    const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;
    
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswered(false);
    setUserAnswers({});
  };

  // Owner view - no quiz created yet
  if (isOwner && !activeQuiz && !showCreateForm) {
    return (
      <div className="space-y-3">
        <div className="text-center py-8 text-slate-500">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-sm mb-4">No quiz created yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all transform hover:scale-[1.02] font-medium shadow-lg"
          >
            Create Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz start notification for non-owners
  const quizStartNotification = showStartNotification && (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
        <span className="text-2xl">🎯</span>
        <div>
          <p className="font-bold">Quiz Started!</p>
          <p className="text-sm opacity-90">{activeQuiz?.title}</p>
        </div>
      </div>
    </div>
  );

  // Error message notification
  const errorNotification = errorMessage && (
    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
      <span className="text-xl">⚠️</span>
      <p className="text-sm font-medium">{errorMessage}</p>
    </div>
  );

  // Owner view - quiz creation form
  if (isOwner && showCreateForm) {
    return (
      <>
        {quizStartNotification}
        {errorNotification}
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200 z-10">
          <h4 className="font-semibold text-slate-900 mb-2">Create Quiz</h4>
          <input
            type="text"
            placeholder="Quiz Title"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
          />
        </div>

        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="bg-white border border-slate-200 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Question {qIndex + 1}
                </label>
                <input
                  type="text"
                  placeholder="Enter question"
                  value={q.question}
                  onChange={(e) =>
                    handleQuestionChange(qIndex, "question", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                />
              </div>
              {questions.length > 1 && (
                <button
                  onClick={() => handleRemoveQuestion(qIndex)}
                  className="mt-7 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Options (select correct answer)
              </label>
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${qIndex}`}
                    checked={q.correctAnswer === optIndex}
                    onChange={() =>
                      handleQuestionChange(qIndex, "correctAnswer", optIndex)
                    }
                    className="w-4 h-4 text-indigo-600"
                  />
                  <input
                    type="text"
                    placeholder={`Option ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) =>
                      handleOptionChange(qIndex, optIndex, e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <button
          onClick={handleAddQuestion}
          className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium border-2 border-dashed border-slate-300"
        >
          + Add Question
        </button>

        <div className="flex gap-3 sticky bottom-0 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
          <button
            onClick={handleCreateQuiz}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] font-medium shadow-lg"
          >
            Create Quiz
          </button>
          <button
            onClick={() => setShowCreateForm(false)}
            className="px-4 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      </>
    );
  }

  // Owner view - quiz created but not started
  if (isOwner && activeQuiz && !showResult) {
    return (
      <>
        {quizStartNotification}
        {errorNotification}
        <div className="space-y-4">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
          <div className="text-center">
            <div className="text-5xl mb-3">📝</div>
            <h4 className="text-xl font-bold text-slate-900 mb-2">
              {activeQuiz.title}
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              {activeQuiz.questions.length} questions
            </p>
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-[1.02] font-medium shadow-lg"
        >
          Start Quiz for Everyone
        </button>

        <button
          onClick={handleEndQuiz}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Delete Quiz
        </button>
      </div>
      </>
    );
  }

  // Non-owner view - no quiz available
  if (!activeQuiz) {
    return (
      <>
        {quizStartNotification}
        {errorNotification}
        <div className="text-center py-8 text-slate-500">
          <div className="text-5xl mb-3">📝</div>
          <p className="text-sm">Waiting for room owner to create a quiz...</p>
        </div>
      </>
    );
  }

  // Results view
  if (showResult && activeQuiz) {
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    return (
      <>
        {quizStartNotification}
        {errorNotification}
        <div className="space-y-4">
        <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
          <div className="text-6xl mb-4">
            {percentage >= 70 ? "🎉" : percentage >= 50 ? "👍" : "💪"}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Quiz Complete!
          </h3>
          <p className="text-4xl font-bold text-indigo-600 mb-2">
            {score} / {activeQuiz.questions.length}
          </p>
          <p className="text-lg text-slate-600">{percentage}% correct</p>
        </div>

        <button
          onClick={handleRestartQuiz}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
        >
          Try Again
        </button>
      </div>
      </>
    );
  }

  // Quiz taking view
  if (!activeQuiz) return null;
  
  const currentQuestion = activeQuiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === activeQuiz.questions.length - 1;

  return (
    <>
      {quizStartNotification}
      {errorNotification}
      <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-700">
            Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
          </span>
          <span className="text-slate-500">
            Score: {score}/{currentQuestionIndex}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{
              width: `${
                ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
            {currentQuestionIndex + 1}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 leading-tight">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === currentQuestion.correctAnswer;
            const showCorrect = answered && isCorrect;
            const showIncorrect = answered && isSelected && !isCorrect;

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={answered}
                className={`w-full p-4 rounded-lg text-left font-medium transition-all border-2 ${
                  showCorrect
                    ? "bg-green-100 border-green-500 text-green-900"
                    : showIncorrect
                    ? "bg-red-100 border-red-500 text-red-900"
                    : isSelected
                    ? "bg-indigo-100 border-indigo-500 text-indigo-900"
                    : "bg-white border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50"
                } ${answered ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      showCorrect
                        ? "bg-green-500 border-green-500"
                        : showIncorrect
                        ? "bg-red-500 border-red-500"
                        : isSelected
                        ? "bg-indigo-500 border-indigo-500"
                        : "border-slate-400"
                    }`}
                  >
                    {showCorrect && (
                      <span className="text-white text-sm">✓</span>
                    )}
                    {showIncorrect && (
                      <span className="text-white text-sm">✕</span>
                    )}
                    {!answered && isSelected && (
                      <span className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {!answered ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all shadow-lg ${
              selectedAnswer === null
                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
          >
            {isLastQuestion ? "See Results →" : "Next Question →"}
          </button>
        )}
      </div>
    </div>
    </>
  );
};

export default QuizComponent;
