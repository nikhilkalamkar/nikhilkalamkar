// Notification utility functions

export const addNotification = (type, data) => {
  const notifications = JSON.parse(localStorage.getItem('ishukart_notifications') || '[]');
  
  const newNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type, // 'like', 'comment', 'follow'
    username: data.username,
    avatar: data.avatar,
    postId: data.postId,
    commentId: data.commentId,
    text: data.text,
    createdAt: new Date().toISOString(),
    read: false
  };
  
  notifications.unshift(newNotification);
  
  // Keep only last 100 notifications
  if (notifications.length > 100) {
    notifications.length = 100;
  }
  
  localStorage.setItem('ishukart_notifications', JSON.stringify(notifications));
  
  return newNotification;
};

export const getUnreadCount = () => {
  const notifications = JSON.parse(localStorage.getItem('ishukart_notifications') || '[]');
  return notifications.filter(n => !n.read).length;
};

export const markAllAsRead = () => {
  const notifications = JSON.parse(localStorage.getItem('ishukart_notifications') || '[]');
  const updated = notifications.map(n => ({ ...n, read: true }));
  localStorage.setItem('ishukart_notifications', JSON.stringify(updated));
};

export const clearAllNotifications = () => {
  localStorage.setItem('ishukart_notifications', JSON.stringify([]));
};
