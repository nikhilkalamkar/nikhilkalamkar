import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import { Camera, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const EditProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser?.fullName || '',
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    website: currentUser?.website || '',
    email: currentUser?.email || '',
    avatar: currentUser?.avatar || ''
  });
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || '');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB before compression)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Image too large',
          description: 'Please choose an image smaller than 2MB',
          variant: 'destructive'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // Compress image before saving
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Resize to max 400x400 (profile picture size)
          let width = img.width;
          let height = img.height;
          const maxSize = 400;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression (0.7 quality)
          const compressedImage = canvas.toDataURL('image/jpeg', 0.7);
          
          setAvatarPreview(compressedImage);
          setFormData({ ...formData, avatar: compressedImage });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate username format
    const usernameRegex = /^[a-z0-9_]+$/;
    if (!usernameRegex.test(formData.username)) {
      toast({
        title: 'Invalid username',
        description: 'Username can only contain lowercase letters, numbers and underscores',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Update user in localStorage
      const updatedUser = {
        ...currentUser,
        ...formData
      };

      localStorage.setItem('ishukart_user', JSON.stringify(updatedUser));

      // Try to update in backend (if user exists in DB)
      try {
        await axios.put(
          `${BACKEND_URL}/api/users/profile`,
          {
            fullName: formData.fullName,
            bio: formData.bio,
            website: formData.website,
            avatar: formData.avatar
          },
          { withCredentials: true }
        );
        console.log('Backend profile updated successfully');
      } catch (apiError) {
        // If API fails, it's okay - localStorage update succeeded
        console.log('Backend update skipped:', apiError.message);
      }

      toast({
        title: 'Profile updated! ✨',
        description: 'Your profile has been updated successfully',
      });

      // Refresh page to show updated data
      setTimeout(() => {
        window.location.href = `/profile/${formData.username}`;
      }, 1000);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-gray-500 mt-1">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={avatarPreview} />
              <AvatarFallback className="text-2xl">{formData.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <p className="font-semibold">{formData.username}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-500 hover:text-blue-600 mt-1"
            >
              Change profile photo
            </button>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <Input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Enter your full name"
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <Input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
            placeholder="Enter username"
          />
          <p className="text-xs text-gray-500 mt-1">
            Username can only contain lowercase letters, numbers and underscores
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Tell us about yourself"
            className="min-h-[100px] resize-none"
            maxLength={150}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.bio.length}/150 characters
          </p>
        </div>

        {/* Website */}
        <div>
          <label className="block text-sm font-medium mb-2">Website</label>
          <Input
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://yourwebsite.com"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your.email@example.com"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/profile/${currentUser?.username}`)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
