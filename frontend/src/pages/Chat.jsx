import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import ChatInfo from '../components/ChatInfo';
import PremiumModal from '../components/PremiumModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

const Chat = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selectedChat, setSelectedChat] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      fetchChats();
      fetchUsers();
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

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setShowChatInfo(false);
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
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar 
          chats={chats}
          users={users}
          onChatSelect={handleChatSelect} 
          selectedChatId={selectedChat?.id}
          onNavigateHome={() => navigate('/')}
          onNavigateAdmin={() => navigate('/admin')}
          onRefresh={fetchChats}
        />
        
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
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to ishukart</h3>
                <p className="text-gray-500">Select a chat to start messaging</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Chat Info */}
        {showChatInfo && selectedChat && (
          <ChatInfo 
            chatDetails={getChatDetails()} 
            chatType={selectedChat.type}
            onClose={() => setShowChatInfo(false)}
          />
        )}
      </div>

      {/* Modals */}
      <PremiumModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      <AuthModal open={showAuthModal} onClose={() => navigate('/')} />
    </div>
  );
};

export default Chat;