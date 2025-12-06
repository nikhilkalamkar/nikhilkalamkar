import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Users } from 'lucide-react';

const LiveCard = ({ liveSession }) => {
  const navigate = useNavigate();

  const getElapsedTime = () => {
    const start = new Date(liveSession.startedAt);
    const now = new Date();
    const diffMs = now - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div 
      onClick={() => navigate(`/live/${liveSession.id}`)}
      className="flex-shrink-0 w-32 cursor-pointer group"
    >
      <div className="relative mb-2">
        <div className="w-32 h-48 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <Avatar className="w-20 h-20 border-2 border-white">
              <AvatarImage src={liveSession.avatar} />
              <AvatarFallback>{liveSession.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          
          {/* Live badge */}
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
            LIVE
          </div>
          
          {/* Viewer count */}
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Users className="w-3 h-3" />
            {liveSession.viewerCount || Math.floor(Math.random() * 100) + 10}
          </div>
          
          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
            {getElapsedTime()}
          </div>
        </div>
      </div>
      
      <div className="px-1">
        <p className="text-sm font-semibold truncate">{liveSession.username}</p>
        <p className="text-xs text-gray-500 truncate">{liveSession.title}</p>
      </div>
    </div>
  );
};

export default LiveCard;
