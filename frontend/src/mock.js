// Mock data for ishukart Telegram clone

export const mockUsers = [
  {
    id: '1',
    name: 'Rahul Kumar',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
    status: 'online',
    lastSeen: new Date(),
    isPremium: true
  },
  {
    id: '2',
    name: 'Priya Sharma',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    status: 'offline',
    lastSeen: new Date(Date.now() - 300000),
    isPremium: false
  },
  {
    id: '3',
    name: 'Amit Patel',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amit',
    status: 'online',
    lastSeen: new Date(),
    isPremium: true
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha',
    status: 'offline',
    lastSeen: new Date(Date.now() - 600000),
    isPremium: false
  },
  {
    id: '5',
    name: 'Vikram Singh',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram',
    status: 'online',
    lastSeen: new Date(),
    isPremium: false
  }
];

export const mockGroups = [
  {
    id: 'g1',
    name: 'Team ishukart',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=TI',
    members: 45,
    lastMessage: 'Great work team!',
    lastMessageTime: new Date(Date.now() - 120000),
    unreadCount: 3
  },
  {
    id: 'g2',
    name: 'Developers Hub',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=DH',
    members: 128,
    lastMessage: 'Anyone knows React?',
    lastMessageTime: new Date(Date.now() - 3600000),
    unreadCount: 0
  },
  {
    id: 'g3',
    name: 'Premium Users',
    avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=PU',
    members: 89,
    lastMessage: 'Welcome to premium!',
    lastMessageTime: new Date(Date.now() - 86400000),
    unreadCount: 12
  }
];

export const mockChats = [
  {
    id: 'c1',
    userId: '1',
    type: 'direct',
    lastMessage: 'Hey! How are you?',
    lastMessageTime: new Date(Date.now() - 300000),
    unreadCount: 2
  },
  {
    id: 'c2',
    userId: '2',
    type: 'direct',
    lastMessage: 'Thanks for the help!',
    lastMessageTime: new Date(Date.now() - 1800000),
    unreadCount: 0
  },
  {
    id: 'c3',
    userId: '3',
    type: 'direct',
    lastMessage: 'See you tomorrow',
    lastMessageTime: new Date(Date.now() - 7200000),
    unreadCount: 0
  },
  {
    id: 'g1',
    type: 'group',
    lastMessage: 'Great work team!',
    lastMessageTime: new Date(Date.now() - 120000),
    unreadCount: 3
  },
  {
    id: 'g2',
    type: 'group',
    lastMessage: 'Anyone knows React?',
    lastMessageTime: new Date(Date.now() - 3600000),
    unreadCount: 0
  }
];

export const mockMessages = {
  'c1': [
    {
      id: 'm1',
      senderId: '1',
      text: 'Hey! How are you?',
      timestamp: new Date(Date.now() - 300000),
      status: 'read'
    },
    {
      id: 'm2',
      senderId: 'me',
      text: 'I am good! How about you?',
      timestamp: new Date(Date.now() - 240000),
      status: 'read'
    },
    {
      id: 'm3',
      senderId: '1',
      text: 'Doing great! Have you tried the premium features?',
      timestamp: new Date(Date.now() - 180000),
      status: 'read'
    }
  ],
  'c2': [
    {
      id: 'm4',
      senderId: 'me',
      text: 'Need any help with the setup?',
      timestamp: new Date(Date.now() - 1900000),
      status: 'read'
    },
    {
      id: 'm5',
      senderId: '2',
      text: 'Thanks for the help!',
      timestamp: new Date(Date.now() - 1800000),
      status: 'read'
    }
  ],
  'g1': [
    {
      id: 'm6',
      senderId: '3',
      senderName: 'Amit Patel',
      text: 'Great work team!',
      timestamp: new Date(Date.now() - 120000),
      status: 'read'
    },
    {
      id: 'm7',
      senderId: '1',
      senderName: 'Rahul Kumar',
      text: 'Thanks! Let\'s keep it up 🚀',
      timestamp: new Date(Date.now() - 60000),
      status: 'read'
    }
  ]
};

export const mockPremiumFeatures = [
  {
    icon: 'Zap',
    title: 'Ad-Free Experience',
    description: 'Enjoy ishukart without any advertisements'
  },
  {
    icon: 'Upload',
    title: 'Larger File Uploads',
    description: 'Upload files up to 2GB instead of 100MB'
  },
  {
    icon: 'Star',
    title: 'Premium Badge',
    description: 'Show off your premium status with exclusive badge'
  },
  {
    icon: 'Palette',
    title: 'Custom Themes',
    description: 'Personalize your chat with exclusive themes'
  },
  {
    icon: 'Users',
    title: 'Priority Support',
    description: 'Get faster response from our support team'
  },
  {
    icon: 'Shield',
    title: 'Advanced Privacy',
    description: 'Enhanced privacy controls and security features'
  }
];

export const mockAdminStats = {
  totalUsers: 1247,
  premiumUsers: 289,
  activeUsers: 856,
  totalRevenue: 28900,
  monthlyRevenue: 12500,
  recentSignups: 45
};

export const mockAdminUsers = [
  {
    id: '1',
    name: 'Rahul Kumar',
    email: 'rahul@example.com',
    isPremium: true,
    subscriptionDate: '2024-12-15',
    lastActive: new Date(Date.now() - 300000)
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    isPremium: false,
    subscriptionDate: null,
    lastActive: new Date(Date.now() - 600000)
  },
  {
    id: '3',
    name: 'Amit Patel',
    email: 'amit@example.com',
    isPremium: true,
    subscriptionDate: '2025-01-02',
    lastActive: new Date(Date.now() - 120000)
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    email: 'sneha@example.com',
    isPremium: false,
    subscriptionDate: null,
    lastActive: new Date(Date.now() - 1800000)
  },
  {
    id: '5',
    name: 'Vikram Singh',
    email: 'vikram@example.com',
    isPremium: true,
    subscriptionDate: '2024-11-20',
    lastActive: new Date()
  }
];

export const mockPaymentHistory = [
  {
    id: 'pay1',
    userId: '1',
    userName: 'Rahul Kumar',
    amount: 100,
    date: '2025-01-10',
    status: 'success',
    razorpayId: 'pay_mock123456'
  },
  {
    id: 'pay2',
    userId: '3',
    userName: 'Amit Patel',
    amount: 100,
    date: '2025-01-09',
    status: 'success',
    razorpayId: 'pay_mock123457'
  },
  {
    id: 'pay3',
    userId: '5',
    userName: 'Vikram Singh',
    amount: 100,
    date: '2025-01-08',
    status: 'success',
    razorpayId: 'pay_mock123458'
  },
  {
    id: 'pay4',
    userId: '1',
    userName: 'Rahul Kumar',
    amount: 100,
    date: '2024-12-10',
    status: 'success',
    razorpayId: 'pay_mock123459'
  }
];