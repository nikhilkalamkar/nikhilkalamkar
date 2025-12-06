import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Heart, MessageCircle, Send, Users, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const LiveStream = () => {
  const { liveId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [liveSession, setLiveSession] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [likes, setLikes] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    // Load live session
    const activeLives = JSON.parse(localStorage.getItem('ishukart_live_streams') || '[]');
    const session = activeLives.find(live => live.id === liveId);
    
    if (!session || !session.isActive) {
      toast({
        title: 'Live ended',
        description: 'This live stream has ended',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    setLiveSession(session);
    setComments(session.comments || []);
    setIsOwner(session.userId === (currentUser?.id || currentUser?.user_id));
    
    // Simulate viewer count
    const baseViewers = Math.floor(Math.random() * 50) + 10;
    setViewerCount(baseViewers);

    // Simulate viewer count changes
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(10, prev + change);
      });
    }, 5000);

    // Simulate likes
    const likesInterval = setInterval(() => {
      setLikes(prev => prev + Math.floor(Math.random() * 3));
    }, 2000);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(likesInterval);
    };
  }, [liveId, currentUser, navigate, toast]);

  useEffect(() => {
    // Scroll to bottom when new comment
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: Date.now(),
      username: currentUser?.username,
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    setComments(prev => [...prev, comment]);
    
    // Update localStorage
    const activeLives = JSON.parse(localStorage.getItem('ishukart_live_streams') || '[]');
    const updatedLives = activeLives.map(live => 
      live.id === liveId 
        ? { ...live, comments: [...(live.comments || []), comment] }
        : live
    );
    localStorage.setItem('ishukart_live_streams', JSON.stringify(updatedLives));

    setNewComment('');
  };

  const handleEndLive = () => {
    const activeLives = JSON.parse(localStorage.getItem('ishukart_live_streams') || '[]');
    const updatedLives = activeLives.map(live => 
      live.id === liveId ? { ...live, isActive: false, endedAt: new Date().toISOString() } : live
    );
    localStorage.setItem('ishukart_live_streams', JSON.stringify(updatedLives));

    toast({
      title: 'Live ended',
      description: 'Your live stream has ended'
    });

    navigate('/');
  };

  if (!liveSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Live Video Area */}
      <div className="flex-1 relative bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        {/* Simulated video feed */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-32 h-32 bg-white/10 rounded-full mb-4 mx-auto flex items-center justify-center">
              <Avatar className="w-24 h-24">
                <AvatarImage src={liveSession.avatar} />
                <AvatarFallback>{liveSession.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
            <p className="text-xl font-semibold">{liveSession.username}</p>
            <p className="text-sm opacity-75 mt-2">{liveSession.title}</p>
          </div>
        </div>

        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-white">
                <AvatarImage src={liveSession.avatar} />
                <AvatarFallback>{liveSession.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold">{liveSession.username}</p>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">LIVE</span>
                  <span className="text-white text-xs flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {viewerCount}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <X className="w-6 h-6 text-white" />
            </Button>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="absolute right-4 bottom-32 flex flex-col gap-4">
          <button 
            className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
            onClick={() => setLikes(prev => prev + 1)}
          >
            <Heart className="w-6 h-6" fill={likes > 0 ? 'white' : 'none'} />
          </button>
          {likes > 0 && (
            <span className="text-white text-sm font-semibold text-center">{likes}</span>
          )}
          <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>

        {/* Comments Overlay */}
        <div className="absolute left-4 bottom-24 right-20 max-h-64 overflow-y-auto space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full max-w-xs">
              <p className="text-white text-sm">
                <span className="font-semibold">{comment.username}</span>{' '}
                <span className="opacity-90">{comment.text}</span>
              </p>
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="bg-black/90 backdrop-blur-sm p-4 border-t border-gray-800">
        <form onSubmit={handleSendComment} className="flex items-center gap-3">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Button 
            type="submit"
            size="icon"
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
        
        {isOwner && (
          <Button
            onClick={handleEndLive}
            variant="destructive"
            className="w-full mt-3"
          >
            End Live Stream
          </Button>
        )}
      </div>
    </div>
  );
};

export default LiveStream;
