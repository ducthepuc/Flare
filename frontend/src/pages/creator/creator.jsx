import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { CodeTask } from '../components/StepTypes/CodeTask/CodeTask.jsx';
import { Lesson } from '../components/StepTypes/Lesson/Lesson.jsx';
import { Question } from '../components/StepTypes/Question/Question';
import { useSteps } from '../hooks/useSteps.jsx';
import { formatCourseData } from '../utils/courseDataFormatter.jsx';
import { motion } from 'framer-motion';

function CourseCreator() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const { steps, setSteps, addStep, removeStep, updateStep } = useSteps();

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleStepChange = (index, field, value) => {
        updateStep(index, field, value);
    };

    const handleHighlightedElementChange = (stepIndex, elementIndex, value) => {
        const newSteps = [...steps];
        if (!newSteps[stepIndex].highlightedElements) {
            newSteps[stepIndex].highlightedElements = [];
        }

        if (elementIndex === newSteps[stepIndex].highlightedElements.length) {
            newSteps[stepIndex].highlightedElements.push(value);
        } else {
            newSteps[stepIndex].highlightedElements[elementIndex] = value;
        }
        setSteps(newSteps);
    };

    const removeHighlightedElement = (stepIndex, elementIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].highlightedElements.splice(elementIndex, 1);
        setSteps(newSteps);
    };

    const addAcceptedAnswer = (stepIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].acceptedAnswers.push({code: ''});
        setSteps(newSteps);
    };

    const removeAcceptedAnswer = (stepIndex, answerIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].acceptedAnswers.splice(answerIndex, 1);
        setSteps(newSteps);
    };

    const handleAcceptedAnswerChange = (stepIndex, answerIndex, value) => {
        const newSteps = [...steps];
        newSteps[stepIndex].acceptedAnswers[answerIndex].code = value;
        setSteps(newSteps);
    };

    const addAnswerOption = (stepIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].answers.push({text: '', correct: false});
        setSteps(newSteps);
    };

    const removeAnswerOption = (stepIndex, answerIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].answers.splice(answerIndex, 1);
        setSteps(newSteps);
    };

    const handleAnswerChange = (stepIndex, answerIndex, value) => {
        const newSteps = [...steps];
        newSteps[stepIndex].answers[answerIndex].text = value;
        setSteps(newSteps);
    };

    const toggleCorrectAnswer = (stepIndex, answerIndex) => {
        const newSteps = [...steps];
        newSteps[stepIndex].answers[answerIndex].correct = !newSteps[stepIndex].answers[answerIndex].correct;
        setSteps(newSteps);
    };

    const handleAddStep = (type) => {
        addStep(type);
        setIsDropdownOpen(false);
    };

    const saveCourse = async () => {
        const courseData = formatCourseData(title, description, steps);
        if (title === "") {
            alert("Please enter a title");
        } else {
            try {
                const response = await fetch('/api/file_upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(courseData),
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Course saved successfully:', result);
                    alert('Course saved successfully!');
                    navigate('/homepage');
                } else {
                    const error = await response.json();
                    console.error('Failed to save course:', error);
                    alert(`Failed to save course: ${error.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.error('Error occurred:', error);
                alert('An error occurred while saving the course.');
            }
        }
        }

    return (
        <div className="p-5">
            <motion.input
                type="text"
                placeholder="Course Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                    width: '75%',
                    padding: '12px',
                    marginBottom: '16px',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    backgroundColor: '#333333',
                    color: 'white',
                    outline: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: '16px',
                }}
                whileHover={{
                    backgroundColor: '#444444',
                }}
                whileFocus={{
                    backgroundColor: '#555555',
                    border: '1px solid #FF7F4F',
                }}
            />

            <motion.textarea
                placeholder="Course Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                    width: '75%',
                    height: '250px',
                    padding: '12px',
                    marginBottom: '16px',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    backgroundColor: '#333333',
                    color: 'white',
                    outline: 'none',
                    resize: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: '16px',
                }}
                whileHover={{
                    backgroundColor: '#444444',
                }}
                whileFocus={{
                    backgroundColor: '#555555',
                    border: '1px solid #FF7F4F',
                }}
            />

            {steps.map((step, stepIndex) => (
                <div key={stepIndex} className="border border-gray-300 m-2 p-4 rounded-md">
                    <button
                        onClick={() => removeStep(stepIndex)}
                        className="float-right text-red-500 hover:text-red-700"
                    >
                        Delete Step
                    </button>

                    {step.type === 'lesson' && (
                        <Lesson
                            step={step}
                            stepIndex={stepIndex}
                            steps={steps}
                            setSteps={setSteps}
                        />
                    )}

                    {step.type === 'question' && (
                        <Question
                            step={step}
                            stepIndex={stepIndex}
                            handleStepChange={handleStepChange}
                            handleAnswerChange={handleAnswerChange}
                            toggleCorrectAnswer={toggleCorrectAnswer}
                            removeAnswerOption={removeAnswerOption}
                            addAnswerOption={addAnswerOption}
                        />
                    )}

                    {step.type === 'code-task' && (
                        <CodeTask
                            step={step}
                            stepIndex={stepIndex}
                            handleStepChange={handleStepChange}
                            handleHighlightedElementChange={handleHighlightedElementChange}
                            removeHighlightedElement={removeHighlightedElement}
                            addAcceptedAnswer={addAcceptedAnswer}
                            removeAcceptedAnswer={removeAcceptedAnswer}
                            handleAcceptedAnswerChange={handleAcceptedAnswerChange}
                        />
                    )}
                </div>
            ))}

            <div className="relative inline-block">
                <button
                    onClick={toggleDropdown}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                    Add Step
                </button>
                {isDropdownOpen && (
                    <div className="absolute bg-gray-800 text-white shadow-lg z-10 w-48 rounded-md">
                        <div
                            onClick={() => handleAddStep('lesson')}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-center"
                        >
                            Lesson
                        </div>
                        <div
                            onClick={() => handleAddStep('question')}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-center"
                        >
                            Question
                        </div>
                        <div
                            onClick={() => handleAddStep('code-task')}
                            className="p-2 hover:bg-gray-700 cursor-pointer text-center"
                        >
                            Coding Task
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 space-y-2">
                <button
                    onClick={saveCourse}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                    Save Course
                </button>
                <button
                    onClick={() => navigate('/homepage')}
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                    Back to homepage
                </button>
            </div>
        </div>
    );
}

export default CourseCreator;