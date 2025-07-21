import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const { username, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData);
    } catch (err) {
      let msg = 'Login failed. Please try again.';
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
        <p className="text-center text-gray-600 mb-8">Welcome Back</p>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={onSubmit}>
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
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-gray-600 mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login; 