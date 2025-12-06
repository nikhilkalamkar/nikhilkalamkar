import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Compass, Video, MessageCircle, Heart, PlusSquare, User, Menu, Moon, Sun, LogOut, Settings, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import CreatePostModal from '../Create/CreatePostModal';
import CreateStoryModal from '../Create/CreateStoryModal';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/search' },
    { icon: Compass, label: 'Explore', path: '/explore' },
    { icon: Video, label: 'Reels', path: '/reels' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Heart, label: 'Notifications', path: '/notifications' },
    { icon: PlusSquare, label: 'Create', action: () => setShowCreateModal(true) },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <div className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black z-50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            IshukArt
          </h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-4">
          {menuItems.map((item) => (
            item.path ? (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-4 px-6 py-3 text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  isActive(item.path) ? 'font-bold' : 'font-normal'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive(item.path) ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-4 px-6 py-3 text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-900 w-full text-left"
              >
                <item.icon className="w-6 h-6" />
                <span>{item.label}</span>
              </button>
            )
          ))}

          {/* Profile Link */}
          <Link
            to={`/profile/${currentUser?.username}`}
            className={`flex items-center gap-4 px-6 py-3 text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-900 ${
              location.pathname.includes('/profile') ? 'font-bold' : 'font-normal'
            }`}
          >
            <Avatar className="w-6 h-6">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span>Profile</span>
          </Link>
        </nav>

        {/* Bottom Menu */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-4 px-2">
                <Menu className="w-6 h-6" />
                <span>More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'light' ? <Moon className="w-4 h-4 mr-2" /> : <Sun className="w-4 h-4 mr-2" />}
                {theme === 'light' ? 'Dark mode' : 'Light mode'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/saved')}>
                <Bookmark className="w-4 h-4 mr-2" />
                Saved
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Create Post Modal - will be implemented */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Create New Post</h2>
            <p className="text-gray-600 dark:text-gray-400">Post creation feature coming soon!</p>
            <Button onClick={() => setShowCreateModal(false)} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
