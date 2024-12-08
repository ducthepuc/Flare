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
                const response = await fetch('http://localhost:5000/api/me', {
                    headers: {
                        'Authorization': localStorage.getItem('userToken'),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setUsername(data.username);
                setPfp(data.profilePicture);
                setBio(data.bio || '');
                setUserRole(data.role);
            } catch (error) {
                console.error('Error fetching user data:', error);
                if (error.message.includes('401')) {
                    navigate('/login');
                }
            }
        };

        const fetchInProgressCourses = async () => {
            try {
                const response = await fetch('/api/in-progress-courses', {
                    headers: {
                        'Authorization': localStorage.getItem('userToken')
                    }
                });
                const data = await response.json();
                setInProgressCourses(data.courses);
            } catch (error) {
                console.error('Error fetching in-progress courses:', error);
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

    const ProfilePopup = () => (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute right-0 top-16 bg-gray-800 rounded-lg shadow-lg p-4 w-80"
            style={{ zIndex: 1000 }}
        >
            <div className="text-center">
                <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto mb-4"
                />
                <h3 className="text-xl mb-2">{username}</h3>
                {isEditing ? (
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-gray-700 rounded p-2 mb-2"
                    />
                ) : (
                    <p className="text-gray-400 mb-4">{bio || 'No bio set'}</p>
                )}
                <button
                    onClick={() => isEditing ? handleBioUpdate() : setIsEditing(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                >
                    {isEditing ? 'Save' : 'Edit Bio'}
                </button>
                <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded"
                >
                    Logout
                </button>
            </div>
        </motion.div>
    );

    return (
        <div className="p-5">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl">Welcome, {username}</h3>
                <div className="relative">
                    <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-10 h-10 rounded-full cursor-pointer"
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
            {userRole === 'contributor' && (
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
