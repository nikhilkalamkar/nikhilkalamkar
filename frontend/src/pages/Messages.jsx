import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, Info, Phone, Video, Smile, Image as ImageIcon, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import NewMessageModal from '../components/Messages/NewMessageModal';
import CallModal from '../components/Messages/CallModal';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' or 'audio'
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
    
    // Auto-refresh conversations every 3 seconds
    const refreshInterval = setInterval(() => {
      fetchConversations();
    }, 3000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Handle opening chat from profile page
  useEffect(() => {
    if (location.state?.openChatWith) {
      const user = location.state.openChatWith;
      handleNewConversation(user);
      // Clear the state
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/messages/conversations`, {
        withCredentials: true
      });
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationMessages = async (partnerId) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/messages/conversation/${partnerId}`, {
        withCredentials: true
      });
      return response.data.conversation;
    } catch (error) {
      console.error('Error fetching messages:', error);
      return null;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (messageText.trim() && selectedConversation) {
      try {
        // Send message to backend
        await axios.post(
          `${BACKEND_URL}/api/messages/send`,
          {
            recipient_id: selectedConversation.user.id,
            text: messageText
          },
          { withCredentials: true }
        );

        // Create new message for UI
        const newMessage = {
          id: `msg_${Date.now()}`,
          senderId: currentUser?.user_id || currentUser?.id,
          text: messageText,
          createdAt: new Date().toISOString()
        };
        
        // Update selected conversation
        const updatedConversation = {
          ...selectedConversation,
          messages: [...(selectedConversation.messages || []), newMessage],
          lastMessage: messageText,
          lastMessageTime: newMessage.createdAt,
          unreadCount: 0
        };
        
        setSelectedConversation(updatedConversation);
        
        // Update conversations list
        setConversations(prev =>
          prev.map(conv =>
            conv.id === selectedConversation.id ? updatedConversation : conv
          )
        );
        
        setMessageText('');
        
        toast({
          title: 'Message sent',
          description: 'Your message has been delivered',
        });
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: 'Failed to send message',
          description: 'Please try again',
          variant: 'destructive'
        });
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create message with image
    const reader = new FileReader();
    reader.onload = (event) => {
      const newMessage = {
        id: `msg_${Date.now()}`,
        senderId: currentUser?.id,
        text: '[Image]',
        image: event.target.result,
        createdAt: new Date().toISOString()
      };

      const updatedConversation = {
        ...selectedConversation,
        messages: [...selectedConversation.messages, newMessage],
        lastMessage: '[Image]',
        lastMessageTime: newMessage.createdAt,
        unreadCount: 0
      };

      setSelectedConversation(updatedConversation);
      setConversations(prev =>
        prev.map(conv =>
          conv.id === selectedConversation.id ? updatedConversation : conv
        )
      );

      toast({
        title: 'Image sent',
        description: 'Your image has been delivered',
      });
    };
    reader.readAsDataURL(file);
  };

  const commonEmojis = ['❤️', '😂', '😍', '🔥', '👍', '🎉', '😊', '💯'];

  const handleEmojiClick = (emoji) => {
    setMessageText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleNewConversation = async (user) => {
    // Check if conversation already exists
    const existingConv = conversations.find(conv => conv.user.id === user.id);
    if (existingConv) {
      // Fetch messages for this conversation
      const conv = await fetchConversationMessages(user.id);
      if (conv) {
        setSelectedConversation(conv);
      } else {
        setSelectedConversation(existingConv);
      }
      setShowNewMessageModal(false);
      return;
    }

    // Create new conversation (will be saved to backend when first message is sent)
    const newConversation = {
      id: `conversation_${Date.now()}`,
      user: user,
      lastMessage: '',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
      messages: []
    };

    setConversations(prev => [newConversation, ...prev]);
    setSelectedConversation(newConversation);
    setShowNewMessageModal(false);

    toast({
      title: 'New conversation',
      description: `Started chat with ${user.username}`,
    });
  };

  const handleSelectConversation = async (conversation) => {
    // Fetch full conversation with messages
    const conv = await fetchConversationMessages(conversation.user.id);
    if (conv) {
      setSelectedConversation(conv);
    } else {
      setSelectedConversation(conversation);
    }
  };

  // Auto-refresh selected conversation messages
  useEffect(() => {
    if (!selectedConversation) return;
    
    const refreshMessages = async () => {
      const conv = await fetchConversationMessages(selectedConversation.user.id);
      if (conv) {
        setSelectedConversation(conv);
      }
    };
    
    // Refresh messages every 2 seconds
    const messageRefreshInterval = setInterval(refreshMessages, 2000);
    
    return () => clearInterval(messageRefreshInterval);
  }, [selectedConversation?.user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedConversation?.messages]);

  const formatTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - messageDate) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Conversations List */}
      <div className="w-full md:w-96 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">{currentUser?.username}</h2>
            <Button variant="ghost" size="icon" onClick={() => setShowNewMessageModal(true)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>
          
          <div className="flex gap-2 text-sm">
            <Button variant="ghost" size="sm" className="flex-1">Primary</Button>
            <Button variant="ghost" size="sm" className="flex-1">General</Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <p className="text-gray-500 mb-2">No messages yet</p>
              <p className="text-sm text-gray-400">Start a conversation by clicking the + button</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-900' : ''
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
              <Avatar className="w-14 h-14">
                <AvatarImage src={conversation.user.avatar} />
                <AvatarFallback>{conversation.user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{conversation.user.username}</p>
                <p className="text-sm text-gray-500 truncate">
                  {conversation.lastMessage} • {formatTime(conversation.lastMessageTime)}
                </p>
              </div>
              {conversation.unreadCount > 0 && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => navigate(`/profile/${selectedConversation.user.username}`)}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedConversation.user.avatar} />
                <AvatarFallback>{selectedConversation.user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-semibold">{selectedConversation.user.username}</span>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setCallType('audio');
                  setShowCallModal(true);
                  toast({
                    title: 'Starting audio call...',
                    description: `Calling ${selectedConversation.user.username}`,
                  });
                }}
              >
                <Phone className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setCallType('video');
                  setShowCallModal(true);
                  toast({
                    title: 'Starting video call...',
                    description: `Calling ${selectedConversation.user.username}`,
                  });
                }}
              >
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
              <>
                {selectedConversation.messages.map((message) => {
                  const isOwnMessage = message.senderId === (currentUser?.user_id || currentUser?.id);
                  return (
                    <div
                      key={message.id}
                      className={`flex mb-3 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.image ? (
                        <div className="max-w-xs">
                          <img 
                            src={message.image} 
                            alt="Shared" 
                            className="rounded-2xl max-w-full h-auto"
                          />
                        </div>
                      ) : (
                        <div
                          className={`max-w-xs px-4 py-2 rounded-3xl ${
                            isOwnMessage
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                          }`}
                        >
                          {message.text}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="mb-2">No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex flex-wrap gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-2xl hover:scale-125 transition-transform active:scale-110 p-1"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex-shrink-0"
              >
                <Smile className="w-6 h-6" />
              </Button>
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Message..."
                className="flex-1"
              />
              {messageText.trim() ? (
                <Button type="submit" variant="ghost" className="text-blue-500 font-semibold flex-shrink-0">
                  Send
                </Button>
              ) : (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0"
                  >
                    <ImageIcon className="w-6 h-6" />
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleEmojiClick('❤️')}
                    className="flex-shrink-0"
                  >
                    <Heart className="w-6 h-6" />
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="border-2 border-black dark:border-white rounded-full p-8 mb-4">
            <Send className="w-16 h-16" />
          </div>
          <h2 className="text-2xl font-light mb-2">Your messages</h2>
          <p className="text-gray-500 text-sm">Send private photos and messages to a friend or group.</p>
          <Button className="mt-4 bg-blue-500 hover:bg-blue-600" onClick={() => setShowNewMessageModal(true)}>Send message</Button>
        </div>
      )}
      
      {showNewMessageModal && (
        <NewMessageModal
          onClose={() => setShowNewMessageModal(false)}
          onSelectUser={handleNewConversation}
        />
      )}

      {showCallModal && selectedConversation && (
        <CallModal
          type={callType}
          user={selectedConversation.user}
          onClose={() => {
            setShowCallModal(false);
            setCallType(null);
          }}
        />
      )}
    </div>
  );
};

export default Messages;
