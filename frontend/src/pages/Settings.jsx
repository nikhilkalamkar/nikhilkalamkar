import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { ChevronRight, User, Lock, Bell, Eye, HelpCircle, Info, LogOut } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SettingItem = ({ icon: Icon, title, subtitle, onClick, hasArrow = true, rightContent }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
    >
      <Icon className="w-5 h-5" />
      <div className="flex-1 text-left">
        <p className="font-medium">{title}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      {rightContent || (hasArrow && <ChevronRight className="w-5 h-5 text-gray-400" />)}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {/* Account Settings */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 px-4">ACCOUNT</h2>
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <SettingItem
            icon={User}
            title="Edit Profile"
            subtitle="Name, username, bio"
            onClick={() => navigate('/accounts/edit')}
          />
          <SettingItem
            icon={Lock}
            title="Change Password"
            onClick={() => console.log('Change password')}
          />
        </div>
      </div>

      {/* Preferences */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 px-4">PREFERENCES</h2>
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <SettingItem
            icon={theme === 'dark' ? Eye : Eye}
            title="Dark Mode"
            subtitle={theme === 'dark' ? 'On' : 'Off'}
            hasArrow={false}
            rightContent={
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            }
          />
          <SettingItem
            icon={Bell}
            title="Notifications"
            subtitle="Manage your notification settings"
            onClick={() => console.log('Notifications')}
          />
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 px-4">PRIVACY & SECURITY</h2>
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <SettingItem
            icon={Eye}
            title="Privacy"
            subtitle="Account privacy, blocked accounts"
            onClick={() => console.log('Privacy')}
          />
          <SettingItem
            icon={Lock}
            title="Security"
            subtitle="Password, two-factor authentication"
            onClick={() => console.log('Security')}
          />
        </div>
      </div>

      {/* Help & Support */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 mb-3 px-4">HELP & SUPPORT</h2>
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <SettingItem
            icon={HelpCircle}
            title="Help Center"
            onClick={() => console.log('Help')}
          />
          <SettingItem
            icon={Info}
            title="About"
            onClick={() => console.log('About')}
          />
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden mb-8">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-500"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Log Out</span>
        </button>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 space-y-2">
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Press</a>
          <a href="#" className="hover:underline">API</a>
          <a href="#" className="hover:underline">Jobs</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
        <p>© 2025 INSTAGRAM CLONE</p>
      </div>
    </div>
  );
};

export default Settings;
