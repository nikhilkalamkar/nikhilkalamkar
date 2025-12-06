import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Image, TrendingUp, Flag, Settings, LogOut } from 'lucide-react';
import { Button } from '../ui/button';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'posts', icon: Image, label: 'Posts' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
    { id: 'moderation', icon: Flag, label: 'Moderation' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('ishukart_admin');
    navigate('/admin/login');
  };

  return (
    <div className="w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
          IshukArt
        </h1>
        <p className="text-xs text-gray-500 mt-1">Admin Panel</p>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 text-base transition-colors hover:bg-gray-100 dark:hover:bg-gray-900 ${
              activeTab === item.id ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 font-semibold text-purple-600 dark:text-purple-400' : ''
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3">
          <Settings className="w-5 h-5" />
          Settings
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
