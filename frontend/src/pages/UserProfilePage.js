import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MessageCircle, UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FloatingNav from '@/components/FloatingNav';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function UserProfilePage() {
  const { userId } = useParams();
  const { user: currentUser, token } = useAuthStore();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);

  useEffect(() => {
    fetchUserProfile();
    checkFriendStatus();
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserProfile(response.data);
    } catch (error) {
      toast.error('Failed to load user profile');
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const checkFriendStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const friendIds = response.data.map(f => f.user_id);
      setIsFriend(friendIds.includes(userId));
    } catch (error) {
      console.error('Failed to check friend status');
    }
  };

  const handleMessage = async () => {
    try {
      // Get or create chat
      const response = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Find existing chat with this user
      const existingChat = response.data.find(chat => 
        chat.participants.includes(userId)
      );

      if (existingChat) {
        navigate(`/chat/${existingChat.chat_id}`);
      } else {
        toast.info('Send a friend request first to start chatting');
      }
    } catch (error) {
      toast.error('Failed to open chat');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-10 glass-effect border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(-1)}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-heading font-bold">{userProfile?.username}</h1>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          <Card className="glass-effect border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                  <AvatarImage 
                    src={
                      userProfile?.profile_picture?.startsWith('http') 
                        ? userProfile.profile_picture 
                        : `${process.env.REACT_APP_BACKEND_URL}${userProfile?.profile_picture}`
                    } 
                  />
                  <AvatarFallback className="text-2xl">
                    {userProfile?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="text-center w-full">
                  <h2 className="text-2xl font-heading font-bold">{userProfile?.username}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{userProfile?.email}</p>
                </div>
                
                <div className="w-full pt-4">
                  <p className="text-sm text-muted-foreground text-center">
                    {userProfile?.bio || 'No bio yet'}
                  </p>
                </div>

                <div className="flex gap-2 w-full">
                  {isFriend && (
                    <Button
                      onClick={handleMessage}
                      className="flex-1 rounded-full"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                  )}
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
                  <span className="capitalize">{userProfile?.online_status || 'offline'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{new Date(userProfile?.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <FloatingNav />
    </div>
  );
}
