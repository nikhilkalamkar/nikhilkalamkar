import React, { useState, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Search, MessageCircle, Home, Shield, Crown, RefreshCw, X, UserPlus } from 'lucide-react';
import AdBanner from './AdBanner';
import axiosInstance from '../api/axios';

import { useAuth } from '../context/AuthContext';
import { Users } from 'lucide-react';

const ChatSidebar = ({ chats, users, ads, onChatSelect, selectedChatId, onNavigateHome, onNavigateAdmin, onRefresh, onClose, onCloseAd, onSearchUsers, onShowFriendRequests }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchPendingRequestCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchPendingRequestCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingRequestCount = async () => {
    try {
      const response = await axiosInstance.get('/friends/requests/received');
      setPendingRequestCount(response.data.length);
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const getChatInfo = (chat) => {
    if (chat.type === 'direct') {
      const user = users.find(u => u.id === chat.userId);
      return {
        ...chat,
        name: user?.name || chat.name,
        avatar: user?.avatar || chat.avatar,
        isPremium: user?.isPremium || false
      };
    } else {
      return chat;
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMs = now - messageDate;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'now';
    if (diffInMins < 60) return `${diffInMins}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays === 1) return 'yesterday';
    if (diffInDays < 7) return `${diffInDays}d`;
    return messageDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const filteredChats = chats
    .map(getChatInfo)
    .filter(chat => 
      chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  return (
    <div className="w-full md:w-80 border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
        {/* User Profile Section */}
        {user && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-white/10 rounded-lg">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-white" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-white font-semibold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{user.name}</p>
              <div className="flex items-center gap-1 text-white/80 text-sm">
                <Users className="h-3 w-3" />
                <span>{user.friendCount || 0} Friends</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">Chats</h2>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onRefresh} className="text-white hover:bg-white/20">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNavigateHome} className="text-white hover:bg-white/20">
              <Home className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onNavigateAdmin} className="text-white hover:bg-white/20 hidden md:flex">
              <Shield className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 md:hidden">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <Button 
            onClick={onSearchUsers}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          
          <Button 
            onClick={onShowFriendRequests}
            className="relative bg-white/20 hover:bg-white/30 text-white border-0 px-3"
          >
            <UserPlus className="h-4 w-4" />
            {pendingRequestCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {pendingRequestCount}
              </Badge>
            )}
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Filter chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/90 border-0"
          />
        </div>
      </div>

      {/* Chats List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.map((chat) => {
            // Render ad banner
            if (chat.isAd) {
              return (
                <div key={chat.id} className="mb-2">
                  <AdBanner ad={chat} onClose={() => onCloseAd && onCloseAd(chat.id)} />
                </div>
              );
            }
            
            // Render chat item
            return (
              <div
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-blue-50 ${
                  selectedChatId === chat.id ? 'bg-blue-100' : ''
                }`}
              >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={chat.avatar} alt={chat.name} />
                  <AvatarFallback>{chat.name?.[0]}</AvatarFallback>
                </Avatar>
                {chat.type === 'direct' && chat.isPremium && (
                  <Crown className="absolute -bottom-1 -right-1 h-4 w-4 text-yellow-500 bg-white rounded-full p-0.5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-sm truncate">{chat.name}</h3>
                    {chat.type === 'direct' && users.find(u => u.id === chat.userId)?.mobile && (
                      <span className="text-xs text-gray-500">{users.find(u => u.id === chat.userId)?.mobile}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate">
                    {chat.type === 'group' && `${chat.members} members • `}
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <Badge className="ml-2 bg-blue-600 text-white hover:bg-blue-600 h-5 min-w-[20px] flex items-center justify-center text-xs">
                      {chat.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatSidebar;