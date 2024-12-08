import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'learner'
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
        console.error(data.error);
      }
    } catch (error) {
      console.error('Registration failed:', error);
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
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label htmlFor="username" style={{ fontWeight: 'bold' }}>Username</label>
          <motion.input
            style={{
                color: 'rgb(240, 240, 240)',
                backgroundColor: '#333333',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #555',
              fontSize: '1rem',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            type="text"
            id="username"
            value={formData.name}
            onChange={handleChange}
            name="name"
            required
            placeholder="/:"
          />
          <br/>
          <label htmlFor="email" style={{ fontWeight: 'bold' }}>E-mail</label>
          <motion.input
            style={{
                color: 'rgb(240, 240, 240)',
                backgroundColor: '#333333',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #555',
              fontSize: '1rem',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            name="email"
            required
            placeholder="/:"
          />
          <br/>
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            type="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            name="password"
            required
            placeholder="/:"
          />
          <br/>
          <motion.input
            style={{
                color: 'rgb(240, 240, 240)',
                backgroundColor: '#333333',
              padding: '10px',
              borderRadius: '4px',
              border: '1px solid #555',
              fontSize: '1rem',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            type="password"
            id="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            name="confirm_password"
            required
            placeholder="Repeat /:"
          />
          <br/>
          <div className="mb-4">
            <label className="block mb-2">I want to:</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full p-2 bg-gray-700 rounded"
            >
              <option value="learner">Learn from courses</option>
              <option value="contributor">Create and contribute courses</option>
            </select>
          </div>
          <motion.button
            type="submit"
            style={{
              padding: '12px 20px',
              borderRadius: '4px',
              backgroundColor: '#FF6B35',
              color: 'white',
              fontSize: '1rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              alignSelf: 'center',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
          >
            CREATE ➢
          </motion.button>
        </form>
      </div>
    </>
  );
}

export default RegisterPage;
