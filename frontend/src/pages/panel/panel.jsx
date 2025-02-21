import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import DefaultPfp from '../assets/default_pfp.jpg';
import Card from '../../components/Card/Card';
import { FaStar } from 'react-icons/fa';

const UserPanel = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [profilePicture, setProfilePicture] = useState(DefaultPfp);
    const [bio, setBio] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [stars, setStars] = useState(0);
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState(null);
    const [courses, setCourses] = useState([]);
    const [totalStars, setTotalStars] = useState(0);
    const [isEditing, setIsEditing] = useState({
        profilePicture: false,
        bio: false
    });

    useEffect(() => {
        let errorMessage;
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) {
                    console.log('No token found, redirecting to login');
                    navigate('/login');
                    return;
                }
    
                console.log('Fetching user data for:', username);
    
                const meResponse = await fetch('http://localhost:5000/api/me', {
                    headers: { 'Authorization': token }
                });
                const meData = await meResponse.json();
    
                const userResponse = await fetch(`http://localhost:5000/api/nameprofile/${encodeURIComponent(meData.username)}`);
                if (!userResponse.ok) {
                    throw new Error(`User not found: ${userResponse.status}`);
                }
                const data = await userResponse.json();
                console.log('User data received:', data);
                setUsername(meData.username);
                setBio(data.bio);
                setUserData(data);
    
                const transformedCourses = (data.courses || []).map(course => ({
                    ...course,
                    id: course.id || '',
                    title: course.title || 'Untitled',
                    creator: course.creator || meData.username,
                    tags: course.tags || []
                }));
                console.log('Transformed courses:', transformedCourses);
                setCourses(transformedCourses);
    
                const starsResponse = await fetch(`http://localhost:5000/api/users/${meData.username}/stars`);
                if (starsResponse.ok) {
                    const starsData = await starsResponse.json();
                    setTotalStars(starsData.totalStars);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                errorMessage = error.message;
                setError(error ? error.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false); // Add this line to set isLoading to false
                if (errorMessage && errorMessage.includes('User not found')) {
                    setTimeout(() => navigate('/'), 2000);
                }
            }
        };
    
        fetchUserData();
    }, [navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const formatStarCount = (count) => {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        }
        if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count;
    };

    const handleCourseClick = (courseId) => {
        navigate(`/viewer/${courseId}`);
    };

    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const formData = new FormData();
        formData.append('pfp', file);
    
        try {
            const user_token = localStorage.getItem("userToken");
            const response = await fetch('http://localhost:5000/api/change_pfp', {
                method: 'POST',
                headers: {
                    'Authorization': user_token
                },
                body: formData
            });
    
            const result = await response.json();
            if (result.result) {
                setProfilePicture(result.profilePictureUrl || DefaultPfp);
            } else {
                alert('Failed to upload profile picture');
            }
        } catch (error) {
            console.error("Error uploading profile picture:", error);
            alert('Failed to upload profile picture');
        }
    };

    const handleBioUpdate = async () => {
        try {
            const user_token = localStorage.getItem("userToken");
            const response = await fetch('http://localhost:5000/api/v1/configure', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user_token
                },
                body: JSON.stringify({"bio": bio })
            });

            if (!response.ok) {
                throw new Error('Failed to update bio');
            }

            setIsEditing(prev => ({ ...prev, bio: false }));
        } catch (error) {
            return;
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
            minHeight: '100vh',
            fontFamily: 'Arial, sans-serif',
        }}>
            {/* Profile Picture Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                border: '1px solid #FF6B35',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
                marginBottom: '20px',
                width: '100%',
                maxWidth: '400px'
            }}>
                <img 
                    src={profilePicture} 
                    alt="Profile Picture" 
                    style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        marginBottom: '10px'
                    }} 
                />
                <h3 style={{ margin: '10px 0', color: '#000000' }}>{username}</h3>
                {isEditing.profilePicture ? (
                    <input 
                        type="file" 
                        onChange={handleProfilePictureUpload} 
                        style={{
                            marginBottom: '10px',
                            padding: '8px',
                            borderRadius: '6px',
                            border: '1px solid #ddd'
                        }}
                    />
                ) : (
                    <button 
                        onClick={() => setIsEditing(prev => ({ ...prev, profilePicture: true }))}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            ':hover': {
                                backgroundColor: '#575b63',
                            }
                        }}
                    >
                        Edit Profile Picture
                    </button>
                )}
            </div>
        
            {/* Username and Star Count Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                padding: '20px',
                border: '1px solid #1a1a1a',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                backgroundImage: 'linear-gradient(90deg, rgba(42,37,34,1) 0%, rgba(89,89,88,1) 100%)',
                marginBottom: '20px',
                width: '100%',
                maxWidth: '400px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginLeft: '10px'
                }}>
                    <FaStar color="#FFD700" size={18} />
                    <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '18px' }}>
                        Stars: {formatStarCount(totalStars)}
                    </span>
                </div>
            </div>
        
            {/* Bio Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                border: '1px solid #FF6B35',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                backgroundImage: `radial-gradient(circle, rgba(235,88,2,1) 0%, rgba(255,132,0,1) 100%)`,
                marginBottom: '20px',
                width: '100%',
                maxWidth: '400px'
            }}>
                {isEditing.bio ? (
                    <textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            marginBottom: '10px',
                            resize: 'vertical',
                            minHeight: '100px'
                        }}
                    />
                ) : (
                    <p style={{ margin: '0', color: '#000000', textAlign: 'center' }}>{bio}</p>
                )}
                {isEditing.bio ? (
                    <button 
                        onClick={handleBioUpdate}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: '#1a1a1a',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            ':hover': {
                                backgroundColor: '#059669'
                            }
                        }}
                    >
                        Save Bio
                    </button>
                ) : (
                    <button 
                        onClick={() => setIsEditing(prev => ({ ...prev, bio: true }))}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: '#1a1a1a',
                            color: '#ffffff',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            ':hover': {
                                backgroundColor: '#575b63'
                            }
                        }}
                    >
                        Edit Bio
                    </button>
                )}
            </div>
        
            {/* Courses Section */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '20px',
                border: '1px solid #1a1a1a',
                borderRadius: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                backgroundImage: 'radial-gradient(circle, rgba(42,37,34,1) 70%, rgba(48,48,48,1) 100%)',
                width: '100%',
                maxWidth: '800px'
            }}>
                <h2 style={{ margin: '0', fontSize: '24px', color: '#ffffff', marginBottom: '20px' }}>Courses</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px',
                    width: '100%'
                }}>
                    {courses.map((course) => (
                        <Card 
                            key={course.id}
                            card={[course.id, course.title, course.creator, course.tags]}
                            onClick={() => handleCourseClick(course.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
export default UserPanel;

