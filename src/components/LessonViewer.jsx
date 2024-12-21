import React, { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const LessonViewer = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  
  const lesson = {
    title: "Introduction to History",
    steps: [
      {
        id: 1,
        type: 'content',
        title: 'Ancient Civilizations',
        content: 'Ancient civilizations laid the groundwork for modern society. The earliest known civilizations developed in Mesopotamia, Egypt, India, and China. These societies were characterized by organized agriculture, complex social structures, and written communication systems.'
      },
      {
        id: 2,
        type: 'quiz',
        question: 'Which of these was a characteristic of ancient civilizations?',
        options: [
          'Organized agriculture',
          'Space travel',
          'Digital technology',
          'Modern medicine'
        ],
        correctAnswer: 'Organized agriculture'
      }
    ]
  };
  
  const progress = ((currentStep + 1) / lesson.steps.length) * 100;

  const handleNext = () => {
    if (currentStep < lesson.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAnswerSelect = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: answer
    });
  };

  const renderContent = () => {
    const step = lesson.steps[currentStep];

    if (step.type === 'content') {
      return (
        <div className="content-card">
          <h2 className="lesson-title">{step.title}</h2>
          <div className="lesson-content">{step.content}</div>
        </div>
      );
    }

    if (step.type === 'quiz') {
      return (
        <div className="content-card">
          <h3 className="quiz-question">{step.question}</h3>
          <div className="quiz-options">
            {step.options.map((option, index) => (
              <button
                key={index}
                className={`quiz-option ${answers[step.id] === option ? 'selected' : ''}`}
                onClick={() => handleAnswerSelect(step.id, option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto p-4">
        {/* Progress bar */}
        <div className="progress-container">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="step-counter">
          Step {currentStep + 1} of {lesson.steps.length}
          <span className="progress-percentage ml-2">
            ({Math.round(progress)}% complete)
          </span>
        </div>

        {/* Content */}
        {renderContent()}

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`nav-button previous`}
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={currentStep === lesson.steps.length - 1}
            className={`nav-button next`}
          >
            Next
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonViewer;