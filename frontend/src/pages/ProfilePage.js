import { useState, useRef, useEffect } from 'react';
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
  const [friends, setFriends] = useState([]);
  const [friendsCount, setFriendsCount] = useState(0);
  const fileInputRef = useRef(null);

  // Fetch fresh user data when page loads
  useEffect(() => {
    fetchUser();
    fetchFriends();
  }, []);

  // Update bio when user data changes
  useEffect(() => {
    if (user?.bio) {
      setBio(user.bio);
    }
  }, [user]);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
      setFriendsCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };
  
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
                <div className="relative">
                  <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                    <AvatarImage 
                      src={
                        previewUrl || 
                        (user?.profile_picture?.startsWith('http') 
                          ? user.profile_picture 
                          : `${process.env.REACT_APP_BACKEND_URL}${user?.profile_picture}`)
                      } 
                    />
                    <AvatarFallback className="text-2xl">
                      {user?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        size="icon"
                        className="absolute -bottom-2 -right-2 rounded-full h-10 w-10"
                        data-testid="change-photo-button"
                      >
                        <Camera className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                </div>
                
                <div className="text-center w-full">
                  <h2 className="text-2xl font-heading font-bold">{user?.username}</h2>
                  <div className="flex justify-center gap-4 mt-2 mb-1">
                    <div className="text-center">
                      <p className="text-xl font-bold">{friendsCount}</p>
                      <p className="text-xs text-muted-foreground">Friends</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{user?.email}</p>
                </div>
                
                <div className="w-full pt-4">
                  {isEditing ? (
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Write something about yourself..."
                      className="min-h-20 resize-none"
                      maxLength={150}
                      data-testid="bio-input"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground text-center">
                      {user?.bio || 'No bio yet'}
                    </p>
                  )}
                  {isEditing && (
                    <p className="text-xs text-muted-foreground text-right mt-1">
                      {bio.length}/150
                    </p>
                  )}
                </div>
                
                {!isEditing ? (
                  <Button
                    onClick={() => {
                      setIsEditing(true);
                      setBio(user?.bio || '');
                    }}
                    variant="outline"
                    className="w-full rounded-full"
                    data-testid="edit-profile-button"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2 w-full">
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      className="flex-1 rounded-full"
                      disabled={saving}
                      data-testid="cancel-edit-button"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      className="flex-1 rounded-full"
                      disabled={saving}
                      data-testid="save-profile-button"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
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

          {friendsCount > 0 && (
            <Card className="glass-effect border-border/50">
              <CardHeader>
                <CardTitle className="font-heading">Friends ({friendsCount})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {friends.slice(0, 5).map((friend) => (
                    <div key={friend.user_id} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage 
                          src={
                            friend.profile_picture?.startsWith('http') 
                              ? friend.profile_picture 
                              : `${process.env.REACT_APP_BACKEND_URL}${friend.profile_picture}`
                          } 
                        />
                        <AvatarFallback>
                          {friend.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{friend.username}</p>
                        {friend.bio && (
                          <p className="text-xs text-muted-foreground truncate">{friend.bio}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {friendsCount > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-2">
                      +{friendsCount - 5} more friends
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
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