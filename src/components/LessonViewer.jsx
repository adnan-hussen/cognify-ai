import React, { useEffect, useState, useRef } from 'react';

const LessonViewer = ({ lesson }) => {
    // Core lesson state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
    const [isWebGazerLoading, setIsWebGazerLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showAnswers, setShowAnswers] = useState(false);
    const [slideDirection, setSlideDirection] = useState('');

    // Eye tracking state
    const [isLookingAway, setIsLookingAway] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationPoint, setCalibrationPoint] = useState({ x: 0, y: 0 });
    const [calibrationStep, setCalibrationStep] = useState(0);
    const [error, setError] = useState("");
    const [isTracking, setIsTracking] = useState(false);

    // Timer state
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isBreak, setIsBreak] = useState(false);
    const [focusDuration, setFocusDuration] = useState(25);
    const [breakDuration, setBreakDuration] = useState(5);
    const [showTimerSettings, setShowTimerSettings] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [totalCycles, setTotalCycles] = useState(4);
    const [currentCycle, setCurrentCycle] = useState(1);
    const [isComplete, setIsComplete] = useState(false);

    // References
    const lookingAwayTimeoutRef = useRef(null);
    const webgazerInitialized = useRef(false);
    const contentAreaRef = useRef(null);
    const timerIntervalRef = useRef(null);

    // Calibration points
    const calibrationPoints = useRef([
        { x: 10, y: 10 }, { x: 50, y: 10 }, { x: 90, y: 10 },
        { x: 10, y: 50 }, { x: 50, y: 50 }, { x: 90, y: 50 },
        { x: 10, y: 90 }, { x: 50, y: 90 }, { x: 90, y: 90 }
    ]);

    // Lesson data
    const totalSteps = lesson.steps.length;
    const step = lesson.steps[currentStep];
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const checkGaze = (data) => {
        if (lookingAwayTimeoutRef.current) {
            clearTimeout(lookingAwayTimeoutRef.current);
        }

        if (!data || !isTracking) {
            console.log('No gaze data or not tracking');
            setIsLookingAway(true);
            return;
        }

        const x = data.x;
        const y = data.y;

        if (isNaN(x) || isNaN(y)) {
            console.log('Invalid coordinates');
            setIsLookingAway(true);
            return;
        }

        const viewportMargin = 100;
        if (
            x < -viewportMargin ||
            x > window.innerWidth + viewportMargin ||
            y < -viewportMargin ||
            y > window.innerHeight + viewportMargin
        ) {
            console.log('Outside viewport bounds');
            setIsLookingAway(true);
            return;
        }

        if (contentAreaRef.current) {
            const rect = contentAreaRef.current.getBoundingClientRect();
            const margin = 200;

            const isWithinContent =
                x >= (rect.left-margin) &&
                x <= (rect.right + margin) &&
                y >= (rect.top - margin) &&
                y <= (rect.bottom + margin);

            if (!isWithinContent) {
                console.log('Outside content area');
                setIsLookingAway(true);
                return;
            }
        }

        console.log('Valid gaze detected');
        setIsLookingAway(false);
    };

    useEffect(() => {
        const setupWebGazer = async () => {
            try {
                setIsWebGazerLoading(true);
                const style = document.createElement('style');
                style.textContent = `
                    #webgazerVideoContainer, 
                    #webgazerVideoFeed,
                    #webgazerFaceOverlay, 
                    #webgazerFaceFeedbackBox,
                    .webgazerGazeDot,
                    #webgazerGazeDot {
                        display: none !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                    }
                `;
                document.head.appendChild(style);

                const script = document.createElement("script");
                script.src = "https://webgazer.cs.brown.edu/webgazer.js";
                script.async = true;

                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                    document.body.appendChild(script);
                });

                if (window.webgazer) {
                    const canvas = document.createElement('canvas');
                    canvas.getContext('2d', { willReadFrequently: true });

                    await window.webgazer
                        .setRegression('ridge')
                        .setTracker('TFFacemesh')
                        .setGazeListener((data) => {
                            if (!isTracking) return;
                            checkGaze(data);
                        })
                        .begin();

                    window.webgazer.showPredictionPoints(false);
                    window.webgazer.params.smoothLevel = 0.5;
                    window.webgazer.params.showVideo = false;
                    window.webgazer.params.showFaceOverlay = false;
                    window.webgazer.params.showFaceFeedbackBox = false;
                    window.webgazer.params.showGazeDot = false;

                    webgazerInitialized.current = true;
                    console.log('WebGazer initialized successfully');
                    setIsWebGazerLoading(false);
                }
            } catch (err) {
                console.error('WebGazer setup failed:', err);
                setError("Failed to initialize eye tracking. Please check camera permissions.");
                setIsWebGazerLoading(false);
            }
        };

        setupWebGazer();

        return () => {
            if (window.webgazer) {
                window.webgazer.end();
            }
            if (lookingAwayTimeoutRef.current) {
                clearTimeout(lookingAwayTimeoutRef.current);
            }
        };
    }, [isTracking]);

    const startTimer = () => {
        if (timerIntervalRef.current || isComplete) return;
        
        setIsTimerRunning(true);
        timerIntervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerIntervalRef.current);
                    timerIntervalRef.current = null;
                    
                    setIsBreak(prevIsBreak => {
                        const newIsBreak = !prevIsBreak;
                        if (newIsBreak) {
                            setTimeLeft(breakDuration * 60);
                        } else {
                            setCurrentCycle(prev => {
                                const nextCycle = prev + 1;
                                if (nextCycle > totalCycles) {
                                    setIsComplete(true);
                                    return prev;
                                }
                                return nextCycle;
                            });
                            setTimeLeft(focusDuration * 60);
                        }
                        return newIsBreak;
                    });
                    
                    if (!isComplete) {
                        startTimer();
                    }
                    return newIsBreak ? breakDuration * 60 : focusDuration * 60;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const pauseTimer = () => {
        if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
        }
        setIsTimerRunning(false);
    };

    const resetTimer = () => {
        pauseTimer();
        setTimeLeft(focusDuration * 60);
        setIsBreak(false);
        setCurrentCycle(1);
        setIsComplete(false);
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const startCalibration = async () => {
        try {
            if (!webgazerInitialized.current) {
                throw new Error("Eye tracking is not ready");
            }

            await enterFullscreen();
            setIsFullscreen(true);
            setIsCalibrating(true);
            setCalibrationStep(0);
            setIsLookingAway(false);

            await window.webgazer.resume();
            window.webgazer.showVideo(false);
            window.webgazer.showFaceOverlay(false);
            moveCalibrationPoint(0);
        } catch (err) {
            setError(err.message);
            setIsCalibrating(false);
        }
    };

    const moveCalibrationPoint = (step) => {
        if (step >= calibrationPoints.current.length) {
            completeCalibration();
            return;
        }

        const point = calibrationPoints.current[step];
        const x = (point.x * window.innerWidth) / 100;
        const y = (point.y * window.innerHeight) / 100;
        setCalibrationPoint({ x, y });
        setCalibrationStep(step);

        setTimeout(() => {
            if (window.webgazer) {
                window.webgazer.recordScreenPosition(x, y, 'click');
                console.log(`Calibration point ${step + 1} recorded:`, { x, y });
            }
            moveCalibrationPoint(step + 1);
        }, 2000);
    };

    const completeCalibration = () => {
        setIsCalibrating(false);
        window.webgazer.showVideo(false);
        window.webgazer.showFaceOverlay(false);
        setIsTracking(true);
        setIsLookingAway(false);
    };

    const handleNext = () => {
        if (step.type === 'quiz' && !showAnswers) {
            alert('Please complete the quiz before moving on.');
            return;
        }
        if (currentStep < totalSteps - 1) {
            setSlideDirection('slide-left');
            setCurrentStep((prev) => prev + 1);
            setShowAnswers(false);
            setSelectedAnswers({});
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setSlideDirection('slide-right');
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

    const enterFullscreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        }
    };

    const exitFullscreenHandler = () => {
        if (!document.fullscreenElement) {
            setShowFullscreenWarning(true);
            setIsFullscreen(false);
        } else {
            setIsFullscreen(true);
            setShowFullscreenWarning(false);
        }
    };

    useEffect(() => {
        document.addEventListener('fullscreenchange', exitFullscreenHandler);
        return () => {
            document.removeEventListener('fullscreenchange', exitFullscreenHandler);
        };
    }, []);

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isTimerRunning) {
            setTimeLeft(isBreak ? breakDuration * 60 : focusDuration * 60);
        }
    }, [focusDuration, breakDuration, isBreak]);

    const isQuizIncomplete = step.type === 'quiz' && !showAnswers;

    return (
        <div className="lesson-container">
            {/* Pomodoro Timer */}
            <div className={`pomodoro-timer ${isMinimized ? 'minimized' : ''}`} 
                onClick={() => isMinimized && setIsMinimized(false)}>
                {isMinimized ? (
                    <button 
                        className="minimize-button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsMinimized(false);
                        }}
                    >
                        <i className="bi bi-clock"></i>
                    </button>
                ) : (
                    <>
                        <button 
                            className="minimize-button"
                            onClick={() => setIsMinimized(true)}
                        >
                            ⎯
                        </button>
                        
                        <div className="timer-display">
                            <span className={`timer-count ${isBreak ? 'break' : 'focus'}`}>
                                {formatTime(timeLeft)}
                            </span>
                            <span className="timer-label">
                                {isBreak ? 'Break Time' : 'Focus Time'}
                            </span>
                            <div className="cycles-display">
                                {isComplete ? (
                                    <span>All cycles complete! 🎉</span>
                                ) : (
                                    <span>Cycle {currentCycle} of {totalCycles}</span>
                                )}
                            </div>
                        </div>

                        <div className="timer-controls">
                            <button 
                                className="timer-button"
                                onClick={isTimerRunning ? pauseTimer : startTimer}
                                disabled={isComplete}
                            >
                                {isTimerRunning ? 'Pause' : 'Start'}
                            </button>
                            <button 
                                className="timer-button"
                                onClick={resetTimer}
                            >
                                Reset
                            </button>
                            <button 
                                className="timer-button"
                                onClick={() => setShowTimerSettings(!showTimerSettings)}
                            >
                                Settings
                            </button>
                        </div>

                        {showTimerSettings && (<div className="timer-settings">
                                <div className="setting-group">
                                    <label>Focus Duration (minutes):</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={focusDuration}
                                        onChange={(e) => setFocusDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                                    />
                                </div>
                                <div className="setting-group">
                                    <label>Break Duration (minutes):</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={breakDuration}
                                        onChange={(e) => setBreakDuration(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                                    />
                                </div>
                                <div className="setting-group cycles">
                                    <label>Number of Cycles:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={totalCycles}
                                        onChange={(e) => setTotalCycles(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                                    />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Eye Tracking Calibration Button */}
            {!isTracking && !isCalibrating && (
                <button
                    onClick={startCalibration}
                    className={`calibration-button ${isWebGazerLoading ? 'loading' : ''}`}
                    disabled={isWebGazerLoading}
                >
                    {isWebGazerLoading ? 'Initializing Eye Tracking...' : 'Start Eye Tracking Calibration'}
                </button>
            )}

            {/* Calibration Overlay */}
            {isCalibrating && (
                <div className="calibration-overlay">
                    <div
                        className="calibration-point"
                        style={{
                            left: calibrationPoint.x,
                            top: calibrationPoint.y,
                        }}
                    />
                    <div className="calibration-message">
                        Follow the blue dot with your eyes.
                        Step {calibrationStep + 1} of {calibrationPoints.current.length}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Main Lesson Content */}
            {isTracking && (
                <div className="lesson-content-wrapper" ref={contentAreaRef}>
                    <div className="progress-container">
                        <div
                            className="progress-bar"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className={`lesson-card ${slideDirection}`}>
                        {step.type === 'content' ? (
                            <div className="lesson-content">
                                <h2>{step.title}</h2>
                                <p>{step.content}</p>
                            </div>
                        ) : (
                            <div className="lesson-quiz">
                                <h3>{step.quizTitle || 'Quiz'}</h3>
                                {step.questions.map((q, questionIndex) => (
                                    <div key={questionIndex} className="quiz-question">
                                        <p>
                                            <strong>Q{questionIndex + 1}:</strong> {q.question}
                                        </p>
                                        {q.options.map((option, optIndex) => (
                                            <div key={optIndex} className="radio-option">
                                                <input
                                                    type="radio"
                                                    id={`q${questionIndex}-opt${optIndex}`}
                                                    name={`question-${questionIndex}`}
                                                    value={option}
                                                    checked={selectedAnswers[questionIndex] === option}
                                                    onChange={() => handleOptionChange(questionIndex, option)}
                                                    disabled={showAnswers}
                                                />
                                                <label htmlFor={`q${questionIndex}-opt${optIndex}`}>
                                                    {option}
                                                </label>
                                            </div>
                                        ))}
                                        {showAnswers && (
                                            <div className={`answer-feedback ${
                                                selectedAnswers[questionIndex] === q.correctAnswer
                                                    ? 'correct'
                                                    : 'incorrect'
                                            }`}>
                                                {selectedAnswers[questionIndex] === q.correctAnswer ? (
                                                    <span>Correct! Well done!</span>
                                                ) : (
                                                    <span>
                                                        Incorrect. The correct answer is: {q.correctAnswer}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {!showAnswers && (
                                    <button onClick={checkAnswers} className="check-answers-btn">
                                        Check Answers
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="navigation">
                        <button
                            onClick={handlePrevious}
                            disabled={currentStep === 0}
                            className="nav-button previous"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentStep === totalSteps - 1 || isQuizIncomplete}
                            className="nav-button next"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Looking Away Alert - Only show if not in break */}
            {isLookingAway && isTracking && !isCalibrating && !isBreak && (
                <div className="looking-away-alert animate">
                    Hey, stay focused!
                </div>
            )}

            {/* Fullscreen Warning */}
            {showFullscreenWarning && !isCalibrating && (
                <div className="fullscreen-warning">
                    <div className="fullscreen-warning-content">
                        <h3>Seems you've exited fullscreen mode</h3>
                        <div className="warning-text">
                            Fullscreen mode helps you focus better by minimizing distractions.
                        </div>
                        <button
                            className="fullscreen-button"
                            onClick={enterFullscreen}
                        >
                            Return to Fullscreen Mode
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonViewer;