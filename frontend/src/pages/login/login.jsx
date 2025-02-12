import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const history = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

      const response = await axios.post('http://localhost:5000/api/uauth:def', {
        email,
        password,
      });

      if (response.data.result) {
        localStorage.setItem('userToken', response.data.data.token);
        history('/homepage');
        console.log(response.data.reason)
      } else {
        setError(response.data.reason);
      }
  setLoading(false);
//     try {
//     } catch (err) {
//
//       setError('Something went wrong, please try again.');
//     } finally {
//       setLoading(false);
//     }
  };

  return (
    <>
      <h1 style={{color: '#FF6B35', fontSize: '2rem', textAlign: 'center' }}>Login to Flare</h1>
      <p style={{ textAlign: 'center' }}>
        Don't have an account yet? <br/>
        <Link to="/register" style={{ color: '#FF6B35', textDecoration: 'none' }}>Register!</Link>
      </p>
      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        <form onSubmit={handleLogin}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>e-mail</label>
          <motion.input
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            type="email"
            id="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="/:"
            style={{
                color: 'rgb(240, 240, 240)',
                backgroundColor: '#333333',
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          />
          <br />
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>password</label>
          <motion.input
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            type="password"
            id="password"
            name="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="/:"
            style={{
                color: 'rgb(240, 240, 240)',
                backgroundColor: '#333333',
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              border: '1px solid #555',
              borderRadius: '4px',
            }}
          />
          <br />
          {error && <p style={{ color: 'red', fontSize: '0.9rem' }}>{error}</p>}
          <br />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.9 }}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#FF6B35',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </motion.button>
        </form>
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.9 }}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#7289da',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem',
            marginTop: '15px',
          }}
        >
          Login with Discord
        </motion.button>
      </div>
    </>
  );
}

export default Login;
