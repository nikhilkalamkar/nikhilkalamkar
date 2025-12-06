import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight, Pause, Play, MoreHorizontal } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { stories as mockStories } from '../mock/mockData';

const StoryViewer = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Find stories for the user
  const userStories = mockStories.filter(s => s.user.username === username);
  const currentStory = userStories[currentStoryIndex];
  const currentItem = currentStory?.items[currentItemIndex];

  useEffect(() => {
    if (!currentItem || isPaused) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update every 50ms
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentItemIndex, isPaused]);

  const handleNext = () => {
    if (currentItemIndex < currentStory.items.length - 1) {
      setCurrentItemIndex(prev => prev + 1);
      setProgress(0);
    } else if (currentStoryIndex < userStories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setCurrentItemIndex(0);
      setProgress(0);
    } else {
      navigate('/');
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(prev => prev - 1);
      setProgress(0);
    } else if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setCurrentItemIndex(0);
      setProgress(0);
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const storyDate = new Date(date);
    const diffInSeconds = Math.floor((now - storyDate) / 1000);

    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  if (!currentStory) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-white">Story not found</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 right-4 z-50 text-white hover:opacity-70"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Previous story area */}
      {(currentStoryIndex > 0 || currentItemIndex > 0) && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 z-40 text-white hover:opacity-70"
        >
          <ChevronLeft className="w-12 h-12" />
        </button>
      )}

      {/* Story container */}
      <div className="relative max-w-md w-full h-[600px] md:h-[700px]">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-2">
          {currentStory.items.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-gray-500/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all"
                style={{
                  width: index < currentItemIndex ? '100%' : index === currentItemIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story header */}
        <div className="absolute top-4 left-0 right-0 z-30 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-white">
              <AvatarImage src={currentStory.user.avatar} />
              <AvatarFallback>{currentStory.user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-white font-semibold text-sm">{currentStory.user.username}</span>
            <span className="text-white/70 text-xs">{formatTimeAgo(currentItem.createdAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="text-white hover:opacity-70"
            >
              {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
            </button>
            <button className="text-white hover:opacity-70">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story content */}
        <div className="relative w-full h-full rounded-lg overflow-hidden">
          {currentItem.type === 'image' ? (
            <img
              src={currentItem.url}
              alt="Story"
              className="w-full h-full object-cover"
              onClick={() => setIsPaused(!isPaused)}
            />
          ) : (
            <video
              src={currentItem.url}
              className="w-full h-full object-cover"
              autoPlay
              muted={isPaused}
              onClick={() => setIsPaused(!isPaused)}
            />
          )}
        </div>
      </div>

      {/* Next story area */}
      {(currentItemIndex < currentStory.items.length - 1 || currentStoryIndex < userStories.length - 1) && (
        <button
          onClick={handleNext}
          className="absolute right-4 z-40 text-white hover:opacity-70"
        >
          <ChevronRight className="w-12 h-12" />
        </button>
      )}
    </div>
  );
};

export default StoryViewer;
