import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Send, Paperclip, Smile, MoreVertical, Phone, Video, Crown, Info } from 'lucide-react';
import { toast } from '../hooks/use-toast';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ChatWindow = ({ chat, chatDetails, onUpgradeToPremium, onToggleInfo }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (chat?.id) {
      fetchMessages();
    }
  }, [chat?.id]);

  const fetchMessages = async () => {
    try {
      const response = await axiosInstance.get(`/chats/${chat.id}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      setIsLoading(true);
      try {
        const response = await axiosInstance.post('/messages', {
          chatId: chat.id,
          text: message
        });
        setMessages([...messages, response.data]);
        setMessage('');
        toast({
          title: "Message sent",
          description: "Your message has been delivered"
        });
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileUpload = () => {
    toast({
      title: "Upgrade to Premium",
      description: "Upload files up to 2GB with Premium!",
      action: (
        <Button size="sm" onClick={onUpgradeToPremium} className="bg-yellow-500 hover:bg-yellow-600">
          Upgrade
        </Button>
      )
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={chatDetails?.avatar} alt={chatDetails?.name} />
            <AvatarFallback>{chatDetails?.name?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{chatDetails?.name}</h3>
              {chat.type === 'direct' && chatDetails?.isPremium && (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 h-5">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {chat.type === 'direct' 
                ? (chatDetails?.status === 'online' ? 'Online' : `Last seen ${formatTime(chatDetails?.lastSeen)}`)
                : `${chatDetails?.members} members`
              }
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-blue-50">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-blue-50">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleInfo} className="text-gray-600 hover:bg-blue-50">
            <Info className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-blue-50">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.senderId === 'me';
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${isMe ? 'order-2' : 'order-1'}`}>
                  {!isMe && chat.type === 'group' && (
                    <p className="text-xs text-blue-600 font-semibold mb-1 ml-2">{msg.senderName}</p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    } shadow-sm`}
                  >
                    <p className="text-sm break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleFileUpload}
            className="text-gray-600 hover:bg-blue-50"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-blue-50">
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 border-gray-300 focus:border-blue-500"
          />
          <Button 
            onClick={handleSendMessage}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;