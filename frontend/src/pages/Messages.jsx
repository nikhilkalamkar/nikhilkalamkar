import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, Info, Phone, Video, Smile, Image as ImageIcon, Heart, MoreVertical, FolderInput, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import NewMessageModal from '../components/Messages/NewMessageModal';
import CallModal from '../components/Messages/CallModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState([]);
  
  // Update ref when conversations change
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' or 'audio'
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('primary'); // 'primary' or 'general'
  const [conversationCategories, setConversationCategories] = useState({});
  const [likedMessages, setLikedMessages] = useState({});
  const [showHeartAnimation, setShowHeartAnimation] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const fileInputRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const conversationsRef = React.useRef([]);
  const lastMessageCountRef = React.useRef(0);
  const lastTapRef = React.useRef({});

  // Common emoji reactions
  const quickReactions = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥', '🎉', '💯'];

  // Load conversation categories from localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem('ishukart_conversation_categories');
    if (savedCategories) {
      setConversationCategories(JSON.parse(savedCategories));
    }
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetchConversations(false);
    
    // Auto-refresh conversations every 5 seconds (silent refresh)
    const refreshInterval = setInterval(() => {
      fetchConversations(true);
    }, 5000);
    
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

  const fetchConversations = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await axios.get(`${BACKEND_URL}/api/messages/conversations`, {
        withCredentials: true
      });
      
      const newConversations = response.data.conversations || [];
      
      // Only update if there are actual changes
      if (JSON.stringify(newConversations) !== JSON.stringify(conversationsRef.current)) {
        conversationsRef.current = newConversations;
        setConversations(newConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (!silent) {
        setConversations([]);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
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
        const newMessageCount = conv.messages?.length || 0;
        
        // Only update if message count changed
        if (newMessageCount !== lastMessageCountRef.current) {
          lastMessageCountRef.current = newMessageCount;
          setSelectedConversation(conv);
        }
      }
    };
    
    // Set initial count
    lastMessageCountRef.current = selectedConversation.messages?.length || 0;
    
    // Refresh messages every 4 seconds (reduced frequency)
    const messageRefreshInterval = setInterval(refreshMessages, 4000);
    
    return () => clearInterval(messageRefreshInterval);
  }, [selectedConversation?.user?.id]);

  // Scroll to bottom only when message count increases
  useEffect(() => {
    const messageCount = selectedConversation?.messages?.length || 0;
    if (messagesEndRef.current && messageCount > 0) {
      // Smooth scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [selectedConversation?.messages?.length]);

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

  // Move conversation between Primary and General
  const moveConversation = (conversationId, toCategory) => {
    const newCategories = {
      ...conversationCategories,
      [conversationId]: toCategory
    };
    setConversationCategories(newCategories);
    localStorage.setItem('ishukart_conversation_categories', JSON.stringify(newCategories));
    
    toast({
      title: toCategory === 'primary' ? '📌 Moved to Primary' : '📁 Moved to General',
      description: `Conversation will stay in ${toCategory === 'primary' ? 'Primary' : 'General'} until you move it`,
    });
  };

  // Reset conversation to auto-categorization
  const resetConversationCategory = (conversationId) => {
    const newCategories = { ...conversationCategories };
    delete newCategories[conversationId];
    setConversationCategories(newCategories);
    localStorage.setItem('ishukart_conversation_categories', JSON.stringify(newCategories));
    
    toast({
      title: '🔄 Reset to Auto',
      description: 'Conversation will now follow automatic categorization',
    });
  };

  // Handle double tap to like message
  const handleMessageDoubleTap = (messageId) => {
    const now = Date.now();
    const lastTap = lastTapRef.current[messageId] || 0;
    const timeDiff = now - lastTap;

    // Double tap detected (within 300ms)
    if (timeDiff < 300 && timeDiff > 0) {
      // Like the message
      setLikedMessages(prev => ({
        ...prev,
        [messageId]: true
      }));

      // Show heart animation
      setShowHeartAnimation(messageId);
      
      // Hide animation after 1 second
      setTimeout(() => {
        setShowHeartAnimation(null);
      }, 1000);

      // Reset tap time
      lastTapRef.current[messageId] = 0;
    } else {
      // Record this tap
      lastTapRef.current[messageId] = now;
    }
  };

  // Add emoji reaction to message
  const addReaction = (messageId, emoji) => {
    const currentUserId = currentUser?.user_id || currentUser?.id;
    
    setMessageReactions(prev => {
      const messageReactions = prev[messageId] || {};
      const emojiReactions = messageReactions[emoji] || [];
      
      // Check if user already reacted with this emoji
      if (emojiReactions.includes(currentUserId)) {
        // Remove reaction
        return {
          ...prev,
          [messageId]: {
            ...messageReactions,
            [emoji]: emojiReactions.filter(id => id !== currentUserId)
          }
        };
      } else {
        // Add reaction
        return {
          ...prev,
          [messageId]: {
            ...messageReactions,
            [emoji]: [...emojiReactions, currentUserId]
          }
        };
      }
    });
    
    setShowReactionPicker(null);
  };

  // Get current category for a conversation (manual takes priority)
  const getConversationCategory = (conv) => {
    // If user has manually categorized, ALWAYS use that
    if (conversationCategories[conv.id] !== undefined) {
      return conversationCategories[conv.id];
    }
    
    // Otherwise, auto-categorize based on activity
    const lastMessageTime = new Date(conv.lastMessageTime);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Auto: Primary for unread or recent (last 24h)
    if (conv.unreadCount > 0 || lastMessageTime > dayAgo) {
      return 'primary';
    }
    
    // Auto: General for everything else
    return 'general';
  };

  // Filter conversations based on active tab
  const filteredConversations = conversations.filter(conv => {
    return getConversationCategory(conv) === activeTab;
  });

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
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex-1 relative ${activeTab === 'primary' ? 'bg-gray-100 dark:bg-gray-800 font-semibold' : ''}`}
              onClick={() => setActiveTab('primary')}
            >
              Primary
              {conversations.filter(conv => {
                const lastMessageTime = new Date(conv.lastMessageTime);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return conv.unreadCount > 0 || lastMessageTime > dayAgo;
              }).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {conversations.filter(conv => {
                    const lastMessageTime = new Date(conv.lastMessageTime);
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return conv.unreadCount > 0 || lastMessageTime > dayAgo;
                  }).length}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`flex-1 relative ${activeTab === 'general' ? 'bg-gray-100 dark:bg-gray-800 font-semibold' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              General
              {conversations.filter(conv => {
                const lastMessageTime = new Date(conv.lastMessageTime);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return conv.unreadCount === 0 && lastMessageTime <= dayAgo;
              }).length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-gray-500 text-white text-xs rounded-full">
                  {conversations.filter(conv => {
                    const lastMessageTime = new Date(conv.lastMessageTime);
                    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return conv.unreadCount === 0 && lastMessageTime <= dayAgo;
                  }).length}
                </span>
              )}
            </Button>
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
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <p className="text-gray-500 mb-2">
                {activeTab === 'primary' ? 'No recent conversations' : 'No older conversations'}
              </p>
              <p className="text-sm text-gray-400">
                {activeTab === 'primary' 
                  ? 'Your active chats will appear here' 
                  : 'Older chats will appear here'}
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              // Get current category (manual takes priority)
              const currentCategory = getConversationCategory(conversation);
              const isManuallySet = conversationCategories[conversation.id] !== undefined;
              
              return (
                <div
                  key={conversation.id}
                  className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group relative ${
                    selectedConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-900' : ''
                  }`}
                >
                  <div 
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={conversation.user.avatar} />
                      <AvatarFallback>{conversation.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold truncate">{conversation.user.username}</p>
                        {isManuallySet && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            📌
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage} • {formatTime(conversation.lastMessageTime)}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Move conversation dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {currentCategory === 'general' ? (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            moveConversation(conversation.id, 'primary');
                          }}
                        >
                          <Inbox className="w-4 h-4 mr-2" />
                          Move to Primary
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            moveConversation(conversation.id, 'general');
                          }}
                        >
                          <FolderInput className="w-4 h-4 mr-2" />
                          Move to General
                        </DropdownMenuItem>
                      )}
                      {isManuallySet && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            resetConversationCategory(conversation.id);
                          }}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reset to Auto
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
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
                  const isLiked = likedMessages[message.id];
                  const showHeart = showHeartAnimation === message.id;
                  const reactions = messageReactions[message.id] || {};
                  const hasReactions = Object.keys(reactions).some(emoji => reactions[emoji].length > 0);
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex mb-4 ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className="relative group">
                        {/* Message Bubble Container */}
                        <div className={`flex items-end gap-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                          {/* Message Content */}
                          <div className="relative">
                            {message.image ? (
                              <div 
                                className="max-w-xs cursor-pointer select-none"
                                onClick={() => handleMessageDoubleTap(message.id)}
                              >
                                <img 
                                  src={message.image} 
                                  alt="Shared" 
                                  className="rounded-2xl max-w-full h-auto"
                                  draggable="false"
                                />
                              </div>
                            ) : (
                              <div
                                className={`max-w-xs px-4 py-2 rounded-3xl cursor-pointer select-none transition-all ${
                                  isOwnMessage
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                                } ${showHeart ? 'scale-95' : 'hover:scale-105'}`}
                                onClick={() => handleMessageDoubleTap(message.id)}
                              >
                                {message.text}
                              </div>
                            )}
                            
                            {/* Heart animation on double tap */}
                            {showHeart && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <Heart 
                                  className="w-16 h-16 text-red-500 fill-red-500 animate-ping"
                                  style={{ animationDuration: '0.5s', animationIterationCount: '2' }}
                                />
                              </div>
                            )}

                            {/* Reaction button - shows on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowReactionPicker(showReactionPicker === message.id ? null : message.id);
                              }}
                              className={`absolute ${isOwnMessage ? '-left-8' : '-right-8'} top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110`}
                            >
                              <Smile className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* Reaction Picker */}
                            {showReactionPicker === message.id && (
                              <div 
                                className={`absolute ${isOwnMessage ? 'right-0' : 'left-0'} top-full mt-2 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-2 flex gap-1 z-20 animate-in fade-in slide-in-from-top-2`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {quickReactions.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => addReaction(message.id, emoji)}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all hover:scale-125 active:scale-110"
                                  >
                                    <span className="text-xl">{emoji}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Display reactions */}
                            {hasReactions && (
                              <div className={`absolute -bottom-2 ${isOwnMessage ? 'right-0' : 'left-0'} flex gap-1 flex-wrap max-w-xs`}>
                                {Object.entries(reactions).map(([emoji, users]) => {
                                  if (users.length === 0) return null;
                                  const currentUserId = currentUser?.user_id || currentUser?.id;
                                  const userReacted = users.includes(currentUserId);
                                  
                                  return (
                                    <button
                                      key={emoji}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        addReaction(message.id, emoji);
                                      }}
                                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs transition-all hover:scale-110 ${
                                        userReacted 
                                          ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500' 
                                          : 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      {users.length > 1 && (
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                                          {users.length}
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          {/* Permanent heart indicator if liked - Shows on OPPOSITE side */}
                          {isLiked && (
                            <div 
                              className={`flex items-center justify-center w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-md border border-gray-200 dark:border-gray-700 transition-all hover:scale-110 ${
                                isOwnMessage ? 'order-first' : 'order-last'
                              }`}
                            >
                              <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                            </div>
                          )}
                        </div>
                      </div>
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
