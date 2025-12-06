import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Grid, Bookmark, UserPlus, Tag } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { users as mockUsers, posts as mockPosts } from '../mock/mockData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Load follow data from localStorage
        const followData = JSON.parse(localStorage.getItem('ishukart_follow_data') || '{}');
        const currentUserId = currentUser?.username || currentUser?.id;
        
        // Find user profile
        let userProfile;
        if (username === currentUser?.username) {
          // For current user, use their logged-in data
          userProfile = currentUser;
        } else {
          // For other users, try to fetch from backend first
          try {
            const response = await axios.get(`${BACKEND_URL}/api/users/${username}`, {
              withCredentials: true
            });
            userProfile = response.data.user;
          } catch (apiError) {
            console.log('API failed, using mock data:', apiError);
            // Fallback to mock data
            userProfile = mockUsers.find(u => u.username === username);
          }
        }
        
        if (userProfile) {
          // Update follower/following counts from localStorage (temporary until backend integration)
          const userId = userProfile.username || userProfile.id;
          const followersCount = (followData.followers && followData.followers[userId]) ? followData.followers[userId].length : (userProfile.followersCount || 0);
          const followingCount = (followData.following && followData.following[userId]) ? followData.following[userId].length : (userProfile.followingCount || 0);
          
          setProfile({
            ...userProfile,
            followersCount,
            followingCount
          });
          
          // Check if current user is following this profile
          const isCurrentlyFollowing = followData.following && 
                                       followData.following[currentUserId] && 
                                       followData.following[currentUserId].includes(userId);
          setIsFollowing(isCurrentlyFollowing || false);
        }

        // Get user's posts (including localStorage posts)
        const localPosts = JSON.parse(localStorage.getItem('ishukart_posts') || '[]');
        const allPosts = [...localPosts, ...mockPosts];
        const posts = allPosts.filter(p => p.user.username === username);
        setUserPosts(posts);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [username, currentUser]);

  const isOwnProfile = username === currentUser?.username;

  const handleFollow = () => {
    const newFollowState = !isFollowing;
    setIsFollowing(newFollowState);
    
    // Get or initialize followers/following data
    const followData = JSON.parse(localStorage.getItem('ishukart_follow_data') || '{}');
    
    // Initialize arrays if they don't exist
    if (!followData.followers) followData.followers = {};
    if (!followData.following) followData.following = {};
    
    const currentUserId = currentUser?.username || currentUser?.id;
    const targetUserId = profile?.username || profile?.id;
    
    if (newFollowState) {
      // Add to following list (current user follows target user)
      if (!followData.following[currentUserId]) {
        followData.following[currentUserId] = [];
      }
      if (!followData.following[currentUserId].includes(targetUserId)) {
        followData.following[currentUserId].push(targetUserId);
      }
      
      // Add to followers list (target user gains a follower)
      if (!followData.followers[targetUserId]) {
        followData.followers[targetUserId] = [];
      }
      if (!followData.followers[targetUserId].includes(currentUserId)) {
        followData.followers[targetUserId].push(currentUserId);
      }
    } else {
      // Remove from following
      if (followData.following[currentUserId]) {
        followData.following[currentUserId] = followData.following[currentUserId].filter(id => id !== targetUserId);
      }
      
      // Remove from followers
      if (followData.followers[targetUserId]) {
        followData.followers[targetUserId] = followData.followers[targetUserId].filter(id => id !== currentUserId);
      }
    }
    
    // Save to localStorage
    localStorage.setItem('ishukart_follow_data', JSON.stringify(followData));
    
    // Update profile with new counts
    const followersCount = (followData.followers[targetUserId] || []).length;
    const followingCount = (followData.following[targetUserId] || []).length;
    
    setProfile(prev => ({
      ...prev,
      followersCount: followersCount,
      followingCount: followingCount
    }));

    toast({
      title: newFollowState ? 'Following' : 'Unfollowed',
      description: newFollowState ? `You are now following ${profile.username}` : `Unfollowed ${profile.username}`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-12">
        {/* Profile Picture */}
        <div className="flex justify-center md:justify-start">
          <Avatar className="w-32 h-32 md:w-40 md:h-40">
            <AvatarImage src={profile.avatar} />
            <AvatarFallback className="text-4xl">{profile.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          {/* Username and Actions */}
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <h2 className="text-xl font-light">{profile.username}</h2>
            {profile.isVerified && (
              <svg className="w-5 h-5 text-blue-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            )}
            
            {isOwnProfile ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => navigate('/settings')}>
                  Edit profile
                </Button>
                <Button variant="secondary" size="sm">
                  View archive
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className={isFollowing ? 'bg-gray-200 text-black hover:bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => navigate('/messages', { state: { openChatWith: profile } })}
                >
                  Message
                </Button>
                <Button variant="ghost" size="icon">
                  <UserPlus className="w-5 h-5" />
                </Button>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mb-6">
            <div>
              <span className="font-semibold">{profile.postsCount}</span> posts
            </div>
            <button className="hover:opacity-70">
              <span className="font-semibold">{profile.followersCount}</span> followers
            </button>
            <button className="hover:opacity-70">
              <span className="font-semibold">{profile.followingCount}</span> following
            </button>
          </div>

          {/* Bio */}
          <div>
            <p className="font-semibold">{profile.fullName}</p>
            {profile.bio && <p className="whitespace-pre-wrap mt-1">{profile.bio}</p>}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-900 dark:text-blue-500 hover:underline">
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full border-t border-gray-200 dark:border-gray-800 bg-transparent h-auto p-0">
          <TabsTrigger
            value="posts"
            className="flex-1 gap-2 data-[state=active]:border-t data-[state=active]:border-black dark:data-[state=active]:border-white -mt-px"
          >
            <Grid className="w-4 h-4" />
            POSTS
          </TabsTrigger>
          {isOwnProfile && (
            <TabsTrigger
              value="saved"
              className="flex-1 gap-2 data-[state=active]:border-t data-[state=active]:border-black dark:data-[state=active]:border-white -mt-px"
            >
              <Bookmark className="w-4 h-4" />
              SAVED
            </TabsTrigger>
          )}
          <TabsTrigger
            value="tagged"
            className="flex-1 gap-2 data-[state=active]:border-t data-[state=active]:border-black dark:data-[state=active]:border-white -mt-px"
          >
            <Tag className="w-4 h-4" />
            TAGGED
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          {userPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {userPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-gray-100 dark:bg-gray-900 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <img
                    src={post.images[0]}
                    alt="Post"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="border-2 border-black dark:border-white rounded-full p-6 mb-4">
                <Grid className="w-12 h-12" />
              </div>
              <p className="text-2xl font-light mb-1">No Posts Yet</p>
            </div>
          )}
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="saved" className="mt-4">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="border-2 border-black dark:border-white rounded-full p-6 mb-4">
                <Bookmark className="w-12 h-12" />
              </div>
              <p className="text-2xl font-light mb-1">Save</p>
              <p className="text-sm text-gray-500">Save photos and videos that you want to see again.</p>
            </div>
          </TabsContent>
        )}

        <TabsContent value="tagged" className="mt-4">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="border-2 border-black dark:border-white rounded-full p-6 mb-4">
              <Tag className="w-12 h-12" />
            </div>
            <p className="text-2xl font-light mb-1">No Photos</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
