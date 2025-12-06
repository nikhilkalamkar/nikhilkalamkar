import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications as mockNotifications } from '../mock/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Heart, MessageCircle, UserPlus, Trash2 } from 'lucide-react';
import { markAllAsRead, clearAllNotifications } from '../utils/notifications';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const localNotifications = JSON.parse(localStorage.getItem('ishukart_notifications') || '[]');
    const allNotifications = [...localNotifications, ...mockNotifications];
    setNotifications(allNotifications);
    
    // Mark all as read
    markAllAsRead();
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInSeconds = Math.floor((now - notifDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const handleFollow = (userId) => {
    console.log('Follow user:', userId);
  };

  const markAsRead = (notifId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notifId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  const NotificationItem = ({ notification }) => (
    <div
      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
      onClick={() => {
        markAsRead(notification.id);
        if (notification.post) {
          navigate(`/post/${notification.post.id}`);
        } else if (notification.type === 'follow') {
          navigate(`/profile/${notification.user.username}`);
        }
      }}
    >
      <Avatar className="w-11 h-11">
        <AvatarImage src={notification.user.avatar} />
        <AvatarFallback>{notification.user.username[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <p className="text-sm">
          <span className="font-semibold">{notification.user.username}</span>{' '}
          {notification.text}
        </p>
        <p className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</p>
      </div>

      {notification.post && (
        <img
          src={notification.post.images[0]}
          alt="Post"
          className="w-11 h-11 object-cover"
        />
      )}

      {notification.type === 'follow' && (
        <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={(e) => {
          e.stopPropagation();
          handleFollow(notification.user.id);
        }}>
          Follow
        </Button>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-4">
      <h1 className="text-2xl font-bold px-4 mb-4">Notifications</h1>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadNotifications.length > 0 && `(${unreadNotifications.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {notifications.length > 0 ? (
            <div>
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No notifications yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread">
          {unreadNotifications.length > 0 ? (
            <div>
              {unreadNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No unread notifications</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Notifications;
