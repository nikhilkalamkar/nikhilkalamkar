import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Video, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const MobileNav = () => {
  const location = useLocation();
  const { currentUser } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 z-50">
      <div className="flex justify-around items-center h-14">
        <Link to="/" className="flex items-center justify-center w-full h-full">
          <Home className={`w-6 h-6 ${isActive('/') ? 'fill-current' : ''}`} />
        </Link>
        <Link to="/search" className="flex items-center justify-center w-full h-full">
          <Search className="w-6 h-6" />
        </Link>
        <Link to="/reels" className="flex items-center justify-center w-full h-full">
          <Video className={`w-6 h-6 ${isActive('/reels') ? 'fill-current' : ''}`} />
        </Link>
        <Link to="/explore" className="flex items-center justify-center w-full h-full">
          <PlusSquare className="w-6 h-6" />
        </Link>
        <Link to={`/profile/${currentUser?.username}`} className="flex items-center justify-center w-full h-full">
          <Avatar className="w-7 h-7">
            <AvatarImage src={currentUser?.avatar} />
            <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </div>
  );
};

export default MobileNav;
