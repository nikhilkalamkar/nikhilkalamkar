import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

const MainLayout = () => {
  const location = useLocation();
  const isMessagesPage = location.pathname.includes('/messages');

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className={`${isMessagesPage ? 'md:ml-0' : 'md:ml-64'} min-h-screen pb-16 md:pb-0`}>
        <Outlet />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
};

export default MainLayout;
