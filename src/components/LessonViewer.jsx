import React, { useEffect, useState } from 'react';
// Import WebGazer from npm
import webgazer from 'webgazer';

const LessonViewer = ({ lesson }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);

  // Eye-tracking: immediate "looking away" feedback
  const [isLookingAway, setIsLookingAway] = useState(false);

  const totalSteps = lesson.steps.length;
  const step = lesson.steps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    // 1) Initialize WebGazer
    webgazer
      .setRegression('ridge') // Use default regression
      .setGazeListener((gazeData) => {
        if (!gazeData) {
          // If no gaze data is available
          setIsLookingAway(true);
        } else {
          // If gaze coordinates are off-screen, consider "looking away"
          if (isOutOfScreen(gazeData.x, gazeData.y)) {
            setIsLookingAway(true);
          } else {
            setIsLookingAway(false);
          }
        }
      })
      .begin();

    // 2) Hide webcam preview and overlays
    webgazer
      .showVideoPreview(false) // Hide camera feed
      .showFaceOverlay(false) // Hide face overlay
      .showFaceFeedbackBox(false); // Hide feedback box

    // Cleanup when unmounting the component
    return () => {
      try {
        webgazer.end(); // Stop WebGazer and release resources
      } catch (err) {
        console.warn('Error during webgazer.end():', err);
      }
    };
  }, []);

  // Utility: check if gaze coordinates are off the visible window
  const isOutOfScreen = (x, y) => {
    if (x == null || y == null) return true;
    if (x < 0 || x > window.innerWidth) return true;
    if (y < 0 || y > window.innerHeight) return true;
    return false;
  };

  // ---------- LESSON AND QUIZ LOGIC ----------
  const handleNext = () => {
    if (step.type === 'quiz' && !showAnswers) {
      alert('Please complete the quiz before moving on.');
      return;
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setShowAnswers(false);
      setSelectedAnswers({});
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setShowAnswers(false);
      setSelectedAnswers({});
    }
  };

  const handleOptionChange = (questionIndex, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: option,
    }));
  };

  const checkAnswers = () => {
    setShowAnswers(true);
  };

  const isQuizIncomplete = step.type === 'quiz' && !showAnswers;

  return (
    <div className="lesson-container">
      {/* Progress bar */}
      <div className="progress-bar" style={{ width: `${progress}%` }}></div>

      {/* Render content or quiz */}
      {step.type === 'content' && (
        <div className="lesson-content">
          <h2>{step.title}</h2>
          <p>{step.content}</p>
        </div>
      )}

      {step.type === 'quiz' && (
        <div className="lesson-quiz">
          <h3>{step.quizTitle || 'Quiz'}</h3>
          {step.questions.map((q, questionIndex) => (
            <div key={questionIndex} style={{ marginBottom: '1rem' }}>
              <p>
                <strong>Q{questionIndex + 1}:</strong> {q.question}
              </p>
              {q.options.map((option, optIndex) => (
                <div key={optIndex}>
                  <label>
                    <input
                      type="radio"
                      name={`question-${questionIndex}`}
                      value={option}
                      checked={selectedAnswers[questionIndex] === option}
                      onChange={() => handleOptionChange(questionIndex, option)}
                    />
                    {option}
                  </label>
                </div>
              ))}
              {showAnswers && (
                <div style={{ marginTop: '0.5rem' }}>
                  {selectedAnswers[questionIndex] === q.correctAnswer
                    ? 'Correct!'
                    : `Incorrect. Correct answer: ${q.correctAnswer}`}
                </div>
              )}
            </div>
          ))}

          {!showAnswers && (
            <button onClick={checkAnswers} style={{ marginTop: '1rem' }}>
              Check Answers
            </button>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="navigation">
        <button onClick={handlePrevious} disabled={currentStep === 0}>
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={currentStep === totalSteps - 1 || isQuizIncomplete}
        >
          Next
        </button>
      </div>

      {/* “Looking away” text */}
      {isLookingAway && (
        <div style={{ color: 'red', marginTop: '1rem' }}>
          You seem to be looking away!
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
