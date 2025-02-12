import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import DefaultPfp from '../assets/default_pfp.jpg';
import Card from '../../components/Card/Card';
import { FaStar } from 'react-icons/fa';

console.log('Profile page loaded'); // Debug log

function ProfilePage() {
    const { username } = useParams();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [courses, setCourses] = useState([]);
    const [totalStars, setTotalStars] = useState(0);
    const [error, setError] = useState(null);

    console.log('Profile page rendered for username:', username); // Debug log

    const formatStarCount = (count) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count;
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) {
                    console.log('No token found, redirecting to login');
                    navigate('/login');
                    return;
                }

                console.log('Fetching profile data for:', username);

                const meResponse = await fetch('http://localhost:5000/api/me', {
                    headers: { 'Authorization': token }
                });
                const meData = await meResponse.json();
                const isOwn = meData.username === username;
                setIsOwnProfile(isOwn);

                const profileResponse = await fetch(`http://localhost:5000/api/nameprofile/${encodeURIComponent(username)}`);
                if (!profileResponse.ok) {
                    throw new Error(`Profile not found: ${profileResponse.status}`);
                }
                const data = await profileResponse.json();
                console.log('Profile data received:', data);
                setProfileData(data);

                const transformedCourses = (data.courses || []).map(course => ({
                    ...course,
                    id: course.id || '', 
                    title: course.title || 'Untitled',
                    creator: course.creator || username,
                    tags: course.tags || []
                }));
                console.log('Transformed courses:', transformedCourses);
                setCourses(transformedCourses);

                const starsResponse = await fetch(`http://localhost:5000/api/users/${username}/stars`);
                if (starsResponse.ok) {
                    const starsData = await starsResponse.json();
                    setTotalStars(starsData.totalStars);
                }

            } catch (error) {
                console.error('Error fetching profile:', error);
                setError(error.message);
                if (error.message.includes('Profile not found')) {
                    setTimeout(() => navigate('/'), 2000);
                }
            }
        };

        if (username) {
            console.log('Starting profile fetch for:', username);
            fetchProfileData();
        } else {
            console.log('No username provided');
            navigate('/');
        }
    }, [username, navigate]);

    const handleCourseClick = (courseId) => {
        navigate(`/viewer/${courseId}`);
    };

    if (error) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Error</h2>
                <p>{error}</p>
                <p>Redirecting to home page...</p>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '30px',
                gap: '20px'
            }}>
                <img 
                    src={profileData.profilePicture || DefaultPfp} 
                    alt="Profile" 
                    style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                    }} 
                />
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ margin: 0 }}>{profileData.username}</h2>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#FF6B35',
                            padding: '4px 8px',
                            borderRadius: '12px'
                        }}>
                            <FaStar color="#FFD700" />
                            <span style={{ color: 'black', fontWeight: 'bold' }}>
                                {formatStarCount(totalStars)}
                            </span>
                        </div>
                    </div>
                    {profileData.bio && (
                        <p style={{ marginTop: '10px', color: '#666' }}>{profileData.bio}</p>
                    )}
                    {isOwnProfile && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/panel')}
                            style={{ 
                                padding: '8px 16px',
                                marginTop: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            Edit Profile
                        </motion.button>
                    )}
                </div>
            </div>

            <h3>Created Courses</h3>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '20px',
                marginTop: '20px'
            }}>
                {courses.map((course) => (
                    <Card 
                        key={course.id}
                        card={[course.id, course.title, course.creator, course.tags]}
                        onClick={() => handleCourseClick(course.id)}
                    />
                ))}
                {courses.length === 0 && (
                    <p>No courses created yet.</p>
                )}
            </div>
        </div>
    );
}

export default ProfilePage; 