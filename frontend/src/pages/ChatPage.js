import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, Image, Video, Smile, Phone, VideoIcon, MoreVertical, Ban, Clock, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatTime } from '@/lib/utils';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export default function ChatPage() {
  const { chatId } = useParams();
  const { user, token } = useAuthStore();
  const { messages, fetchMessages, sendMessage, notifyScreenshot } = useChatStore();
  const [chatData, setChatData] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [disappearTimer, setDisappearTimer] = useState(86400); // 24 hours default
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  
  const timerOptions = [
    { value: 5, label: '5 seconds' },
    { value: 60, label: '1 minute' },
    { value: 3600, label: '1 hour' },
    { value: 86400, label: '24 hours' },
    { value: 0, label: 'Off' },
  ];
  
  useEffect(() => {
    if (token && chatId) {
      loadChat();
      fetchMessages(chatId, token);
    }
  }, [chatId, token]);
  
  useEffect(() => {
    const socket = useChatStore.getState().socket;
    if (socket) {
      const handleTimerUpdate = (data) => {
        if (data.chat_id === chatId) {
          setDisappearTimer(data.timer_seconds);
          const label = timerOptions.find(opt => opt.value === data.timer_seconds)?.label || 'Unknown';
          toast.info(`Timer changed to: ${label}`);
        }
      };
      
      socket.on('timer_updated', handleTimerUpdate);
      return () => socket.off('timer_updated', handleTimerUpdate);
    }
  }, [chatId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages[chatId]]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && chatId) {
        notifyScreenshot(chatId);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [chatId]);
  
  const loadChat = async () => {
    try {
      const response = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const chat = response.data.find(c => c.chat_id === chatId);
      setChatData(chat);
      if (chat?.disappearing_timer !== undefined) {
        setDisappearTimer(chat.disappearing_timer);
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };
  
  const handleSend = async () => {
    if (!messageText.trim() && !selectedMedia) return;
    
    const result = await sendMessage(
      chatId, 
      messageText || (selectedMedia ? 'Media' : ''), 
      selectedMedia ? 'media' : 'text', 
      selectedMedia, 
      token
    );
    
    if (result?.success) {
      setMessageText('');
      setSelectedMedia(null);
      toast.success('Message sent');
    } else {
      toast.error(result?.error || 'Failed to send message');
    }
  };
  
  const handleMediaSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedMedia(file);
      toast.success(`${type} selected`);
    }
  };
  
  const handleCall = async (type) => {
    try {
      const response = await axios.get(`${API_URL}/token/agora?channel=${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${type} call initiated`);
    } catch (error) {
      toast.error('Call failed to initiate');
    }
  };
  
  const handleBlockUser = async () => {
    const otherUserId = chatData?.other_user?.user_id;
    if (!otherUserId) return;
    
    try {
      await axios.post(`${API_URL}/block/${otherUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`${chatData.other_user.username} has been blocked`);
      setShowBlockDialog(false);
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to block user');
    }
  };
  
  const handleTimerChange = async (newTimer) => {
    try {
      await axios.put(`${API_URL}/chats/${chatId}/timer?timer_seconds=${newTimer}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisappearTimer(newTimer);
      const label = timerOptions.find(opt => opt.value === newTimer)?.label || 'Unknown';
      toast.success(`Disappearing messages set to: ${label}`);
    } catch (error) {
      toast.error('Failed to update timer');
    }
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage) return;
    
    try {
      await axios.delete(`${API_URL}/messages/${selectedMessage.message_id}/delete-for-me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove message from local state
      await fetchMessages(chatId, token);
      toast.success('Message deleted');
      setShowDeleteDialog(false);
      setSelectedMessage(null);
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage) return;
    
    try {
      await axios.delete(`${API_URL}/messages/${selectedMessage.message_id}/delete-for-everyone`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update message in local state
      await fetchMessages(chatId, token);
      toast.success('Message deleted for everyone');
      setShowDeleteDialog(false);
      setSelectedMessage(null);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete message');
    }
  };
  
  const chatMessages = messages[chatId] || [];
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="bg-surface border-b border-border px-4 py-3 flex items-center gap-3">
        <Button
          data-testid="back-button"
          onClick={() => navigate('/')}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Avatar className="w-10 h-10">
          <AvatarImage src={chatData?.other_user?.profile_picture} />
          <AvatarFallback>{chatData?.other_user?.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <p className="font-semibold">{chatData?.other_user?.username}</p>
          <p className="text-xs text-muted-foreground">{chatData?.other_user?.online_status}</p>
        </div>
        
        <Button
          data-testid="audio-call-button"
          onClick={() => handleCall('Audio')}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <Phone className="w-5 h-5" />
        </Button>
        <Button
          data-testid="video-call-button"
          onClick={() => handleCall('Video')}
          variant="ghost"
          size="icon"
          className="rounded-full"
        >
          <VideoIcon className="w-5 h-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="timer-button"
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Clock className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-effect">
            {timerOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                data-testid={`timer-option-${option.value}`}
                onClick={() => handleTimerChange(option.value)}
                className={disappearTimer === option.value ? 'bg-accent' : ''}
              >
                {option.label}
                {disappearTimer === option.value && ' ✓'}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              data-testid="chat-menu-button"
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-effect">
            <DropdownMenuItem
              data-testid="block-user-option"
              onClick={() => setShowBlockDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Ban className="w-4 h-4 mr-2" />
              Block User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      
      <AlertDialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <AlertDialogContent className="glass-effect">
          <AlertDialogHeader>
            <AlertDialogTitle>Block {chatData?.other_user?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              You won&apos;t be able to send or receive messages from this user. They won&apos;t see your stories either.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-block-button"
              onClick={handleBlockUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="messages-container">
        {chatMessages.map((message) => {
          const isSent = message.sender_id === user?.user_id;
          return (
            <div
              key={message.message_id}
              data-testid={`message-${message.message_id}`}
              className={`flex items-center gap-2 group ${isSent ? 'justify-end' : 'justify-start'}`}
            >
              {!isSent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setSelectedMessage(message);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isSent ? 'chat-bubble-sent' : 'chat-bubble-received'
                }`}
              >
                {message.media_url && !message.deleted_for_everyone && (
                  <div className="mb-2 relative">
                    {message.message_type === 'image' ? (
                      <img
                        src={message.media_url.startsWith('http') ? message.media_url : `${process.env.REACT_APP_BACKEND_URL}${message.media_url}`}
                        alt="Message media"
                        className="rounded-lg max-w-full"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : message.message_type === 'video' ? (
                      <video 
                        controls 
                        className="rounded-lg max-w-full"
                        preload="metadata"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      >
                        <source src={message.media_url.startsWith('http') ? message.media_url : `${process.env.REACT_APP_BACKEND_URL}${message.media_url}`} />
                      </video>
                    ) : null}
                  </div>
                )}
                {message.deleted_for_everyone ? (
                  <p className="break-words italic text-muted-foreground">
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    This message was deleted
                  </p>
                ) : (
                  message.content && message.content !== "Media" && (
                    <p className="break-words">{message.content}</p>
                  )
                )}
                <p className={`text-xs mt-1 font-mono ${isSent ? 'text-black/60' : 'text-white/60'}`}>
                  {formatTime(message.created_at)}
                </p>
                {message.is_screenshot && (
                  <p className="text-xs text-destructive mt-1">Screenshot detected</p>
                )}
              </div>
              {isSent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setSelectedMessage(message);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-border p-4 bg-surface">
        {selectedMedia && (
          <div className="mb-3 relative">
            <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl">
              {selectedMedia.type.startsWith('image/') ? (
                <img 
                  src={URL.createObjectURL(selectedMedia)} 
                  alt="Preview" 
                  className="h-20 w-20 object-cover rounded-lg"
                />
              ) : selectedMedia.type.startsWith('video/') ? (
                <video 
                  src={URL.createObjectURL(selectedMedia)} 
                  className="h-20 w-20 object-cover rounded-lg"
                />
              ) : null}
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedMedia.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedMedia.size / 1024).toFixed(2)} KB
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedMedia(null)}
                className="rounded-full"
                data-testid="remove-media-button"
              >
                <ArrowLeft className="w-4 h-4 rotate-90" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <label htmlFor="image-upload">
            <Button
              data-testid="upload-image-button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              asChild
            >
              <span>
                <Image className="w-5 h-5" />
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMediaSelect(e, 'Image')}
                  className="hidden"
                />
              </span>
            </Button>
          </label>
          
          <label htmlFor="video-upload">
            <Button
              data-testid="upload-video-button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              asChild
            >
              <span>
                <Video className="w-5 h-5" />
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleMediaSelect(e, 'Video')}
                  className="hidden"
                />
              </span>
            </Button>
          </label>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                data-testid="emoji-button"
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <EmojiPicker
                onEmojiClick={(emojiData) => setMessageText(prev => prev + emojiData.emoji)}
                theme="dark"
              />
            </PopoverContent>
          </Popover>
          
          <Input
            data-testid="message-input"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-secondary border-transparent"
          />
          
          <Button
            data-testid="send-button"
            onClick={handleSend}
            size="icon"
            className="rounded-full neon-shadow"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Delete Message Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-effect">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Choose how you want to delete this message:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Button
              onClick={handleDeleteForMe}
              variant="outline"
              className="w-full justify-start"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete for Me
            </Button>
            {selectedMessage && selectedMessage.sender_id === user?.user_id && (
              <Button
                onClick={handleDeleteForEveryone}
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete for Everyone
              </Button>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}