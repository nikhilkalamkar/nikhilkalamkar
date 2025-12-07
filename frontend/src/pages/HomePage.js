import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, MessageCircle, User, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/utils';
import StoryRing from '@/components/StoryRing';
import FloatingNav from '@/components/FloatingNav';
import CreateStoryDialog from '@/components/CreateStoryDialog';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function HomePage() {
  const { user, token } = useAuthStore();
  const { chats, fetchChats } = useChatStore();
  const [stories, setStories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (token) {
      fetchChats(token);
      loadStories();
      loadFriendRequests();
    }
  }, [token]);
  
  const loadStories = async () => {
    try {
      const response = await axios.get(`${API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(response.data);
    } catch (error) {
      console.error('Failed to load stories:', error);
    }
  };
  
  const loadFriendRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await axios.get(`${API_URL}/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
      if (response.data.length === 0) {
        toast.info('No users found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.response?.data?.detail || 'Search failed. Please try again.');
    }
  };
  
  const sendFriendRequest = async (userId) => {
    try {
      await axios.post(`${API_URL}/friends/request?receiver_id=${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend request sent');
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      toast.error('Failed to send request');
    }
  };
  
  const handleFriendRequest = async (requestId, accept) => {
    try {
      await axios.post(
        `${API_URL}/friends/${accept ? 'accept' : 'decline'}/${requestId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(accept ? 'Request accepted' : 'Request declined');
      loadFriendRequests();
      fetchChats(token);
    } catch (error) {
      toast.error('Action failed');
    }
  };
  
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.user_id]) {
      acc[story.user_id] = { user: story.user, stories: [] };
    }
    acc[story.user_id].stories.push(story);
    return acc;
  }, {});
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-heading font-black tracking-tight">ishukart</h1>
            <div className="flex items-center gap-2">
              {user?.email === 'admin@ishukart.com' && (
                <Button
                  data-testid="admin-button"
                  onClick={() => navigate('/admin')}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <Shield className="w-5 h-5" />
                </Button>
              )}
              <Button
                data-testid="profile-button"
                onClick={() => navigate('/profile')}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <User className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <div className="px-4 py-4 space-y-6">
          {friendRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-secondary/50 rounded-2xl p-4 space-y-3"
              data-testid="friend-requests-section"
            >
              <h3 className="font-heading font-bold">Friend Requests</h3>
              {friendRequests.map((request) => (
                <div key={request.request_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.sender.profile_picture} />
                      <AvatarFallback>{request.sender.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{request.sender.username}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      data-testid={`accept-request-${request.request_id}`}
                      onClick={() => handleFriendRequest(request.request_id, true)}
                      size="sm"
                      className="rounded-full"
                    >
                      Accept
                    </Button>
                    <Button
                      data-testid={`decline-request-${request.request_id}`}
                      onClick={() => handleFriendRequest(request.request_id, false)}
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          
          <ScrollArea className="w-full" horizontal>
            <div className="flex gap-4 pb-2">
              <CreateStoryDialog onStoryCreated={loadStories} />
              
              {Object.values(groupedStories)
                .sort((a, b) => {
                  // Show current user's stories first
                  if (a.user.user_id === user?.user_id) return -1;
                  if (b.user.user_id === user?.user_id) return 1;
                  return 0;
                })
                .map((group, index) => (
                  <StoryRing
                    key={group.user.user_id}
                    user={group.user}
                    stories={group.stories}
                    index={index}
                  />
                ))
              }
            </div>
          </ScrollArea>
          
          {/* Global Search Bar */}
          <div className="px-4 pt-4">
            <div className="relative">
              <Input
                data-testid="global-search-input"
                placeholder="🔍 Search users around the world..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 2) {
                    handleSearch();
                  } else {
                    setSearchResults([]);
                  }
                }}
                className="w-full rounded-full pl-12 pr-4 py-6 text-base bg-secondary"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && searchQuery.length > 0 && (
              <Card className="mt-2 glass-effect border-border/50 max-h-80 overflow-y-auto">
                <CardContent className="p-2">
                  <div className="space-y-2">
                    {searchResults.map((result) => (
                      <div 
                        key={result.user_id} 
                        className="flex items-center justify-between p-3 hover:bg-accent rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage 
                              src={
                                result.profile_picture?.startsWith('http') 
                                  ? result.profile_picture 
                                  : `${process.env.REACT_APP_BACKEND_URL}${result.profile_picture}`
                              } 
                            />
                            <AvatarFallback>{result.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{result.username}</p>
                            <p className="text-xs text-muted-foreground">{result.email}</p>
                          </div>
                        </div>
                        <Button
                          data-testid={`add-friend-${result.user_id}`}
                          onClick={() => {
                            sendFriendRequest(result.user_id);
                            setSearchResults([]);
                            setSearchQuery('');
                          }}
                          size="sm"
                          className="rounded-full"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {searchQuery.length > 2 && searchResults.length === 0 && (
              <Card className="mt-2 glass-effect border-border/50">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
                  <p className="text-xs text-muted-foreground mt-1">Try a different name or email</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-6">
              <h2 className="text-xl font-heading font-bold">Messages</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    data-testid="search-users-button"
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect">
                  <DialogHeader>
                    <DialogTitle className="font-heading">Search Users</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        data-testid="search-input"
                        placeholder="Search by username or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1"
                      />
                      <Button data-testid="search-submit-button" onClick={handleSearch}>Search</Button>
                    </div>
                    <div className="space-y-2">
                      {searchResults.map((result) => (
                        <div key={result.user_id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={result.profile_picture} />
                              <AvatarFallback>{result.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{result.username}</p>
                              <p className="text-xs text-muted-foreground">{result.email}</p>
                            </div>
                          </div>
                          <Button
                            data-testid={`add-friend-${result.user_id}`}
                            onClick={() => sendFriendRequest(result.user_id)}
                            size="sm"
                            className="rounded-full"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-2">
              {chats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No chats yet. Add friends to start chatting!</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <motion.div
                    key={chat.chat_id}
                    data-testid={`chat-item-${chat.chat_id}`}
                    onClick={() => navigate(`/chat/${chat.chat_id}`)}
                    className="flex items-center gap-3 p-4 bg-secondary/50 rounded-2xl hover:bg-secondary cursor-pointer transition-all active:scale-95"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={chat.other_user?.profile_picture} />
                      <AvatarFallback>{chat.other_user?.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{chat.other_user?.username}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.last_message || 'No messages yet'}
                      </p>
                    </div>
                    {chat.last_message_time && (
                      <span className="text-xs text-muted-foreground font-mono">
                        {timeAgo(chat.last_message_time)}
                      </span>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      
      <FloatingNav />
    </div>
  );
}