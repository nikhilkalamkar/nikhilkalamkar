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
      {/* Header with close button (only when not in call) */}
      {callStatus !== 'active' && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Call Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          {/* User Info */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <Avatar className={`w-40 h-40 mx-auto ring-4 ${
                callStatus === 'active' ? 'ring-green-500' : 'ring-white/20'
              } transition-all duration-300`}>
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-5xl bg-gradient-to-br from-purple-500 to-pink-500">
                  {user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Pulsing ring animation when ringing */}
              {callStatus === 'ringing' && (
                <>
                  <div className="absolute inset-0 rounded-full ring-4 ring-white/40 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full ring-8 ring-white/20 animate-pulse"></div>
                </>
              )}
              {/* Status indicator */}
              {callStatus === 'active' && (
                <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-black rounded-full"></div>
              )}
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{user.username}</h2>
            <p className="text-white/80 text-xl font-medium">
              {callStatus === 'connecting' && (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  Connecting...
                </span>
              )}
              {callStatus === 'ringing' && (
                <span className="flex items-center justify-center gap-2">
                  <Phone className="w-5 h-5 animate-bounce" />
                  Ringing...
                </span>
              )}
              {callStatus === 'active' && (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {formatDuration(duration)}
                </span>
              )}
              {callStatus === 'ended' && (
                <span className="text-red-400">Call Ended</span>
              )}
            </p>
            {type === 'video' && callStatus === 'active' && (
              <p className="text-white/60 text-sm mt-2">
                {isVideoOff ? 'Camera Off' : 'HD Video'}
              </p>
            )}
          </div>

          {/* Video Preview (for video calls) */}
          {type === 'video' && callStatus === 'active' && (
            <div className="w-full max-w-2xl aspect-video bg-black/50 rounded-2xl mb-6 relative overflow-hidden shadow-2xl border border-white/10">
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                {isVideoOff ? (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <VideoOff className="w-12 h-12 text-white/70" />
                    </div>
                    <p className="text-white/70 text-lg font-medium">Camera is off</p>
                    <p className="text-white/50 text-sm mt-1">Turn on camera to show video</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Video className="w-12 h-12 text-white/70" />
                    </div>
                    <p className="text-white/50 text-sm">Video stream active</p>
                  </div>
                )}
              </div>
              {/* Small self-view */}
              <div className="absolute top-4 right-4 w-32 h-40 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border-2 border-white/20 overflow-hidden shadow-xl">
                <div className="w-full h-full flex items-center justify-center">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl">You</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              {/* Fullscreen button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 text-white hover:bg-white/10"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="w-5 h-5" />
              </Button>
            </div>
          )}

          {callStatus === 'ended' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <PhoneOff className="w-10 h-10 text-red-400" />
              </div>
              <p className="text-white/60">Thank you for calling</p>
            </div>
          )}
        </div>
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
