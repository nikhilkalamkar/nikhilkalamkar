import React, { useState, useEffect } from 'react';
import { X, Video, Phone, Mic, MicOff, VideoOff, Volume2, VolumeX, Maximize2, PhoneOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const CallModal = ({ type, user, onClose }) => {
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, active, ended
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Simulate call flow
    const connectTimeout = setTimeout(() => {
      setCallStatus('ringing');
    }, 1000);

    const answerTimeout = setTimeout(() => {
      setCallStatus('active');
    }, 3000);

    return () => {
      clearTimeout(connectTimeout);
      clearTimeout(answerTimeout);
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'active') {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col">
      {/* Call Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-purple-900 to-pink-900">
        {/* User Info */}
        <div className="text-center mb-8">
          <Avatar className="w-32 h-32 mx-auto mb-4 ring-4 ring-white/20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-4xl">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold text-white mb-2">{user.username}</h2>
          <p className="text-white/70 text-lg">
            {callStatus === 'connecting' && 'Connecting...'}
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'active' && formatDuration(duration)}
            {callStatus === 'ended' && 'Call Ended'}
          </p>
        </div>

        {/* Video Preview (for video calls) */}
        {type === 'video' && callStatus === 'active' && (
          <div className="w-full max-w-md aspect-video bg-black/50 rounded-lg mb-6 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {isVideoOff ? (
                <div className="text-center">
                  <VideoOff className="w-16 h-16 text-white/50 mx-auto mb-2" />
                  <p className="text-white/50">Camera is off</p>
                </div>
              ) : (
                <div className="text-white/50">Video Preview</div>
              )}
            </div>
            {/* Small self-view */}
            <div className="absolute top-4 right-4 w-24 h-32 bg-gray-800 rounded-lg"></div>
          </div>
        )}

        {/* Status Animation */}
        {(callStatus === 'connecting' || callStatus === 'ringing') && (
          <div className="flex gap-2 mb-8">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}

        {callStatus === 'ended' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      {callStatus !== 'ended' && (
        <div className="p-6 bg-black/40 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4">
            {/* Mute Button */}
            <Button
              variant="outline"
              size="icon"
              className={`w-14 h-14 rounded-full ${isMuted ? 'bg-red-500 text-white border-red-500' : 'bg-white/20 text-white border-white/30'}`}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            {/* Video Toggle (for video calls) */}
            {type === 'video' && (
              <Button
                variant="outline"
                size="icon"
                className={`w-14 h-14 rounded-full ${isVideoOff ? 'bg-red-500 text-white border-red-500' : 'bg-white/20 text-white border-white/30'}`}
                onClick={() => setIsVideoOff(!isVideoOff)}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
              </Button>
            )}

            {/* End Call Button */}
            <Button
              size="icon"
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600"
              onClick={handleEndCall}
            >
              {type === 'video' ? <Video className="w-7 h-7" /> : <Phone className="w-7 h-7" />}
            </Button>
          </div>

          <p className="text-center text-white/60 text-sm mt-4">
            Note: This is a demo call interface. Real calling requires WebRTC integration.
          </p>
        </div>
      )}
    </div>
  );
};

export default CallModal;
