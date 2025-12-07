import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function StoryViewPage() {
  const { storyId } = useParams();
  const { token } = useAuthStore();
  const [story, setStory] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (token && storyId) {
      loadStory();
    }
  }, [storyId, token]);
  
  const loadStory = async () => {
    try {
      const response = await axios.get(`${API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const foundStory = response.data.find(s => s.story_id === storyId);
      setStory(foundStory);
    } catch (error) {
      console.error('Failed to load story:', error);
    }
  };
  
  if (!story) return null;
  
  return (
    <div className="h-screen w-screen bg-black relative" data-testid="story-view">
      <Button
        data-testid="close-story-button"
        onClick={() => navigate('/')}
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50 rounded-full bg-black/50 text-white"
      >
        <X className="w-6 h-6" />
      </Button>
      
      <div className="h-full w-full flex items-center justify-center">
        {story.media_type === 'image' ? (
          <img
            src={story.media_url}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            src={story.media_url}
            controls
            autoPlay
            className="max-h-full max-w-full"
          />
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary" />
          <div>
            <p className="text-white font-semibold">{story.user?.username}</p>
            <p className="text-white/70 text-sm">{new Date(story.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}