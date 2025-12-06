import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Post from '../components/Feed/Post';
import Stories from '../components/Feed/Stories';
import { posts as mockPosts, stories as mockStories, users as mockUsers } from '../mock/mockData';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useToast } from '../hooks/use-toast';
import CreateStoryModal from '../components/Create/CreateStoryModal';
import LiveCard from '../components/Live/LiveCard';
import axios from 'axios';
import { addNotification } from '../utils/notifications';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [suggestions, setSuggestions] = useState(mockUsers.slice(0, 5));
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [loadingStories, setLoadingStories] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLike = async (postId, isLiked) => {
    try {
      // Try to call backend API to like/unlike post
      const response = await axios.post(`${BACKEND_URL}/api/posts/${postId}/like`, {}, {
        withCredentials: true
      });
      
      // Update local state with response
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            // Create notification if liking (not unliking)
            if (response.data.action === 'liked' && post.user.id !== currentUser?.user_id && post.user.id !== currentUser?.id) {
              addNotification('like', {
                username: currentUser?.username || 'Someone',
                avatar: currentUser?.avatar || '',
                postId: postId
              });
            }
            return { ...post, likes: response.data.likes, isLiked: response.data.is_liked };
          }
          return post;
        })
      );
    } catch (error) {
      console.log('Backend like failed, using local storage for post:', postId, error.response?.status);
      
      // If post doesn't exist in backend (404), just update local state
      // This handles posts created in localStorage that aren't in DB yet
      if (error.response?.status === 404) {
        // Update UI and localStorage for localStorage posts
        setPosts(prevPosts => {
          const updatedPosts = prevPosts.map(post => {
            if (post.id === postId) {
              const currentLikes = post.likes || 0;
              return {
                ...post,
                isLiked: isLiked,
                likes: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
              };
            }
            return post;
          });
          
          // Save updated posts to localStorage
          const localPosts = JSON.parse(localStorage.getItem('ishukart_posts') || '[]');
          const updatedLocalPosts = localPosts.map(post => {
            if (post.id === postId) {
              const currentLikes = post.likes || 0;
              return {
                ...post,
                isLiked: isLiked,
                likes: isLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1)
              };
            }
            return post;
          });
          localStorage.setItem('ishukart_posts', JSON.stringify(updatedLocalPosts));
          
          return updatedPosts;
        });
      } else {
        // Only show error for non-404 errors
        toast({
          title: 'Error',
          description: 'Could not update like status',
          variant: 'destructive'
        });
      }
    }
  };

  const handleSave = (postId, isSaved) => {
    // Update post save state - will be replaced with API call
    console.log('Save post:', postId, isSaved);
  };

  const handleStoryClick = (story) => {
    navigate(`/stories/${story.user.username}`);
  };

  const fetchStories = async () => {
    try {
      setLoadingStories(true);
      
      // Try to get stories from backend
      try {
        const response = await axios.get(`${BACKEND_URL}/api/stories/all`, {
          withCredentials: true
        });
        
        // Merge backend stories with localStorage stories
        const localStories = JSON.parse(localStorage.getItem('ishukart_stories') || '[]');
        const allStories = [...localStories, ...response.data.stories];
        setStories(allStories);
      } catch (apiError) {
        console.log('API failed, using localStorage and mock:', apiError);
        // Fallback to localStorage + mock data
        const localStories = JSON.parse(localStorage.getItem('ishukart_stories') || '[]');
        const allStories = [...localStories, ...mockStories];
        setStories(allStories);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories(mockStories);
    } finally {
      setLoadingStories(false);
    }
  };

  const fetchPosts = async () => {
    try {
      // Try to get posts from backend
      const response = await axios.get(`${BACKEND_URL}/api/posts/all`, {
        withCredentials: true
      });
      
      // Merge backend posts with localStorage posts
      const localPosts = JSON.parse(localStorage.getItem('ishukart_posts') || '[]');
      const allPosts = [...response.data.posts, ...localPosts, ...mockPosts];
      setPosts(allPosts);
    } catch (apiError) {
      console.log('API failed for posts, using localStorage and mock:', apiError);
      // Fallback to localStorage + mock data
      const localPosts = JSON.parse(localStorage.getItem('ishukart_posts') || '[]');
      const allPosts = [...localPosts, ...mockPosts];
      setPosts(allPosts);
    }
  };

  useEffect(() => {
    fetchStories();
    fetchPosts();
    
    // Load active live streams
    const loadLiveStreams = () => {
      const activeLives = JSON.parse(localStorage.getItem('ishukart_live_streams') || '[]');
      const currentLives = activeLives.filter(live => live.isActive);
      setLiveStreams(currentLives);
    };
    
    loadLiveStreams();
    
    // Refresh live streams every 30 seconds
    const liveInterval = setInterval(loadLiveStreams, 30000);
    
    return () => clearInterval(liveInterval);
  }, []);

  const handleFollow = (userId) => {
    setSuggestions(prev =>
      prev.map(user => {
        if (user.id === userId) {
          const newFollowState = !user.isFollowing;
          toast({
            title: newFollowState ? 'Following' : 'Unfollowed',
            description: newFollowState ? `You are now following ${user.username}` : `Unfollowed ${user.username}`,
          });
          return { ...user, isFollowing: newFollowState };
        }
        return user;
      })
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-[630px] mx-auto">
        {/* Stories */}
        <Stories
          stories={stories}
          onStoryClick={handleStoryClick}
          currentUser={currentUser}
          onAddStory={() => setShowCreateStoryModal(true)}
        />

        {/* Live Streams */}
        {liveStreams.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-800 py-4 px-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Live Now</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {liveStreams.map((liveSession) => (
                <LiveCard key={liveSession.id} liveSession={liveSession} />
              ))}
            </div>
          </div>
        )}

        {/* Posts Feed */}
        <div className="mt-4">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onLike={handleLike}
              onSave={handleSave}
            />
          ))}
        </div>
      </div>

      {/* Suggestions Sidebar - Desktop Only */}
      <div className="hidden xl:block fixed right-0 top-0 w-80 h-screen p-8 overflow-y-auto">
        {/* Current User */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${currentUser?.username}`)}>
            <Avatar className="w-14 h-14">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{currentUser?.username}</p>
              <p className="text-xs text-gray-500">{currentUser?.fullName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 font-semibold text-xs"
            onClick={() => navigate('/login')}
          >
            Switch
          </Button>
        </div>

        {/* Suggestions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-500">Suggested for you</span>
            <Button variant="ghost" size="sm" className="text-xs">
              See All
            </Button>
          </div>

          <div className="space-y-3">
            {suggestions.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${user.username}`)}>
                  <Avatar className="w-11 h-11">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{user.username}</p>
                    <p className="text-xs text-gray-500">Popular</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-500 font-semibold text-xs"
                  onClick={() => handleFollow(user.id)}
                >
                  {user.isFollowing ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-gray-400 space-y-2">
          <div className="flex flex-wrap gap-2">
            <a href="#" className="hover:underline">About</a>
            <span>•</span>
            <a href="#" className="hover:underline">Help</a>
            <span>•</span>
            <a href="#" className="hover:underline">Press</a>
            <span>•</span>
            <a href="#" className="hover:underline">API</a>
            <span>•</span>
            <a href="#" className="hover:underline">Jobs</a>
            <span>•</span>
            <a href="#" className="hover:underline">Privacy</a>
            <span>•</span>
            <a href="#" className="hover:underline">Terms</a>
          </div>
          <p>© 2025 ISHUKART</p>
        </div>
      </div>

      {/* Create Story Modal */}
      {showCreateStoryModal && (
        <CreateStoryModal
          onClose={() => setShowCreateStoryModal(false)}
          onStoryCreated={() => {
            setShowCreateStoryModal(false);
            // Refresh stories
            fetchStories();
            toast({
              title: 'Story posted!',
              description: 'Your story is now live',
            });
          }}
        />
      )}
    </div>
  );
};

export default Home;
