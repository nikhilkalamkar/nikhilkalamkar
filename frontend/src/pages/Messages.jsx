import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { messages as mockMessages } from '../mock/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, Info, Phone, Video, Smile, Image as ImageIcon, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Messages = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState(mockMessages);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && selectedConversation) {
      const newMessage = {
        id: `msg_${Date.now()}`,
        senderId: currentUser?.id,
        text: messageText,
        createdAt: new Date().toISOString()
      };
      
      // Add message to conversation
      setSelectedConversation(prev => ({
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: messageText,
        lastMessageTime: newMessage.createdAt
      }));
      
      setMessageText('');
    }
  };

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
            <Button variant="ghost" size="icon">
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
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                selectedConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-900' : ''
              }`}
              onClick={() => setSelectedConversation(conversation)}
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
          ))}
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
              <Button variant="ghost" size="icon">
                <Phone className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Info className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-3 ${
                  message.senderId === currentUser?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-3xl ${
                    message.senderId === currentUser?.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="icon">
                <Smile className="w-6 h-6" />
              </Button>
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Message..."
                className="flex-1"
              />
              {messageText.trim() ? (
                <Button type="submit" variant="ghost" className="text-blue-500 font-semibold">
                  Send
                </Button>
              ) : (
                <>
                  <Button type="button" variant="ghost" size="icon">
                    <ImageIcon className="w-6 h-6" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon">
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
          <Button className="mt-4 bg-blue-500 hover:bg-blue-600">Send message</Button>
        </div>
      )}
    </div>
  );
};

export default Messages;
