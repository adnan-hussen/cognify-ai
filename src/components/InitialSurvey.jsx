// src/components/InitialSurvey.jsx
import { useState, useEffect } from 'react'

function InitialSurvey({ onClose }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const questions = [
    {
      id: 'name',
      question: 'What should I call you?',
      type: 'text'
    },
    {
      id: 'age',
      question: 'How old are you?',
      type: 'number'
    },
    {
      id: 'anxiety1',
      question: 'Over the last two weeks, how often have you been bothered by feeling nervous, anxious, or on edge?',
      type: 'radio',
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    },
    {
      id: 'anxiety2',
      question: 'Over the last two weeks, how often have you been unable to stop or control worrying?',
      type: 'radio',
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    },
    {
      id: 'depression1',
      question: 'Over the last two weeks, how often have you been bothered by having little interest or pleasure in doing things?',
      type: 'radio',
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    },
    {
      id: 'depression2',
      question: 'Over the last two weeks, how often have you been bothered by feeling down, depressed, or hopeless?',
      type: 'radio',
      options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day']
    },
    {
      id: 'adhd1',
      question: 'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?',
      type: 'radio',
      options: ['Never', 'Rarely', 'Sometimes', 'Often']
    },
    {
      id: 'adhd2',
      question: 'How often do you have difficulty getting things in order when you have to do a task that requires organization?',
      type: 'radio',
      options: ['Never', 'Rarely', 'Sometimes', 'Often']
    },
    {
      id: 'adhd3',
      question: 'How often do you avoid, dislike, or are reluctant to engage in tasks that require sustained mental effort?',
      type: 'radio',
      options: ['Never', 'Rarely', 'Sometimes', 'Often']
    },
    {
      id: 'bipolar1',
      question: 'Have you ever had a period of time when you felt so good or so hyper that other people thought you were not your normal self or you were so hyper you stopped sleeping?',
      type: 'radio',
      options: ['Yes', 'No']
    },
    {
      id: 'bipolar2',
      question: 'During such a time, did you feel like you had a lot of energy?',
      type: 'radio',
      options: ['Yes', 'No']
    }
  ]

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Submit answers and close
      console.log('Survey answers:', answers)
      onClose()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentStep].id]: value
    }))
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && answers[questions[currentStep].id]) {
      e.preventDefault()
      handleNext()
    }
  }

  // Add event listener for Enter key
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [currentStep, answers]) // Dependencies ensure the listener updates with state changes

  return (
    <div className="survey-overlay">
      <div className="survey-modal">
        <div className="survey-header d-flex align-items-center mb-4">
          {currentStep > 0 && (
            <button 
              className="survey-back-btn"
              onClick={handleBack}
              aria-label="Go back"
            >
              <i className="bi bi-arrow-left"></i>
            </button>
          )}
          <h4 className={currentStep === 0 ? '' : 'ms-4'}>
            {currentStep === 0 ? 'Before we get started' : 'Question ' + (currentStep + 1) + ' of ' + questions.length}
          </h4>
        </div>

        {currentStep === 0 && (
          <p className="mb-4">I need to know more about you. It won't take 5 minutes.</p>
        )}
        
        <div className="survey-content">
          <h5 className="mb-3">{questions[currentStep].question}</h5>
          
          {questions[currentStep].type === 'text' && (
            <input
              type="text"
              className="form-control"
              value={answers[questions[currentStep].id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              autoFocus
            />
          )}
          
          {questions[currentStep].type === 'number' && (
            <input
              type="number"
              className="form-control"
              value={answers[questions[currentStep].id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              min="0"
              max="120"
              autoFocus
            />
          )}
          
          {questions[currentStep].type === 'radio' && (
            <div className="radio-options">
              {questions[currentStep].options.map((option, index) => (
                <div key={index} className="radio-option">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name={questions[currentStep].id}
                    value={option}
                    checked={answers[questions[currentStep].id] === option}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="d-none"
                  />
                  <label 
                    htmlFor={`option-${index}`}
                    className={`btn btn-outline-primary w-100 ${
                      answers[questions[currentStep].id] === option ? 'active' : ''
                    }`}
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="survey-footer">
          <div className="progress mb-3">
            <div 
              className="progress-bar" 
              style={{ width: `${(currentStep + 1) * 100 / questions.length}%` }}
            ></div>
          </div>
          <button 
            className="btn btn-custom w-100"
            onClick={handleNext}
            disabled={!answers[questions[currentStep].id]}
          >
            {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default InitialSurvey