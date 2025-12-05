import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInfo from '../components/ChatInfo';
import PremiumModal from '../components/PremiumModal';
import AuthModal from '../components/AuthModal';
import AdBanner from '../components/AdBanner';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { Menu } from 'lucide-react';
import { Button } from '../components/ui/button';

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [ads, setAds] = useState([]);
  const [closedAdIds, setClosedAdIds] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      fetchChats();
      fetchUsers();
      if (!user.isPremium) {
        fetchAds();
      }
    }
  }, [user]);

  const fetchChats = async () => {
    try {
      const response = await axiosInstance.get('/chats');
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAds = async () => {
    try {
      const response = await axiosInstance.get('/ads/active');
      setAds(response.data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const getChatsWithAds = () => {
    if (user?.isPremium || ads.length === 0) {
      return chats;
    }

    // Insert ads after every 10 chats
    const result = [];
    let adIndex = 0;
    
    chats.forEach((chat, index) => {
      result.push(chat);
      // Add ad after every 10 chats
      if ((index + 1) % 10 === 0 && ads[adIndex] && !closedAdIds.includes(ads[adIndex].id)) {
        result.push({ ...ads[adIndex], isAd: true });
        adIndex = (adIndex + 1) % ads.length;
      }
    });
    
    return result;
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setShowChatInfo(false);
    setMobileSidebarOpen(false); // Close sidebar on mobile when chat selected
  };

  const handleUpgradeToPremium = () => {
    setShowPremiumModal(true);
  };

  const getChatDetails = () => {
    if (!selectedChat) return null;
    if (selectedChat.type === 'direct') {
      return users.find(u => u.id === selectedChat.userId) || {
        name: selectedChat.name,
        avatar: selectedChat.avatar,
        isPremium: false
      };
    } else {
      return selectedChat;
    }
  };

  if (!user && !loading) {
    return <AuthModal open={showAuthModal} onClose={() => navigate('/')} />;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Mobile Header */}
      <div className="md:hidden border-b bg-white p-3 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          ishukart
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Hidden on mobile unless toggled */}
        <div className={`${
          mobileSidebarOpen ? 'absolute inset-0 z-50 bg-white' : 'hidden'
        } md:relative md:block md:z-auto`}>
          <ChatSidebar 
            chats={getChatsWithAds()}
            users={users}
            ads={ads}
            onChatSelect={handleChatSelect} 
            selectedChatId={selectedChat?.id}
            onNavigateHome={() => navigate('/')}
            onNavigateAdmin={() => navigate('/admin')}
            onRefresh={fetchChats}
            onClose={() => setMobileSidebarOpen(false)}
            onCloseAd={(adId) => setClosedAdIds([...closedAdIds, adId])}
          />
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <ChatWindow 
              chat={selectedChat} 
              chatDetails={getChatDetails()}
              onUpgradeToPremium={handleUpgradeToPremium}
              onToggleInfo={() => setShowChatInfo(!showChatInfo)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="text-center px-4">
                <div className="text-4xl md:text-6xl mb-4">💬</div>
                <h3 className="text-xl md:text-2xl font-semibold text-gray-700 mb-2">Welcome to ishukart</h3>
                <p className="text-gray-500 text-sm md:text-base">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat Info - Hidden on mobile */}
        {showChatInfo && selectedChat && (
          <div className="hidden lg:block">
            <ChatInfo 
              chatDetails={getChatDetails()} 
              chatType={selectedChat.type}
              onClose={() => setShowChatInfo(false)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <PremiumModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      <AuthModal open={showAuthModal} onClose={() => navigate('/')} />
    </div>
  );
};

export default Chat;