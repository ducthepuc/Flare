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
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const loadProgress = async () => {
      const token = localStorage.getItem('userToken');
      if (!token || !courseData) return;

      try {
        const response = await fetch(`http://localhost:5000/api/course_progress/${courseTitle}`, {
          headers: {
            'Authorization': token
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.currentStep !== undefined) {
            setCurrentIndex(data.currentStep);
          }
        }
      } catch (error) {
        console.error('Failed to load progress:', error);
      }
    };

    loadProgress();
  }, [courseData, courseTitle]);

  useEffect(() => {
    const saveProgress = async () => {
      console.log("Saving")
      console.log(JSON.stringify({
        currentStep: currentIndex,
        totalSteps: courseData.elements.length
      }))
      if (!courseData || !courseData.elements) return;
  
      const token = localStorage.getItem('userToken');
      if (!token) return;
  
      const progress = ((currentIndex + 1) / courseData.elements.length) * 100;
      
      try {
        const user = await fetch('http://localhost:5000/api/me', {
          headers: { 'Authorization': token }
        }).then(res => res.json());
  
        await fetch(`http://localhost:5000/api/course_progress/${courseTitle}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token
          },
          body: JSON.stringify({
            currentStep: currentIndex,
            totalSteps: courseData.elements.length,
            userId: user.id
          })
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    };
    
    saveProgress();
  }, [currentIndex, courseData, courseTitle]);

  useEffect(() => {
    const fetchCourseData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:5000/api/courses/${encodeURIComponent(courseTitle)}`);
        const data = await response.json();
        console.log(data);

        if (!response.ok) {
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

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

    if (courseTitle) {
      fetchCourseData();
    }
    if (courseTitle) {
      fetchCourseData();
    }
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

  const renderElement = (element, index) => {
    if (!element) return null;
    if (element.type === "lesson") {
      return (
          <motion.div key={index} style={{
            margin: '10px auto',
            borderRadius: '15px',
            padding: '10px',
            background: 'radial-gradient(circle, rgba(41,42,41,1) 0%, rgba(31,32,30,1) 100%)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            maxWidth: '40vw',
          }}
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
            <p style={{margin: '10px auto',
              borderRadius: '15px',
              padding: '10px',
              background: 'radial-gradient(circle, rgba(41,42,41,1) 0%, rgba(31,32,30,1) 100%)',
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              maxWidth: '60vw',}}>{element.questionText}</p>
            {element.answers.map((answer, ansIndex) => (
                <div key={ansIndex} style={{margin: '10px auto',
                  borderRadius: '15px',
                  padding: '10px',
                  background: 'radial-gradient(circle, rgba(41,42,41,1) 0%, rgba(31,32,30,1) 100%)',
                  boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                  maxWidth: '40vw',}}>
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
          <div key={index} style={{
            margin: '10px auto',
            borderRadius: '15px',
            padding: '10px',
            background: 'radial-gradient(circle, rgba(41,42,41,1) 0%, rgba(31,32,30,1) 100%)',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            maxWidth: '60vw',
          }}>
              <div className="flex justify-between items-start mb-4">
                  <p style={{
                    margin: '10px auto',
                    borderRadius: '15px',
                    padding: '10px',
                    background: 'radial-gradient(circle, rgba(41,42,41,1) 0%, rgba(31,32,30,1) 100%)',
                    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                    maxWidth: '40vw',}}>
                      {element.task.split('**').map((part, i) => 
                          i % 2 === 0 ? 
                              <span key={i}>{part}</span> : 
                              <span key={i} className="bg-yellow-200 text-black px-1 rounded">{part}</span>
                      )}
                  </p>
                  {element.help && (
                      <button
                          onClick={() => setShowHelp(!showHelp)}
                          style={{boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                            backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
                            color: '#000000',
                            maxWidth: '40vw',
                            margin: '10px auto',
                            borderRadius: '5px',
                            padding: '5px',
                          fontSize: '24px',}}
                          title={showHelp ? "Hide help" : "Show help"}
                      > Help!
                      </button>
                  )}
              </div>

              {showHelp && element.help && (
                  <div className="mb-4 p-4 bg-blue-100 text-blue-800 rounded-lg">
                      <p style={{
                        margin: '10px auto',
                        borderRadius: '15px',
                        padding: '10px',
                        background: 'radial-gradient(circle, rgba(41,42,41,1) 0%, rgba(31,32,30,1) 100%)',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                        maxWidth: '40vw',}}>{element.help}</p>
                  </div>
              )}

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

              <motion.button
                  onClick={() => checkCodeTaskAnswer(index)}
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
                  }}
                  whileHover={{scale: 1.1}}
              >
                Check Solution
              </motion.button>

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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading course...</div>;
  }

  if (!courseData || !courseData.elements || courseData.elements.length === 0) {
    return (
        <div className="flex justify-center items-center h-screen flex-col">
            <p className="text-xl text-red-600 mb-4">
                {courseData === null ? 'Failed to load course' : 'Course not found or invalid'}
            </p>
            <button
                onClick={() => navigate('/homepage')}
                className="px-6 py-2 bg-blue-500 text-white rounded-md"
            >
                Return to Homepage
            </button>
        </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto p-5">
        <h1 className="text-3xl font-bold mb-4">{courseData.title}</h1>
        <p className="text-gray-600 mb-8">{courseData.description}</p>

        {renderElement(courseData.elements[currentIndex], currentIndex)}

        <div className="flex justify-between items-center mt-8">
          <motion.button
              onClick={handleBack}
              disabled={currentIndex === 0}
              style={{
                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`
              }}
              whileHover={{
                scale: '1.1'
              }}
          >
            Back
          </motion.button>
          <motion.button
              onClick={handleNext}
              disabled={currentIndex === courseData.elements.length - 1}
              style={{
                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
              }}
              whileHover={{scale: 1.1}}
          >
            Continue
          </motion.button>
        </div>

        <div className="mt-8">
          <motion.button
              onClick={calculateScore}
              style={{
                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
              }}
              whileHover={{
                scale: '1.1',
                backgroundImage: 'radial-gradient(circle, rgba(0,255,94,1) 0%, rgba(40,167,4,1) 100%)'
              }}
          >
            Submit Quiz
          </motion.button>
          <p style={{
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
            backgroundImage: 'radial-gradient(circle, rgba(0,255,94,1) 0%, rgba(40,167,4,1) 100%)',
            color: '#000000',
            maxWidth: '40vw',
            margin: '10px auto',
            borderRadius: '15px',
            padding: '5px'
          }}>
            Your score: {score} / {scorableElements}
          </p>
          <motion.button
              onClick={() => navigate('/homepage')}
              style={{
                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
              }}
              whileHover={{
                scale: '1.1',
                backgroundImage: 'radial-gradient(circle, rgba(255,0,56,1) 0%, rgba(167,4,4,1) 100%)',
              }}
          >
            Back to homepage
          </motion.button>
        </div>
      </div>
  );
}

export default Viewer;