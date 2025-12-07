import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
const WS_URL = process.env.REACT_APP_BACKEND_URL.replace('https:', 'wss:').replace('http:', 'ws:');

export const useChatStore = create((set, get) => ({
  chats: [],
  messages: {},
  currentChat: null,
  socket: null,
  
  setCurrentChat: (chat) => set({ currentChat: chat }),
  
  initSocket: (userId, token) => {
    const socket = io(WS_URL, {
      path: '/ws/' + userId,
      transports: ['websocket'],
      auth: { token }
    });
    
    socket.on('new_message', (data) => {
      const { chat_id } = data.data;
      const messages = get().messages[chat_id] || [];
      set({ messages: { ...get().messages, [chat_id]: [...messages, data.data] } });
    });
    
    set({ socket });
  },
  
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) socket.disconnect();
    set({ socket: null });
  },
  
  fetchChats: async (token) => {
    try {
      const response = await axios.get(`${API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ chats: response.data });
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  },
  
  fetchMessages: async (chatId, token) => {
    try {
      const response = await axios.get(`${API_URL}/chats/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ messages: { ...get().messages, [chatId]: response.data } });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  },
  
  sendMessage: async (chatId, content, messageType, media, token) => {
    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('message_type', messageType);
      if (media) formData.append('media', media);
      
      await axios.post(`${API_URL}/chats/${chatId}/messages`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      get().fetchMessages(chatId, token);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },
  
  notifyScreenshot: (chatId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('screenshot_taken', { chat_id: chatId });
    }
  }
}));