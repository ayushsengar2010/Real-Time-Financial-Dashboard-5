import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="text-center py-8">
        <div className="w-24 h-24 rounded-full bg-gray-700 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl font-bold">{user?.username?.charAt(0).toUpperCase() || 'A'}</span>
        </div>
        <h2 className="text-xl font-bold">{user?.username || 'ayush'}</h2>
      </div>
      <nav className="flex-1 px-4">
        <ul>
          <li>
            <NavLink to="/dashboard" end className={({ isActive }) => `block py-2 px-4 rounded-lg transition duration-200 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/portfolios" className={({ isActive }) => `block py-2 px-4 rounded-lg transition duration-200 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
              Portfolios
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/learn" className={({ isActive }) => `block py-2 px-4 rounded-lg transition duration-200 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
              Learn
            </NavLink>
          </li>
          <li>
            <NavLink to="/dashboard/most-active" className={({ isActive }) => `block py-2 px-4 rounded-lg transition duration-200 ${isActive ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
              Most Active
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="p-4">
        <button
          onClick={logout}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 