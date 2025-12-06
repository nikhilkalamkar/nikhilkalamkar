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
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Home = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [stories, setStories] = useState([]);
  const [suggestions, setSuggestions] = useState(mockUsers.slice(0, 5));
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [loadingStories, setLoadingStories] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLike = (postId, isLiked) => {
    // Update post like state - will be replaced with API call
    console.log('Like post:', postId, isLiked);
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
      const response = await axios.get(`${BACKEND_URL}/api/stories/all`, {
        withCredentials: true
      });
      setStories(response.data.stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
      // Fallback to mock data if API fails
      setStories(mockStories);
    } finally {
      setLoadingStories(false);
    }
  };

  useEffect(() => {
    fetchStories();
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
