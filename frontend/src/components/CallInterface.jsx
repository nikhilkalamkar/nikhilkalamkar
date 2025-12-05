import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import Peer from 'simple-peer';
import axiosInstance from '../api/axios';
import { toast } from '../hooks/use-toast';

const CallInterface = ({ 
  isOpen, 
  onClose, 
  callData, // { callId, isInitiator, peerId, peerName, callType }
  onCallEnd 
}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peer, setPeer] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting'); // connecting, ringing, connected, ended
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const signalIntervalRef = useRef();

  useEffect(() => {
    if (isOpen && callData) {
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, callData]);

  const initializeCall = async () => {
    try {
      // Get media stream
      const constraints = {
        audio: true,
        video: callData.callType === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && callData.callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const newPeer = new Peer({
        initiator: callData.isInitiator,
        trickle: false,
        stream: stream
      });

      newPeer.on('signal', async (signal) => {
        // Send signal to backend
        try {
          await axiosInstance.post('/calls/signal', {
            callId: callData.callId,
            signal: signal,
            type: callData.isInitiator ? 'offer' : 'answer'
          });
        } catch (error) {
          console.error('Error sending signal:', error);
        }
      });

      newPeer.on('stream', (stream) => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setCallStatus('connected');
      });

      newPeer.on('error', (err) => {
        console.error('Peer error:', err);
        toast({
          title: 'Call Error',
          description: 'Connection error occurred',
          variant: 'destructive'
        });
        handleEndCall();
      });

      newPeer.on('close', () => {
        handleEndCall();
      });

      setPeer(newPeer);

      // If not initiator, set status to ringing
      if (!callData.isInitiator) {
        setCallStatus('ringing');
      }

      // Start polling for signals
      startSignalPolling();

    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: 'Call Failed',
        description: error.message || 'Could not access media devices',
        variant: 'destructive'
      });
      handleEndCall();
    }
  };

  const startSignalPolling = () => {
    signalIntervalRef.current = setInterval(async () => {
      try {
        const response = await axiosInstance.get(`/calls/signal/${callData.callId}`);
        const signals = response.data.signals;

        if (signals && signals.length > 0) {
          signals.forEach(signalData => {
            if (peer && !peer.destroyed) {
              peer.signal(signalData.signal);
            }
          });
        }
      } catch (error) {
        console.error('Error polling signals:', error);
      }
    }, 1000);
  };

  const cleanup = () => {
    if (signalIntervalRef.current) {
      clearInterval(signalIntervalRef.current);
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    if (peer && !peer.destroyed) {
      peer.destroy();
    }
  };

  const handleEndCall = async () => {
    cleanup();
    
    try {
      await axiosInstance.post(`/calls/end/${callData.callId}`);
    } catch (error) {
      console.error('Error ending call:', error);
    }

    setCallStatus('ended');
    
    if (onCallEnd) {
      onCallEnd();
    }
    
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callData.callType === 'video') {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Note: Speaker toggle is UI only, actual implementation depends on device
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call Ended';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[600px] p-0 bg-gray-900">
        <div className="relative h-full flex flex-col">
          {/* Remote Video/Avatar */}
          <div className="flex-1 relative bg-gray-800 flex items-center justify-center">
            {callData.callType === 'video' && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                  {callData.peerName?.charAt(0).toUpperCase()}
                </div>
                <p className="text-white text-2xl font-semibold">{callData.peerName}</p>
                <p className="text-gray-400 mt-2">{getStatusText()}</p>
              </div>
            )}

            {/* Local Video (Picture in Picture) */}
            {callData.callType === 'video' && localStream && (
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-600">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-4 left-4 bg-black/50 px-4 py-2 rounded-full">
              <p className="text-white text-sm">{getStatusText()}</p>
            </div>
          </div>

          {/* Call Controls */}
          <div className="bg-gray-900 p-6 flex justify-center gap-4">
            {/* Mute Button */}
            <Button
              onClick={toggleMute}
              size="icon"
              className={`w-14 h-14 rounded-full ${
                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>

            {/* Video Toggle (only for video calls) */}
            {callData.callType === 'video' && (
              <Button
                onClick={toggleVideo}
                size="icon"
                className={`w-14 h-14 rounded-full ${
                  isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
              </Button>
            )}

            {/* Speaker Toggle */}
            <Button
              onClick={toggleSpeaker}
              size="icon"
              className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600"
            >
              {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>

            {/* End Call Button */}
            <Button
              onClick={handleEndCall}
              size="icon"
              className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallInterface;
