import React, { useState } from "react";

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

// Placeholder quiz data - replace with real data later
const PLACEHOLDER_QUIZ: QuizQuestion[] = [
  {
    id: "1",
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
  },
  {
    id: "2",
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
  },
  {
    id: "3",
    question: "What is 2 + 2?",
    options: ["3", "4", "5", "6"],
    correctAnswer: 1,
  },
];

interface QuizProps {
  onSubmitAnswer?: (questionId: string, answer: number) => void;
}

const Quiz: React.FC<QuizProps> = ({ onSubmitAnswer }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  const currentQuestion = PLACEHOLDER_QUIZ[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === PLACEHOLDER_QUIZ.length - 1;

  const handleSelectAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || answered) return;

    setAnswered(true);

    // Check if answer is correct
    if (selectedAnswer === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }

    // Call callback if provided
    if (onSubmitAnswer) {
      onSubmitAnswer(currentQuestion.id, selectedAnswer);
    }
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResult(true);
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswered(false);
  };

  // Results view
  if (showResult) {
    const percentage = Math.round((score / PLACEHOLDER_QUIZ.length) * 100);
    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
          <div className="text-6xl mb-4">
            {percentage >= 70 ? "🎉" : percentage >= 50 ? "👍" : "💪"}
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            Quiz Complete!
          </h3>
          <p className="text-4xl font-bold text-indigo-600 mb-2">
            {score} / {PLACEHOLDER_QUIZ.length}
          </p>
          <p className="text-lg text-slate-600">
            {percentage}% correct
          </p>
        </div>

        <button
          onClick={handleRestart}
          className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-lg"
        >
          Try Again
        </button>

        <div className="text-xs text-center text-slate-500 italic">
          ✨ Placeholder Quiz - Real content coming soon!
        </div>
      </div>
    );
  }

  // Quiz question view
  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-700">
            Question {currentQuestionIndex + 1} of {PLACEHOLDER_QUIZ.length}
          </span>
          <span className="text-slate-500">
            Score: {score}/{currentQuestionIndex}
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{
              width: `${((currentQuestionIndex + 1) / PLACEHOLDER_QUIZ.length) * 100}%`,
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
                    {showCorrect && <span className="text-white text-sm">✓</span>}
                    {showIncorrect && <span className="text-white text-sm">✕</span>}
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
            onClick={handleSubmit}
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
            onClick={handleNext}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
          >
            {isLastQuestion ? "See Results →" : "Next Question →"}
          </button>
        )}
      </div>

      {/* Placeholder Notice */}
      <div className="text-xs text-center text-slate-500 italic">
        ✨ Placeholder Quiz - Real content coming soon!
      </div>
    </div>
  );
};

export default Quiz;
