import { useContext, useState, useRef } from 'react';
import { AuthContext, API } from '@/App';
import { Button } from '@/components/ui/button';
import { LogOut, User, Mail, Camera, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

export default function Profile() {
  const { user, logout, token, login } = useContext(AuthContext);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
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
            `${API}/users/me/avatar?avatar_url=${encodeURIComponent(base64Image)}`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          login(token, response.data.user);
          toast.success('Profile photo updated!');
        } catch (error) {
          toast.error('Failed to update profile photo');
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
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
              alt={user?.username}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F5E618] rounded-full border-4 border-white" />
          </div>
          <h2 className="text-2xl font-bold mb-1">{user?.username}</h2>
          <p className="text-gray-600">{user?.email}</p>
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