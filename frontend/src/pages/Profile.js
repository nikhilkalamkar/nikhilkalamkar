import { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { LogOut, User, Mail, Camera, Upload, Ban, ShieldOff, Bell, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';
import { Switch } from '@/components/ui/switch';

export default function Profile() {
  const { user, logout, token, login } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [screenshotNotifications, setScreenshotNotifications] = useState(user?.screenshot_notifications ?? true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (showBlocked) {
      fetchBlockedUsers();
    }
  }, [showBlocked]);

  useEffect(() => {
    setScreenshotNotifications(user?.screenshot_notifications ?? true);
  }, [user]);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await axios.get(`${API}/friends/blocked`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBlockedUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch blocked users:', error);
    }
  };

  const unblockUser = async (userId) => {
    try {
      await axios.post(`${API}/friends/unblock/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User unblocked');
      fetchBlockedUsers();
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result;
        
        try {
          const response = await axios.put(
            `${API}/users/me/avatar`,
            { avatar_url: base64Image },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          login(token, response.data.user);
          toast.success('Profile photo updated!');
        } catch (error) {
          console.error('Avatar upload error:', error);
          toast.error(error.response?.data?.detail || 'Failed to update profile photo');
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to process image');
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-md mx-auto" data-testid="profile-page">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="photo-input"
      />
      
      <div className="px-6 pt-6 pb-8 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
        <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Profile
        </h1>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="inline-block relative mb-4">
            <button
              onClick={handlePhotoClick}
              disabled={uploading}
              className="relative group cursor-pointer"
              data-testid="change-photo-btn"
            >
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
                alt={user?.username}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg transition-opacity group-hover:opacity-70"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent" />
                ) : (
                  <Camera size={32} className="text-white drop-shadow-lg" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F5E618] rounded-full border-4 border-white flex items-center justify-center">
                <Upload size={14} className="text-black" />
              </div>
            </button>
          </div>
          <h2 className="text-2xl font-bold mb-1">{user?.username}</h2>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500 mt-2">Click photo to change</p>
        </motion.div>
      </div>

      <div className="px-6 py-6 space-y-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-[#F5E618]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Username</p>
            <p className="font-bold">{user?.username}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
            <Mail size={24} className="text-[#EC4899]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-bold">{user?.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <User size={24} className="text-[#8B5CF6]" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Friends</p>
            <p className="font-bold">{user?.friends?.length || 0} friends</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setShowBlocked(!showBlocked)}
            className="w-full flex items-center justify-between"
            data-testid="blocked-users-toggle"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Ban size={24} className="text-red-500" />
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500">Blocked Users</p>
                <p className="font-bold">{user?.blocked_users?.length || 0} blocked</p>
              </div>
            </div>
            <span className="text-gray-400">{showBlocked ? '▼' : '▶'}</span>
          </button>

          {showBlocked && (
            <div className="mt-4 space-y-2">
              {blockedUsers.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">No blocked users</p>
              ) : (
                blockedUsers.map((blocked) => (
                  <div key={blocked.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img
                        src={blocked.avatar_url || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
                        alt={blocked.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold">{blocked.username}</p>
                        <p className="text-xs text-gray-500">{blocked.email}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => unblockUser(blocked.user_id)}
                      className="bg-gray-200 text-gray-700 rounded-full h-9 px-4 text-sm font-bold hover:bg-gray-300"
                      data-testid={`unblock-btn-${blocked.user_id}`}
                    >
                      <ShieldOff size={16} className="mr-1" />
                      Unblock
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <Button
          onClick={logout}
          className="w-full bg-red-500 text-white font-bold rounded-full h-14 mt-6 hover:bg-red-600"
          data-testid="logout-btn"
        >
          <LogOut className="mr-2" size={20} />
          Logout
        </Button>
      </div>
    </div>
  );
}