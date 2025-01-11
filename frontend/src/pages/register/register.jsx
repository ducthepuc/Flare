import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/user_make:def', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <h1 style={{ color: '#FF6B35', textAlign: 'center', fontSize: '2rem', margin: '20px 0' }}>Register to Flare</h1>
      <p style={{ textAlign: 'center', marginBottom: '20px' }}>
        Already have an account? <br/>
        <Link style={{ color: '#FF6B35', textDecoration: 'none' }} to="/login">Login!</Link>
      </p>
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
        {error && (
          <div style={{ 
            color: '#ff4444', 
            backgroundColor: '#ffebee', 
            padding: '10px', 
            borderRadius: '4px', 
            marginBottom: '15px' 
          }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label htmlFor="name" style={{ fontWeight: 'bold' }}>Username</label>
          <motion.input
            style={{
              color: 'rgb(240, 240, 240)',
              backgroundColor: '#333333',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #555',
              fontSize: '1rem',
            }}
            whileFocus={{ scale: 1.02, borderColor: '#FF6B35' }}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="email" style={{ fontWeight: 'bold' }}>Email</label>
          <motion.input
            style={{
              color: 'rgb(240, 240, 240)',
              backgroundColor: '#333333',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #555',
              fontSize: '1rem',
            }}
            whileFocus={{ scale: 1.02, borderColor: '#FF6B35' }}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="password" style={{ fontWeight: 'bold' }}>Password</label>
          <motion.input
            style={{
              color: 'rgb(240, 240, 240)',
              backgroundColor: '#333333',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #555',
              fontSize: '1rem',
            }}
            whileFocus={{ scale: 1.02, borderColor: '#FF6B35' }}
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          
          <label htmlFor="confirm_password" style={{ fontWeight: 'bold' }}>Confirm Password</label>
          <motion.input
            style={{
              color: 'rgb(240, 240, 240)',
              backgroundColor: '#333333',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #555',
              fontSize: '1rem',
            }}
            whileFocus={{ scale: 1.02, borderColor: '#FF6B35' }}
            type="password"
            id="confirm_password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
          />
          
          <motion.button
            type="submit"
            style={{
              backgroundColor: '#FF6B35',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              marginTop: '10px',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Register
          </motion.button>
        </form>
      </div>
    </>
  );
}

export default RegisterPage;
