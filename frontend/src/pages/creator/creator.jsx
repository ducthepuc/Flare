import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { CodeTask } from '../components/StepTypes/CodeTask/CodeTask.jsx';
import { Lesson } from '../components/StepTypes/Lesson/Lesson.jsx';
import { Question } from '../components/StepTypes/Question/Question';
import { useSteps } from '../hooks/useSteps.jsx';
import { formatCourseData } from '../utils/courseDataFormatter.jsx';
import { motion } from 'framer-motion';

function CourseCreator() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { steps, setSteps, addStep, removeStep, updateStep } = useSteps();

    useEffect(() => {
        if (location.state?.course) {
            const course = location.state.course;
            setTitle(course.title);
            setDescription(course.description);
            setTags(course.tags || []);
            setSteps(course.elements);
            setIsEditing(true);
        }
    }, [location]);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleStepChange = (index, field, value) => {
        updateStep(index, field, value);
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

    const handleAddTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const saveCourse = async () => {
        const courseData = formatCourseData(title, description, steps, tags);
        if (title === "") {
            alert("Please enter a title");
            return;
        }

        const token = localStorage.getItem('userToken');
        console.log("=== Debug Info ===");
        console.log("Initial token:", token);

        if (!token) {
            alert("You must be logged in to save a course");
            navigate('/login');
            return;
        }

        try {
            // First verify the token is valid
            console.log("Verifying token with /api/me...");
            const verifyResponse = await fetch('http://localhost:5000/api/me', {
                headers: {
                    'Authorization': token
                }
            });

            console.log("Verify response status:", verifyResponse.status);
            const verifyData = await verifyResponse.json();
            console.log("Verify response data:", verifyData);

            if (!verifyResponse.ok) {
                console.log("Token verification failed");
                localStorage.removeItem('userToken');
                alert("Your session has expired. Please log in again.");
                navigate('/login');
                return;
            }

            console.log("Token verified, proceeding with course save...");
            const response = await fetch('http://localhost:5000/api/course/upload_course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem("userToken")
                },
                body: JSON.stringify(courseData)
            });

            console.log("Save response status:", response.status);
            const data = await response.json();
            console.log("Save response data:", data);

            if (response.ok) {
                alert('Course saved successfully!');
                navigate('/homepage');
            } else {
                const errorMessage = data.error || 'Unknown error occurred';
                console.error('Failed to save course:', errorMessage);
                
                if (errorMessage === "Invalid token") {
                    console.log("Token validation failed, current token:", token);
                    localStorage.removeItem('userToken');
                    alert("Your session has expired. Please log in again.");
                    navigate('/login');
                    return;
                }
                
                alert(`Failed to save course: ${errorMessage}`);
            }
        } catch (error) {
            console.error('Error occurred:', error);
            alert('An error occurred while saving the course. Please try again.');
        }
    };

    return (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/homepage')}
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
                    }}
                    whileHover={{
                        scale: '1.1',
                        backgroundImage: 'radial-gradient(circle, rgba(255,0,56,1) 0%, rgba(167,4,4,1) 100%)',
                    }}
                >
                    Back to Homepage
                </motion.button>
            </div>

            <div style={{ width: '100%', maxWidth: '1200px' }}>
                <motion.input
                    type="text"
                    placeholder="Course Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{
                        width: '100%',
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
                        width: '100%',
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

                <div className="flex gap-2 mb-4">
                    <motion.input
                        type="text"
                        placeholder="Add tags (e.g., python, beginner)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-grow"
                        style={{
                            padding: '12px',
                            border: '1px solid #444',
                            borderRadius: '8px',
                            backgroundColor: '#333333',
                            color: 'white',
                            width: '40vw'
                        }}
                        whileHover={{
                            backgroundColor: '#444444',
                        }}
                    />
                    <motion.button
                        onClick={handleAddTag}
                        style={{
                            backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`
                        }}
                        whileHover={{
                            scale: '1.1'
                        }}
                    >
                        Add Tag
                    </motion.button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {tags.map((tag, index) => (
                        <div
                            key={index}
                            className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-2"
                        >
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="text-sm hover:text-red-300"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>

                {steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="border border-gray-300 m-2 p-4 rounded-md">
                        <motion.button
                            onClick={() => removeStep(stepIndex)}
                            style={{
                                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`
                            }}
                            whileHover={{
                                scale: '1.1'
                            }}
                        >
                            Delete Step
                        </motion.button>

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
                                addAcceptedAnswer={addAcceptedAnswer}
                                removeAcceptedAnswer={removeAcceptedAnswer}
                                handleAcceptedAnswerChange={handleAcceptedAnswerChange}
                            />
                        )}
                    </div>
                ))}

                <div className="relative inline-block">
                    <motion.button
                        onClick={toggleDropdown}
                        style={{
                            backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`
                        }}
                        whileHover={{
                            scale: '1.1'
                        }}
                    >
                        Add Step
                    </motion.button>
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
                    <motion.button
                        onClick={saveCourse}
                        style={{
                            backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
                        }}
                        whileHover={{
                            scale: '1.1',
                            backgroundImage: 'radial-gradient(circle, rgba(0,255,94,1) 0%, rgba(40,167,4,1) 100%)'
                        }}
                    >
                        Save Course
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default CourseCreator;