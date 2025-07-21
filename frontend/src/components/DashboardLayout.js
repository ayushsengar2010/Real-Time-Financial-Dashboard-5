import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FloatingAIAssistant from './FloatingAIAssistant';

const DashboardLayout = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-8">
          <Outlet />
        </main>
      </div>
      <FloatingAIAssistant />
    </div>
  );
};

export default DashboardLayout; 