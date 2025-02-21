import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import DefaultPfp from '../../pages/assets/default_pfp.jpg';
import { FaStar } from 'react-icons/fa';

const Card = ({ card, onClick }) => {
    const navigate = useNavigate();
    const [creatorPfp, setCreatorPfp] = useState(DefaultPfp);
    const [progress, setProgress] = useState(0);
    const [totalSteps, setTotalSteps] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [stars, setStars] = useState(0);
    const [hasStarred, setHasStarred] = useState(false);
    console.log(card)

    const courseId = card[0];
    const title = card[1];
    const creatorId = card[2]
    const [creator, setCreator] = useState("Unknown");
    const tags = card[3] || [];

    useEffect(() => {
        console.log('Card component received data:', card);
    }, [card]);

    useEffect(() => {
        const fetchData = async () => {
            if (!courseId) {
                console.log('No course ID provided');
                return;
            }

            try {
                const courseResponse = await fetch(`http://localhost:5000/api/courses/${encodeURIComponent(courseId)}`);
                const courseData = await courseResponse.json();
                
                if (courseData.elements?.length) {
                    setTotalSteps(courseData.elements.length);

                    const token = localStorage.getItem('userToken');
                    if (token) {
                        const progressResponse = await fetch(
                            `http://localhost:5000/api/course_progress/${encodeURIComponent(courseId)}`,
                            { headers: { 'Authorization': token } }
                        );
                        const progressData = await progressResponse.json();
                        
                        if (progressData?.currentStep !== undefined) {
                            const step = progressData.currentStep;
                        
                            setCurrentStep(step);
                            let calculatedProgress = ((step) / courseData.elements.length) * 100;

                            if (calculatedProgress < 100) {
                                calculatedProgress = Math.min(calculatedProgress, 90);
                            }
                            
                            setProgress(calculatedProgress);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching course data:', error);
            }
        };

        fetchData();
    }, [courseId]);

    useEffect(() => {
        const fetchStars = async () => {
            try {
                const token = localStorage.getItem('userToken');
                const response = await fetch(
                    `http://localhost:5000/api/course/${courseId}/stars`,
                    { headers: token ? { 'Authorization': token } : {} }
                );
                const data = await response.json();
                setStars(data.stars);
                setHasStarred(data.hasStarred);
            } catch (error) {
                console.error('Error fetching stars:', error);
            }
        };

        if (courseId) {
            fetchStars();
        }
    }, [courseId]);

    useEffect(() => {
        const fetchCreatorProfile = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/profile/${encodeURIComponent(creatorId)}`);
                if (response.ok) {
                    const data = await response.json();
                    setCreatorPfp(data.profilePicture || DefaultPfp);
                    setCreator(data.username)
                }
            } catch (error) {
                console.error('Error fetching creator profile:', error);
            }
        };

        if (creator) {
            fetchCreatorProfile();
        }
    }, [creator]);

    const handleCreatorClick = (e) => {
        e.stopPropagation();
        navigate(`/profile/${encodeURIComponent(creator)}`);
    };

    const handleStarClick = async (e) => {
        e.stopPropagation();
        const token = localStorage.getItem('userToken');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const method = hasStarred ? 'DELETE' : 'POST';
            const response = await fetch(
                `http://localhost:5000/api/course/${courseId}/stars`,
                {
                    method,
                    headers: { 'Authorization': token }
                }
            );

            if (response.ok) {
                setStars(prev => hasStarred ? prev - 1 : prev + 1);
                setHasStarred(!hasStarred);
            } else {
                console.error('Error updating star:', response.statusText);
            }
        } catch (error) {
            console.error('Error updating star:', error);
        }
    };

    const formatStarCount = (count) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count;
    };

    if (!courseId || !title) {
        console.log('Missing required course data, not rendering card');
        return null;
    }

    return (
        <motion.div 
            style={{
                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
                borderRadius: '8px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                cursor: 'pointer',
                position: 'relative'
            }}
            whileHover={{ scale: 1.05, backgroundColor: '#FF7F4F'}}
            whileTap={{ scale: 0.95, backgroundColor: 'rgb(240, 240, 240)' }}
            onClick={onClick}
        >
            <div style={{ padding: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ color: 'black', margin: 0 }}>{title}</h4>
                    <div 
                        onClick={handleStarClick}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        <FaStar 
                            color={hasStarred ? '#FFD700' : '#666'} 
                            size={20}
                        />
                        <span style={{ color: 'black', fontSize: '0.9em' }}>
                            {formatStarCount(stars)}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <img 
                        src={creatorPfp} 
                        alt="Creator" 
                        style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            marginRight: '8px' 
                        }} 
                    />
                    <p style={{ fontSize: '0.9em', color: 'black', margin: 0 }}>
                        by: <span 
                            onClick={handleCreatorClick}
                            style={{ 
                                textDecoration: 'underline', 
                                cursor: 'pointer',
                                color: '#2a2a2a'
                            }}
                        >
                            {creator}
                        </span>
                    </p>
                </div>
                <div className="progress-bar" style={{ 
                    width: '100%', 
                    height: '10px', 
                    backgroundColor: '#ddd',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                }}>
                    <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: '#4CAF50',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
                <p style={{ fontSize: '0.8em', color: 'black', marginBottom: '8px' }}>
                    Progress: {Math.round(progress)}% ({currentStep}/{totalSteps} steps)
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                    {tags.map((tag, index) => (
                        <span 
                            key={index} 
                            className="bg-blue-500 text-white px-2 py-1 rounded-full text-sm"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default Card; 