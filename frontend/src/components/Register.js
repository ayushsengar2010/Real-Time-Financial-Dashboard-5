import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as api from '../api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { full_name, email, username, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.register(formData);
      if (!response || !response.data) {
        throw new Error('No response from server');
      }
      navigate('/login');
    } catch (err) {
      let msg = 'Registration failed. Please try again.';
      if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen auth-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg z-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Financial Dashboard</h2>
        <p className="text-center text-gray-600 mb-8">Create Your Account</p>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={onSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Full Name"
              name="full_name"
              value={full_name}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={email}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500"
              required
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={username}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500"
              required
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={password}
              onChange={onChange}
              className="w-full px-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register; 