import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Volume2, VolumeX, Music } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { posts as mockPosts } from '../mock/mockData';
import { useToast } from '../hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Reels = () => {
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [likedReels, setLikedReels] = useState({});
  const [savedReels, setSavedReels] = useState({});
  const containerRef = useRef(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Convert posts to reels (mock data)
  const reels = mockPosts.map((post, index) => ({
    ...post,
    videoUrl: post.images[0], // Using images as placeholder for videos
    views: Math.floor(Math.random() * 100000) + 10000,
    audioName: 'Original Audio'
  }));

  const currentReel = reels[currentReelIndex];

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const itemHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / itemHeight);
      
      if (newIndex !== currentReelIndex && newIndex >= 0 && newIndex < reels.length) {
        setCurrentReelIndex(newIndex);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [currentReelIndex, reels.length]);

  const handleLike = () => {
    const reelId = currentReel.id;
    setLikedReels(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
    toast({
      title: likedReels[reelId] ? 'Unliked' : 'Liked',
      description: likedReels[reelId] ? 'Removed from liked reels' : 'Added to liked reels',
    });
  };

  const handleComment = () => {
    navigate(`/post/${currentReel.id}`);
  };

  const handleShare = () => {
    toast({
      title: 'Share',
      description: 'Share functionality coming soon!',
    });
  };

  const handleSave = () => {
    const reelId = currentReel.id;
    setSavedReels(prev => ({
      ...prev,
      [reelId]: !prev[reelId]
    }));
    toast({
      title: savedReels[reelId] ? 'Unsaved' : 'Saved',
      description: savedReels[reelId] ? 'Removed from saved' : 'Saved to your collection',
    });
  };

  return (
    <div ref={containerRef} className="h-screen overflow-y-scroll snap-y snap-mandatory bg-black">
      {reels.map((reel, index) => (
        <div key={reel.id} className="h-screen snap-start relative flex items-center justify-center">
          {/* Video/Image */}
          <img
            src={reel.videoUrl}
            alt="Reel"
            className="h-full w-full object-contain"
          />

          {/* Overlay Content */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/50" />

          {/* User Info */}
          <div className="absolute bottom-20 left-4 right-20 text-white">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-8 h-8 border-2 border-white cursor-pointer" onClick={() => navigate(`/profile/${reel.user.username}`)}>
                <AvatarImage src={reel.user.avatar} />
                <AvatarFallback>{reel.user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-semibold cursor-pointer" onClick={() => navigate(`/profile/${reel.user.username}`)}>{reel.user.username}</span>
              <Button size="sm" variant="outline" className="h-6 px-3 text-xs border-white text-white hover:bg-white hover:text-black">
                Follow
              </Button>
            </div>
            <p className="text-sm mb-2">{reel.caption}</p>
            <div className="flex items-center gap-2 text-xs">
              <Music className="w-3 h-3" />
              <span>{reel.audioName}</span>
            </div>
          </div>

          {/* Actions - Right Side */}
          <div className="absolute bottom-20 right-4 flex flex-col gap-6 text-white">
            <button onClick={handleLike} className="flex flex-col items-center gap-1">
              <Heart className={`w-7 h-7 ${likedReels[reel.id] ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-xs">{reel.likes + (likedReels[reel.id] ? 1 : 0)}</span>
            </button>
            
            <button onClick={handleComment} className="flex flex-col items-center gap-1">
              <MessageCircle className="w-7 h-7" />
              <span className="text-xs">{reel.comments}</span>
            </button>
            
            <button onClick={handleShare} className="flex flex-col items-center gap-1">
              <Send className="w-7 h-7" />
              <span className="text-xs">Share</span>
            </button>
            
            <button onClick={handleSave} className="flex flex-col items-center gap-1">
              <Bookmark className={`w-7 h-7 ${savedReels[reel.id] ? 'fill-white' : ''}`} />
            </button>
            
            <button onClick={() => navigate(`/profile/${reel.user.username}`)} className="w-10 h-10 border-2 border-white rounded-full overflow-hidden">
              <img src={reel.user.avatar} alt="Profile" className="w-full h-full object-cover" />
            </button>
          </div>

          {/* Volume Control */}
          <button
            onClick={() => setMuted(!muted)}
            className="absolute bottom-20 right-16 text-white"
          >
            {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </button>

          {/* More Options */}
          <button className="absolute top-4 right-4 text-white">
            <MoreHorizontal className="w-6 h-6" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default Reels;
