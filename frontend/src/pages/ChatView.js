import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Camera, Image as ImageIcon, X, Phone, Video, PhoneOff, Mic, MicOff, VideoOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ChatView() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    fetchFriend();
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchFriend = async () => {
    try {
      const response = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const friendData = response.data.find(f => f.user_id === friendId);
      setFriend(friendData);
    } catch (error) {
      console.error('Failed to fetch friend:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`${API}/messages/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image too large. Please select an image under 5MB');
        return;
      }
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result);
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image file');
      }
    }
  };

  const clearImage = () => {
    setSelectedImage('');
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;

    try {
      console.log('Sending message:', { 
        hasText: !!newMessage, 
        hasImage: !!selectedImage,
        imageSize: selectedImage ? selectedImage.length : 0 
      });
      
      const response = await axios.post(`${API}/messages`, {
        recipient_id: friendId,
        text: newMessage || null,
        image_url: selectedImage || null
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      
      console.log('Message sent successfully:', response.data);
      setNewMessage('');
      clearImage();
      fetchMessages();
      toast.success('Message sent!');
    } catch (error) {
      console.error('Failed to send message:', error.response?.data || error.message);
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to send message';
      toast.error(errorMsg);
    }
  };

  const startCall = async (type) => {
    try {
      setCallType(type);
      setCallActive(true);
      
      const constraints = {
        audio: true,
        video: type === 'video'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }
      
      toast.success(`${type === 'video' ? 'Video' : 'Audio'} call started`);
    } catch (error) {
      console.error('Failed to start call:', error);
      toast.error('Failed to access camera/microphone');
      setCallActive(false);
    }
  };

  const endCall = () => {
    if (localVideoRef.current?.srcObject) {
      const tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
    setCallActive(false);
    setCallType(null);
    setIsMuted(false);
    setIsVideoOff(false);
    toast.info('Call ended');
  };

  const toggleMute = () => {
    if (localVideoRef.current?.srcObject) {
      const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const videoTracks = localVideoRef.current.srcObject.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!friend) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#F5E618] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col z-40" data-testid="chat-view-page">
      <div className="bg-white border-b px-4 py-4 flex items-center gap-3">
        <Button
          onClick={() => navigate('/chats')}
          className="rounded-full w-10 h-10 p-0 bg-gray-100 hover:bg-gray-200"
          data-testid="back-btn"
        >
          <ArrowLeft size={20} />
        </Button>
        <img
          src={friend.avatar_url || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
          alt={friend.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <p className="font-bold text-lg">{friend.username}</p>
        </div>
        <Button
          onClick={() => startCall('audio')}
          className="rounded-full w-10 h-10 p-0 bg-green-500 hover:bg-green-600 text-white"
          data-testid="audio-call-btn"
        >
          <Phone size={20} />
        </Button>
        <Button
          onClick={() => startCall('video')}
          className="rounded-full w-10 h-10 p-0 bg-blue-500 hover:bg-blue-600 text-white"
          data-testid="video-call-btn"
        >
          <Video size={20} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-md mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No messages yet</p>
            <p className="text-gray-400 text-sm mt-2">Send a message to start chatting</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.message_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`mb-3 flex ${message.sender_id === user.user_id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl overflow-hidden ${
                  message.sender_id === user.user_id
                    ? 'bg-[#F5E618] text-black rounded-br-sm'
                    : 'bg-white text-black rounded-bl-sm shadow-sm'
                }`}
                data-testid={`message-${message.message_id}`}
              >
                {message.image_url && (
                  <img
                    src={message.image_url}
                    alt="Shared image"
                    className="w-full max-w-xs object-cover cursor-pointer"
                    onClick={() => window.open(message.image_url, '_blank')}
                  />
                )}
                {message.text && (
                  <p className="font-medium px-4 py-3">{message.text}</p>
                )}
                {!message.text && message.image_url && (
                  <div className="px-4 py-2" />
                )}
                <p className={`text-xs px-4 pb-2 ${
                  message.sender_id === user.user_id ? 'text-black/60' : 'text-gray-500'
                }`}>
                  {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t px-4 py-3 max-w-md mx-auto w-full sticky bottom-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
          data-testid="image-input"
        />
        
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              data-testid="clear-image-btn"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 text-gray-700 rounded-full w-12 h-12 p-0 hover:bg-gray-300"
            data-testid="attach-image-btn"
          >
            <ImageIcon size={20} />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 h-12 rounded-full bg-gray-100 border-transparent px-4 text-base"
            data-testid="message-input"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() && !selectedImage}
            className="bg-[#F5E618] text-black rounded-full w-12 h-12 p-0 hover:scale-105 transition-transform disabled:opacity-50"
            data-testid="send-message-btn"
          >
            <Send size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
}