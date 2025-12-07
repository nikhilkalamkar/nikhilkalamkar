import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, LogOut, UserX, Sparkles, Edit2, Camera, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import FloatingNav from '@/components/FloatingNav';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function ProfilePage() {
  const { user, logout, token, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (selectedImage) {
        formData.append('profile_picture', selectedImage);
      }

      await axios.put(`${API_URL}/users/me`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refresh user data
      await fetchUser();
      
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setSelectedImage(null);
      setPreviewUrl(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setBio(user?.bio || '');
    setSelectedImage(null);
    setPreviewUrl(null);
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              data-testid="back-button"
              onClick={() => navigate('/')}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-heading font-bold">Profile</h1>
          </div>
        </header>
        
        <div className="p-4 space-y-6">
          <Card className="glass-effect border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  <AvatarImage src={user?.profile_picture} />
                  <AvatarFallback className="text-2xl">
                    {user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center">
                  <h2 className="text-2xl font-heading font-bold">{user?.username}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                
                <div className="w-full pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {user?.bio || 'No bio yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="font-heading">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize">{user?.online_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{new Date(user?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="font-heading">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                data-testid="my-stories-button"
                onClick={() => navigate('/my-stories')}
                variant="outline"
                className="w-full justify-start"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                My Stories & Promotions
              </Button>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="font-heading">Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                data-testid="blocked-users-button"
                onClick={() => navigate('/blocked-users')}
                variant="outline"
                className="w-full justify-start"
              >
                <UserX className="w-5 h-5 mr-2" />
                Blocked Users
              </Button>
            </CardContent>
          </Card>
          
          <Button
            data-testid="logout-button"
            onClick={handleLogout}
            variant="destructive"
            className="w-full rounded-full h-12 font-bold uppercase tracking-wide"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      <FloatingNav />
    </div>
  );
}