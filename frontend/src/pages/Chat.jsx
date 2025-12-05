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
      return mockUsers.find(u => u.id === selectedChat.userId);
    } else {
      return mockGroups.find(g => g.id === selectedChat.id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <ChatSidebar 
          onChatSelect={handleChatSelect} 
          selectedChatId={selectedChat?.id}
          onNavigateHome={() => navigate('/')}
          onNavigateAdmin={() => navigate('/admin')}
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

      {/* Premium Modal */}
      <PremiumModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </div>
  );
};

export default Chat;