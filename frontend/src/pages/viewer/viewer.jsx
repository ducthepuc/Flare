import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Checkbox, Radio } from 'pretty-checkbox-react';
import '@djthoms/pretty-checkbox';
import {motion} from 'framer-motion';

function Viewer() {
  const { courseTitle } = useParams();
  const navigate = useNavigate();

  const [courseData, setCourseData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [editorHeight, setEditorHeight] = useState(300);
  const [codeTaskAnswers, setCodeTaskAnswers] = useState({});
  const [codeTaskResults, setCodeTaskResults] = useState({});
  const [userProgress, setUserProgress] = useState(null);

  useEffect(() => {
    const fetchCourseData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/courses/${courseTitle}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Validate course data
        if (!data || !Array.isArray(data.elements)) {
          throw new Error('Invalid course data structure');
        }

        setCourseData(data);
        console.log('Course data fetched:', data);
      } catch (error) {
        console.error('Failed to fetch course data:', error);
        setCourseData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseTitle]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(`/api/course-progress/${courseTitle}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentIndex(data.current_step);
          setUserProgress(data);
        }
      } catch (error) {
        console.error('Failed to fetch progress:', error);
      }
    };

    fetchProgress();
  }, [courseTitle]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionIndex]: answerIndex
    }));
  };

  const handleCodeTaskAnswer = (index, code) => {
    setCodeTaskAnswers(prev => ({
      ...prev,
      [index]: code
    }));
  };

  const checkCodeTaskAnswer = (index) => {
    if (!courseData || !courseData.elements) return;

    const element = courseData.elements[index];
    if (element.type !== "code-task") return;

    const userCode = codeTaskAnswers[index] || '';
    const acceptedAnswers = element.acceptedAnswers || [];

    const isCorrect = acceptedAnswers.some(acceptedAnswer => {
      if (acceptedAnswer.startsWith('/') && acceptedAnswer.endsWith('/')) {
        const regex = new RegExp(acceptedAnswer.slice(1, -1));
        return regex.test(userCode);
      }
      return userCode.trim() === acceptedAnswer.trim();
    });

    setCodeTaskResults(prev => ({
      ...prev,
      [index]: {
        isCorrect,
        message: isCorrect
            ? "Correct solution!"
            : "Your solution does not match the expected answer."
      }
    }));
  };

  const calculateScore = () => {
    if (!courseData || !courseData.elements) {
      setScore(0);
      return;
    }

    let totalScore = 0;
    courseData.elements.forEach((element, index) => {
      if (element.type === "question") {
        const selectedAnswerIndex = answers[index];
        if (selectedAnswerIndex !== undefined) {
          const selectedAnswer = element.answers[selectedAnswerIndex];
          if (selectedAnswer && selectedAnswer.correct) {
            totalScore += 1;
          }
        }
      } else if (element.type === "code-task") {
        const codeTaskResult = codeTaskResults[index];
        if (codeTaskResult && codeTaskResult.isCorrect) {
          totalScore += 1;
        }
      }
    });
    setScore(totalScore);
  };

  const handleNext = () => {
    if (courseData && currentIndex < courseData.elements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const saveProgress = async () => {
    try {
      await fetch(`/api/course-progress/${courseTitle}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_step: currentIndex,
          completed: currentIndex === courseData.elements.length - 1
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  useEffect(() => {
    saveProgress();
  }, [currentIndex]);

  const renderElement = (element, index) => {
    if (!element) return null;
    if (element.type === "lesson") {
      return (
          <motion.div key={index} className="border border-gray-200 rounded-lg p-5 mb-5"
          >
            {element.content.map((content, idx) => {
              if (content.type === "text-block") {
                return <p key={idx} className="mb-4">{content.text}</p>;
              } else if (content.type === "code-block") {
                return (
                    <Editor
                        key={idx}
                        defaultLanguage={content.envLang}
                        value={content.envCode}
                        width="100%"
                        height={`${editorHeight}px`}
                        onMount={(editor) => {
                          editor.updateOptions({ contextmenu: false });
                          setEditorHeight(content.envCode.split("\n").length * 20);
                        }}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          contextmenu: false
                        }}
                        theme="vs-dark"
                    />
                );
              }
              return null;
            })}
          </motion.div>
      );
    } else if (element.type === "question") {
      return (
          <div key={index} className="border border-gray-200 rounded-lg p-5 mb-5">
            <p className="text-lg font-medium mb-4">{element.questionText}</p>
            {element.answers.map((answer, ansIndex) => (
                <div key={ansIndex} className="mb-3">
                  {element.questionType === "true-false" ? (
                      <Radio
                          name={`question-${index}`}
                          checked={answers[index] === ansIndex}
                          onChange={() => handleAnswerSelect(index, ansIndex)}
                      >
                        {answer.text}
                      </Radio>
                  ) : (
                      <Checkbox
                          checked={answers[index] === ansIndex}
                          onChange={() => handleAnswerSelect(index, ansIndex)}
                      >
                        {answer.text}
                      </Checkbox>
                  )}
                </div>
            ))}
          </div>
      );
    } else if (element.type === "code-task") {
      return (
          <div key={index} className="border border-gray-200 rounded-lg p-5 mb-5">
            <p className="text-lg font-medium mb-4">{element.task}</p>

            {element.exampleCode && (
                <div className="mb-4">
                  <p className="text-md font-semibold mb-2">Example Code:</p>
                  <Editor
                      defaultLanguage="javascript"
                      value={element.exampleCode}
                      width="100%"
                      height="200px"
                      options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        contextmenu: false
                      }}
                      theme="vs-dark"
                  />
                </div>
            )}

            <div className="mb-4">
              <p className="text-md font-semibold mb-2">Your Solution:</p>
              <Editor
                  defaultLanguage="javascript"
                  value={codeTaskAnswers[index] || ''}
                  width="100%"
                  height="250px"
                  onChange={(value) => handleCodeTaskAnswer(index, value)}
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    contextmenu: true
                  }}
                  theme="vs-dark"
              />
            </div>

            <button
                onClick={() => checkCodeTaskAnswer(index)}
                className="w-full px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 mt-2"
            >
              Check Solution
            </button>

            {codeTaskResults[index] && (
                <div
                    className={`mt-2 p-2 rounded ${
                        codeTaskResults[index].isCorrect
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}
                >
                  {codeTaskResults[index].message}
                </div>
            )}
          </div>
      );
    }

    return null;
  };

  const scorableElements = useMemo(() => {
    if (!courseData || !courseData.elements) return 0;
    return courseData.elements.filter(
        element => element.type === "question" || element.type === "code-task"
    ).length;
  }, [courseData]);

  // Loading state
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading course...</div>;
  }

  // Error state
  if (!courseData || !courseData.elements || courseData.elements.length === 0) {
    return (
        <div className="flex justify-center items-center h-screen flex-col">
          <p className="text-xl text-red-600 mb-4">Course not found or invalid</p>
          <button
              onClick={() => navigate('/homepage')}
              className="px-6 py-2 bg-blue-500 text-white rounded-md"
          >
            Return to Homepage
          </button>
        </div>
    );
  }

  // Main render
  return (
      <div className="max-w-4xl mx-auto p-5">
        <h1 className="text-3xl font-bold mb-4">{courseData.title}</h1>
        <p className="text-gray-600 mb-8">{courseData.description}</p>

        {renderElement(courseData.elements[currentIndex], currentIndex)}

        <div className="flex justify-between items-center mt-8">
          <button
              onClick={handleBack}
              disabled={currentIndex === 0}
              className="px-6 py-2 bg-gray-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
              onClick={handleNext}
              disabled={currentIndex === courseData.elements.length - 1}
              className="px-6 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>

        <div className="mt-8">
          <button
              onClick={calculateScore}
              className="w-full px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Submit Quiz
          </button>
          <p className="text-center mt-4">
            Your score: {score} / {scorableElements}
          </p>
          <button
              onClick={() => navigate('/homepage')}
              className="w-full px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 mt-4"
          >
            Back to homepage
          </button>
        </div>
      </div>
  );
}

export default Viewer;