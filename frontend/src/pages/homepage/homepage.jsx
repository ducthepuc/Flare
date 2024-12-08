import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import DefaultPfp from '../assets/default_pfp.jpg';
import { Input } from 'reactstrap';

const Card = ({ children, onClick }) => {
    return (
        <motion.div 
            style={{ backgroundColor: '#FF6B35', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', cursor: 'pointer' }}
            whileHover={{ scale: 1.05, backgroundColor: '#FF7F4F'}}
            whileTap={{ scale: 0.95, backgroundColor: 'rgb(240, 240, 240)' }}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};

export const fetchUsername = async (navigate, setUsername, setIsLoading, setPfp) => {
    const user_token = localStorage.getItem("userToken");

    if (!user_token) {
        navigate('/login');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': user_token
            }
        });

        const responseData = await response.text();

        if (!response.ok) {
            throw new Error(`Failed to fetch user details: ${responseData}`);
        }

        const userData = JSON.parse(responseData);
        setUsername(userData.username);
        setPfp(userData.profilePicture);
        setIsLoading(false);

    } catch (error) {
        console.error("Error:", error);
        localStorage.removeItem("userToken");
        navigate('/login');
    }
};

const HomePage = () => {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [filteredCards, setFilteredCards] = useState([]);
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [profilePicture, setPfp] = useState(DefaultPfp);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [inProgressCourses, setInProgressCourses] = useState([]);
    const [bio, setBio] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isUploadingPfp, setIsUploadingPfp] = useState(false);

    const logout = () => {
        localStorage.removeItem("userToken");
        setUsername('');
        setIsLoading(true);
        navigate('/login');
    };

    const getCourseNames = async () => {
        try {
            const response = await fetch('/api/get_course_names');
            if (response.ok) {
                const data = await response.json();
                const courseNames = data.course_names;
                const courses = courseNames.map((courseName, index) => ({
                    id: index + 1,
                    title: courseName
                }));
                setCourses(courses);
            } else {
                console.error('Failed to fetch course names:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching course names:', error);
        }
    };

    useEffect(() => {
        getCourseNames();
    }, []);

    useEffect(() => {
        const filtered = courses.filter((card) => 
            card.title.toLowerCase().includes(searchInput.toLowerCase())
        );
        setFilteredCards(filtered);
    }, [searchInput, courses]);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:5000/api/me', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('User data:', data);

                if (!data.result) {
                    throw new Error(data.reason || 'Failed to fetch user data');
                }

                setUsername(data.username);
                setPfp(data.profilePicture);
                setBio(data.bio || '');
                setUserRole(data.role);
                console.log('User role:', data.role);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const fetchInProgressCourses = async () => {
            try {
                const token = localStorage.getItem('userToken');
                if (!token) return;

                const response = await fetch('http://localhost:5000/api/in-progress-courses', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setInProgressCourses(data.courses || []);
            } catch (error) {
                console.error('Error fetching in-progress courses:', error);
                setInProgressCourses([]);
            }
        };

        fetchUserData();
        fetchInProgressCourses();
    }, [navigate]);

    const handleSearch = (e) => {
        setSearchInput(e.target.value);
    };

    const handleCourseClick = (courseTitle) => {
        navigate(`/viewer/${courseTitle}`);
    };

    const handleBioUpdate = async () => {
        try {
            const token = localStorage.getItem('userToken');
            const response = await fetch('http://localhost:5000/api/v1/configure', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({ bio })
            });

            if (response.ok) {
                setIsEditing(false);
            } else {
                throw new Error('Failed to update bio');
            }
        } catch (error) {
            console.error('Error updating bio:', error);
            alert('Failed to update bio');
        }
    };

    const handlePfpUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setIsUploadingPfp(true);
            const formData = new FormData();
            formData.append('pfp', file);

            const response = await fetch('http://localhost:5000/api/change_pfp', {
                method: 'POST',
                headers: {
                    'Authorization': localStorage.getItem('userToken')
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload profile picture');
            }

            // Force reload the profile picture by adding a timestamp
            const newPfpUrl = `http://localhost:5000/cdn/pfp/${username}?t=${Date.now()}`;
            setPfp(newPfpUrl);
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Failed to upload profile picture');
        } finally {
            setIsUploadingPfp(false);
        }
    };

    const ProfilePopup = () => (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute right-0 top-16 bg-gray-800 rounded-lg shadow-lg p-4 w-80 z-50"
        >
            <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4 group">
                    <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <label className="cursor-pointer p-2">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePfpUpload}
                                disabled={isUploadingPfp}
                            />
                            <svg 
                                className="w-6 h-6 text-white" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                />
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                            </svg>
                        </label>
                    </div>
                </div>
                {isUploadingPfp && (
                    <div className="text-sm text-blue-400 mb-2">
                        Uploading...
                    </div>
                )}
                <h3 className="text-xl font-semibold mb-2 text-white">{username}</h3>
                {isEditing ? (
                    <div className="mb-4">
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full bg-gray-700 text-white rounded p-2 mb-2 resize-none"
                            rows="3"
                            placeholder="Write something about yourself..."
                        />
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={handleBioUpdate}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Save
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-300 mb-4">{bio || 'No bio set'}</p>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-2 w-full"
                        >
                            Edit Bio
                        </button>
                    </>
                )}
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 w-full"
                >
                    Logout
                </button>
            </div>
        </motion.div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">Welcome, {username}</h1>
                <div className="relative">
                    <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-12 h-12 rounded-full cursor-pointer object-cover"
                        onClick={() => setShowProfilePopup(!showProfilePopup)}
                    />
                    <AnimatePresence>
                        {showProfilePopup && <ProfilePopup />}
                    </AnimatePresence>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <motion.input
                    type="text"
                    placeholder="Search courses..."
                    value={searchInput}
                    onChange={handleSearch}
                    className="w-full max-w-2xl mx-auto block p-2 bg-gray-700 rounded"
                />
            </div>

            {/* Create Course Button - only show for contributors */}
            {(userRole === 'contributor' || userRole === 'admin') && (
                <div className="mb-8">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/creator')}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Create Course
                    </motion.button>
                </div>
            )}

            {/* In Progress Courses */}
            {inProgressCourses && inProgressCourses.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl mb-4">Continue Learning</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {inProgressCourses.map(course => (
                            <Card
                                key={course.title}
                                onClick={() => handleCourseClick(course.title)}
                            >
                                <div className="p-4">
                                    <h4>{course.title}</h4>
                                    <div className="mt-2 bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-full rounded-full"
                                            style={{ width: `${(course.current_step / course.total_steps) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* All Courses */}
            <div>
                <h2 className="text-xl mb-4">All Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredCards.map(card => (
                        <Card
                            key={card.id}
                            onClick={() => handleCourseClick(card.title)}
                        >
                            <div className="p-4">
                                <h4>{card.title}</h4>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default HomePage;
