import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import DefaultPfp from '../assets/default_pfp.jpg';
import { Input } from 'reactstrap';
import Card from '../../components/Card/Card';
import { FaStar } from 'react-icons/fa';

const formatStarCount = (count) => {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count;
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
    const [topUsers, setTopUsers] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [filteredCards, setFilteredCards] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [startedCourses, setStartedCourses] = useState([]);
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [profilePicture, setPfp] = useState(DefaultPfp);
    const [popularTags, setPopularTags] = useState([]);
    const [selectedTag, setSelectedTag] = useState(null);

    const logout = () => {
        localStorage.removeItem("userToken");
        setUsername('');
        setIsLoading(true);
        navigate('/login');
    };

    const getCourseProgress = async (courseId) => {
        const token = localStorage.getItem('userToken');
        if (!token) {
            console.log('No token found, returning 0 progress');
            return 0;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/course_progress/${encodeURIComponent(courseId)}`, {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.progress;
            } else {
                const errorData = await response.json();
                console.error('Error fetching course progress:', errorData.error);
                return 0;
            }
        } catch (error) {
            console.error('Error fetching course progress:', error);
            return 0;
        }
    };

    const getCourseNames = async () => {
        try {

            const response = await fetch('http://localhost:5000/api/get_course_objects', {
                method: 'GET',
                headers: {
                    'Authorization': localStorage.getItem("userToken"),
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.response) {
                    const courseNamePairs = data.result;
                    let index = 0;
                    const courses = courseNamePairs.map(courseObj => {
                        index += 1;
                        return {
                            id: index-1,
                            courseId: courseObj.id,
                            title: courseObj.title,
                            creator: courseObj.creator || 'Unknown',
                            tags: courseObj.tags || []
                        };
                    });
                    const coursesWithProgress = await Promise.all(courses.map(async (course) => {
                        const progress = await getCourseProgress(course.courseId);
                        return {
                            ...course,
                            progress: progress
                        };
                    }));

                    const started = coursesWithProgress.filter(course => course.progress > 0);
                    const notStarted = coursesWithProgress.filter(course => !course.progress);

                    setStartedCourses(started);
                    setCourses(notStarted);
                } else {
                    console.error('Failed to fetch course objects:', data.error);
                }
            } else {
                console.error('Failed to fetch course names:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching course names:', error);
        }
    };

    useEffect(() => {
        const fetchTopUsers = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/users/top');
                if (response.ok) {
                    const data = await response.json();
                    setTopUsers(data.users);
                }
            } catch (error) {
                console.error('Error fetching top users:', error);
            }
        };

        fetchTopUsers();
        getCourseNames();
    }, []);

    useEffect(() => {
        console.log('Courses:', courses);
    }, [courses]);

    useEffect(() => {
        const filtered = topUsers.filter(user =>
            user.username.toLowerCase().includes(searchInput.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [searchInput, topUsers]);

    useEffect(() => {
        const fetchPopularTags = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/tags/popular');
                if (response.ok) {
                    const data = await response.json();
                    setPopularTags(data.tags);
                }
            } catch (error) {
                console.error('Error fetching popular tags:', error);
            }
        };

        fetchPopularTags();
    }, []);

    const searchCourses = async (query, tag = null) => {
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (tag) params.append('tag', tag);

            const response = await fetch(`http://localhost:5000/api/search?${params}`);
            if (response.ok) {
                const data = await response.json();
                const coursesWithProgress = await Promise.all(data.courses.map(async (course) => {
                    const progress = await getCourseProgress(course.id);
                    return {
                        ...course,
                        courseId: course.id,
                        progress
                    };
                }));

                const started = coursesWithProgress.filter(course => course.progress > 0);
                const notStarted = coursesWithProgress.filter(course => !course.progress);

                setStartedCourses(started);
                setCourses(notStarted);
            }
        } catch (error) {
            console.error('Error searching courses:', error);
        }
    };

    useEffect(() => {
        if (selectedTag) {
            searchCourses('', selectedTag);
        } else if (searchInput) {
            searchCourses(searchInput);
        } else {
            getCourseNames();
        }
    }, [searchInput, selectedTag]);

    const handleSearch = (e) => {
        setSearchInput(e.target.value);
    };

    const handleCourseClick = (courseId) => {
        navigate(`/viewer/${courseId}`);
    };

    const handleTagClick = (tag) => {
        setSelectedTag(tag === selectedTag ? null : tag);
        setSearchInput('');
    };

    useEffect(() => {
        const fetchUserData = async () => {
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

                if (!response.ok) {
                    throw new Error('Failed to fetch user details');
                }

                const userData = await response.json();
                setUsername(userData.username);
                setPfp(userData.profilePicture);
                setIsLoading(false);

            } catch (error) {
                console.error("Error fetching user data:", error);
                localStorage.removeItem("userToken");
                navigate('/login');
            }
        };

        fetchUserData();
        getCourseNames();
    }, [navigate]);

    return (
        <div style={{ padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div>
                    <h3>Welcome, {username || 'Guest'}</h3>
                    <div>
                        <img
                            src={profilePicture}
                            alt="Profile"
                            style={{ width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer' }}
                            onClick={() => navigate('/panel')}
                        />
                        <br />
                        <button
                            onClick={logout}
                            style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ margin: '20px 0' }}>
                <h2 style={{ marginBottom: '15px' }}>Popular Categories</h2>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    justifyContent: 'center'
                }}>
                    {popularTags.map((tag) => (
                        <motion.button
                            key={tag.name}
                            onClick={() => handleTagClick(tag.name)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: selectedTag === tag.name ? '#FF7F4F' : '#FF6B35',
                                color: 'black',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '1rem'
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {tag.name}
                            <span style={{
                                backgroundColor: 'rgba(0,0,0,0.1)',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '0.8rem'
                            }}>
                                {tag.count}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            <div style={{ margin: '20px 0' }}>
                <h2 style={{ marginBottom: '15px' }}>Top Course Creators</h2>
                <div style={{
                    display: 'flex',
                    overflowX: 'auto',
                    gap: '15px',
                    padding: '10px 0'
                }}>
                    {filteredUsers.map((user, index) => (
                        <motion.div
                            key={user.username}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                minWidth: '120px',
                                padding: '10px',
                                backgroundColor: '#FF6B35',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                            whileHover={{ scale: 1.05 }}
                            onClick={() => navigate(`/profile/${user.username}`)}
                        >
                            <div style={{
                                backgroundColor: index < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][index] : '#666',
                                color: 'black',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '5px',
                                fontSize: '0.8em',
                                fontWeight: 'bold'
                            }}>
                                {index + 1}
                            </div>
                            <span style={{
                                color: 'black',
                                fontWeight: 'bold',
                                marginBottom: '5px',
                                textAlign: 'center'
                            }}>
                                {user.username}
                            </span>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                color: '#333'
                            }}>
                                <FaStar color="#FFD700" />
                                <span>{formatStarCount(user.stars)}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div style={{ margin: '20px 0' }}>
                <motion.input
                    type="text"
                    placeholder="Search courses and users..."
                    value={searchInput}
                    onChange={handleSearch}
                    style={{ color: 'rgb(240, 240, 240)', backgroundColor: '#333333',padding: '10px', width: '100%', maxWidth: '600px', margin: '0 auto', display: 'block', border: '1px solid #555' }}
                    whileHover={{ scale: 1.05, border: '1px solid #FF7F4F' }}
                />
            </div>

            <div style={{ margin: '20px 0' }}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/creator')}
                    style={{ padding: '10px 20px', cursor: 'pointer' }}
                >
                    Create Course
                </motion.button>
            </div>

            {startedCourses.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                    <h2 style={{ marginBottom: '20px' }}>Continue Learning</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                        {startedCourses.map((course) => (
                            <Card
                                key={course.courseId}
                                card={[course.courseId, course.title, course.creator, course.tags]}
                                onClick={() => handleCourseClick(course.courseId)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <h2 style={{ marginBottom: '20px' }}>All Courses</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                {courses.map((course) => (
                    <Card
                        key={course.courseId}
                        card={[course.courseId, course.title, course.creator, course.tags]}
                        onClick={() => handleCourseClick(course.courseId)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomePage;
