import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { X, ChevronLeft, ChevronRight, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
const STORY_DURATION = 5000; // 5 seconds per story

export default function StoryViewerPage() {
  const { userId } = useParams();
  const { token, user: currentUser } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const progressInterval = useRef(null);
  
  useEffect(() => {
    if (token && userId) {
      loadUserStories();
    }
  }, [userId, token]);
  
  useEffect(() => {
    if (stories.length > 0 && !isPaused) {
      startProgress();
      
      // Preload next story image for faster loading
      if (currentIndex < stories.length - 1) {
        const nextStory = stories[currentIndex + 1];
        if (nextStory.media_type === 'image') {
          const img = new Image();
          const url = nextStory.media_url.startsWith('http') 
            ? nextStory.media_url 
            : `${process.env.REACT_APP_BACKEND_URL}${nextStory.media_url}`;
          img.src = url;
        }
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [currentIndex, stories, isPaused]);
  
  const loadUserStories = async () => {
    try {
      const response = await axios.get(`${API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter stories for the specific user
      const userStories = response.data.filter(story => story.user_id === userId);
      if (userStories.length === 0) {
        navigate('/');
        return;
      }
      setStories(userStories);
    } catch (error) {
      console.error('Failed to load stories:', error);
      navigate('/');
    }
  };
  
  const startProgress = () => {
    setProgress(0);
    
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressInterval.current) clearInterval(progressInterval.current);
    
    // Progress bar animation
    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        clearInterval(progressInterval.current);
        setProgress(100);
      } else {
        setProgress(newProgress);
      }
    }, 50);
    
    // Auto advance to next story
    timerRef.current = setTimeout(() => {
      handleNext();
    }, STORY_DURATION);
  };
  
  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // End of stories, go back home
      navigate('/');
    }
  };
  
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };
  
  const handleClose = () => {
    navigate('/');
  };

  const handleDeleteStory = async () => {
    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    try {
      await axios.delete(`${API_URL}/stories/${currentStory.story_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Story deleted successfully');
      setShowDeleteDialog(false);
      
      // Remove story from list
      const updatedStories = stories.filter((_, index) => index !== currentIndex);
      
      if (updatedStories.length === 0) {
        // No more stories, go home
        navigate('/');
      } else {
        // Update stories and adjust index
        setStories(updatedStories);
        if (currentIndex >= updatedStories.length) {
          setCurrentIndex(updatedStories.length - 1);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete story');
    }
  };
  
  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Tap on left third = previous, tap on right two-thirds = next
    if (x < width / 3) {
      handlePrevious();
    } else {
      handleNext();
    }
  };
  
  if (stories.length === 0) return null;
  
  const currentStory = stories[currentIndex];
  const storyUser = currentStory?.user;
  
  return (
    <div 
      className="h-screen w-screen bg-black relative overflow-hidden"
      data-testid="story-viewer"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 z-50 flex gap-1 p-2">
        {stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-50 flex items-center justify-between px-4 mt-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-white">
            <AvatarImage src={storyUser?.profile_picture} />
            <AvatarFallback>{storyUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold text-sm">{storyUser?.username}</p>
            <p className="text-white/70 text-xs">
              {new Date(currentStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        <Button
          data-testid="close-story-button"
          onClick={handleClose}
          variant="ghost"
          size="icon"
          className="rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
      
      {/* Story content */}
      <div 
        className="h-full w-full flex items-center justify-center"
        onClick={handleTap}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full flex items-center justify-center"
          >
            {currentStory.media_type === 'image' ? (
              <img
                src={currentStory.media_url.startsWith('http') ? currentStory.media_url : `${process.env.REACT_APP_BACKEND_URL}${currentStory.media_url}`}
                alt="Story"
                className="max-h-full max-w-full object-contain"
                loading="eager"
                decoding="async"
              />
            ) : (
              <video
                src={currentStory.media_url.startsWith('http') ? currentStory.media_url : `${process.env.REACT_APP_BACKEND_URL}${currentStory.media_url}`}
                autoPlay
                className="max-h-full max-w-full object-contain"
                onEnded={handleNext}
                preload="auto"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation hints (desktop) */}
      <div className="absolute inset-y-0 left-0 w-1/3 cursor-pointer" onClick={handlePrevious} />
      <div className="absolute inset-y-0 right-0 w-2/3 cursor-pointer" onClick={handleNext} />
      
      {/* Story counter */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-black/60 px-4 py-2 rounded-full">
          <p className="text-white text-sm font-mono">
            {currentIndex + 1} / {stories.length}
          </p>
        </div>
      </div>
    </div>
  );
}