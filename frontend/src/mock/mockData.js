// Mock data for Instagram clone

export const currentUser = {
  id: 'user_1',
  username: 'ishuk_artist',
  fullName: 'Ishuk Artist',
  email: 'ishuk@example.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxhdmF0YXJ8ZW58MHx8fHwxNzY0OTUyOTcyfDA&ixlib=rb-4.1.0&q=85',
  bio: 'Living life one photo at a time 📸',
  website: 'https://johndoe.com',
  postsCount: 42,
  followersCount: 1234,
  followingCount: 567,
  isPrivate: false,
  isVerified: false
};

export const users = [
  {
    id: 'user_2',
    username: 'emma_watson',
    fullName: 'Emma Watson',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxwZW9wbGUlMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjQ5ODE0MDd8MA&ixlib=rb-4.1.0&q=85',
    bio: 'Travel enthusiast 🌍',
    postsCount: 89,
    followersCount: 5432,
    followingCount: 234,
    isFollowing: true,
    isVerified: true
  },
  {
    id: 'user_3',
    username: 'mike_foodie',
    fullName: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwyfHxwZW9wbGUlMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjQ5ODE0MDd8MA&ixlib=rb-4.1.0&q=85',
    bio: 'Food lover 🍕',
    postsCount: 156,
    followersCount: 8921,
    followingCount: 445,
    isFollowing: false,
    isVerified: false
  },
  {
    id: 'user_4',
    username: 'sarah_style',
    fullName: 'Sarah Miller',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxhdmF0YXJ8ZW58MHx8fHwxNzY0OTUyOTcyfDA&ixlib=rb-4.1.0&q=85',
    bio: 'Fashion & lifestyle ✨',
    postsCount: 234,
    followersCount: 12453,
    followingCount: 678,
    isFollowing: true,
    isVerified: true
  },
  {
    id: 'user_5',
    username: 'alex_adventure',
    fullName: 'Alex Brown',
    avatar: 'https://images.unsplash.com/photo-1663250743287-f1979c44f741?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxwZW9wbGUlMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjQ5ODE0MDd8MA&ixlib=rb-4.1.0&q=85',
    bio: 'Adventure seeker 🏔️',
    postsCount: 67,
    followersCount: 3456,
    followingCount: 890,
    isFollowing: false,
    isVerified: false
  },
  {
    id: 'user_6',
    username: 'lisa_yoga',
    fullName: 'Lisa Anderson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxhdmF0YXJ8ZW58MHx8fHwxNzY0OTUyOTcyfDA&ixlib=rb-4.1.0&q=85',
    bio: 'Yoga instructor 🧘‍♀️',
    postsCount: 123,
    followersCount: 6789,
    followingCount: 234,
    isFollowing: true,
    isVerified: false
  }
];

export const posts = [
  {
    id: 'post_1',
    user: users[0],
    images: ['https://images.unsplash.com/photo-1707343848552-893e05dba6ac?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MXwxfHNlYXJjaHwxfHx0cmF2ZWx8ZW58MHx8fHwxNzY0OTgxNDQzfDA&ixlib=rb-4.1.0&q=85'],
    caption: 'Beautiful sunset views from the mountains! 🏔️ #travel #nature #adventure',
    likes: 1243,
    comments: 56,
    isLiked: false,
    isSaved: false,
    createdAt: '2025-01-05T14:30:00Z',
    location: 'Rocky Mountains'
  },
  {
    id: 'post_2',
    user: users[1],
    images: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwzfHxmb29kfGVufDB8fHx8MTc2NDk4MTQ0OHww&ixlib=rb-4.1.0&q=85',
      'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxmb29kfGVufDB8fHx8MTc2NDk4MTQ0OHww&ixlib=rb-4.1.0&q=85'
    ],
    caption: 'Pizza night with friends! 🍕 Nothing beats homemade pizza #foodie #pizza #yummy',
    likes: 3421,
    comments: 89,
    isLiked: true,
    isSaved: true,
    createdAt: '2025-01-05T12:15:00Z',
    location: 'New York City'
  },
  {
    id: 'post_3',
    user: users[2],
    images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxmYXNoaW9ufGVufDB8fHx8MTc2NDk4MTQ1NHww&ixlib=rb-4.1.0&q=85'],
    caption: 'Yellow mood 💛 #fashion #ootd #style',
    likes: 5678,
    comments: 234,
    isLiked: true,
    isSaved: false,
    createdAt: '2025-01-05T10:00:00Z'
  },
  {
    id: 'post_4',
    user: users[3],
    images: ['https://images.unsplash.com/photo-1500835556837-99ac94a94552?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHx0cmF2ZWx8ZW58MHx8fHwxNzY0OTgxNDQzfDA&ixlib=rb-4.1.0&q=85'],
    caption: 'Travel mode ON ✈️ Where should I go next? #travel #wanderlust',
    likes: 892,
    comments: 45,
    isLiked: false,
    isSaved: false,
    createdAt: '2025-01-04T18:30:00Z'
  },
  {
    id: 'post_5',
    user: users[4],
    images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxsaWZlc3R5bGV8ZW58MHx8fHwxNzY0OTgxNDM4fDA&ixlib=rb-4.1.0&q=85'],
    caption: 'Morning meditation 🧘‍♀️ Start your day right! #yoga #wellness #mindfulness',
    likes: 2341,
    comments: 67,
    isLiked: true,
    isSaved: true,
    createdAt: '2025-01-04T08:00:00Z'
  },
  {
    id: 'post_6',
    user: users[0],
    images: ['https://images.unsplash.com/photo-1482049016688-2d3e1b311543?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxmb29kfGVufDB8fHx8MTc2NDk4MTQ0OHww&ixlib=rb-4.1.0&q=85'],
    caption: 'Brunch goals 🥑🍳 #food #brunch #healthy',
    likes: 1567,
    comments: 34,
    isLiked: false,
    isSaved: false,
    createdAt: '2025-01-03T11:30:00Z'
  }
];

export const stories = [
  {
    id: 'story_1',
    user: currentUser,
    items: [
      {
        id: 'story_item_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxsaWZlc3R5bGV8ZW58MHx8fHwxNzY0OTgxNDM4fDA&ixlib=rb-4.1.0&q=85',
        createdAt: '2025-01-05T10:00:00Z',
        viewed: false
      }
    ],
    hasUnviewed: true
  },
  {
    id: 'story_2',
    user: users[0],
    items: [
      {
        id: 'story_item_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwzfHx0cmF2ZWx8ZW58MHx8fHwxNzY0OTgxNDQzfDA&ixlib=rb-4.1.0&q=85',
        createdAt: '2025-01-05T09:30:00Z',
        viewed: false
      }
    ],
    hasUnviewed: true
  },
  {
    id: 'story_3',
    user: users[1],
    items: [
      {
        id: 'story_item_3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxmb29kfGVufDB8fHx8MTc2NDk4MTQ0OHww&ixlib=rb-4.1.0&q=85',
        createdAt: '2025-01-05T08:00:00Z',
        viewed: true
      }
    ],
    hasUnviewed: false
  },
  {
    id: 'story_4',
    user: users[2],
    items: [
      {
        id: 'story_item_4',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHxmYXNoaW9ufGVufDB8fHx8MTc2NDk4MTQ1NHww&ixlib=rb-4.1.0&q=85',
        createdAt: '2025-01-05T07:00:00Z',
        viewed: true
      }
    ],
    hasUnviewed: false
  }
];

export const comments = [
  {
    id: 'comment_1',
    postId: 'post_1',
    user: users[1],
    text: 'Amazing view! 😍',
    likes: 23,
    createdAt: '2025-01-05T15:00:00Z'
  },
  {
    id: 'comment_2',
    postId: 'post_1',
    user: users[2],
    text: 'I need to visit this place!',
    likes: 12,
    createdAt: '2025-01-05T15:30:00Z'
  },
  {
    id: 'comment_3',
    postId: 'post_2',
    user: users[0],
    text: 'Looks delicious! 🍕',
    likes: 45,
    createdAt: '2025-01-05T13:00:00Z'
  }
];

export const messages = [
  {
    id: 'conversation_1',
    user: users[0],
    lastMessage: 'Hey! How are you?',
    lastMessageTime: '2025-01-05T14:00:00Z',
    unreadCount: 2,
    messages: [
      {
        id: 'msg_1',
        senderId: 'user_2',
        text: 'Hey! How are you?',
        createdAt: '2025-01-05T14:00:00Z'
      },
      {
        id: 'msg_2',
        senderId: 'user_1',
        text: 'I\'m good! Just got back from hiking',
        createdAt: '2025-01-05T14:05:00Z'
      }
    ]
  },
  {
    id: 'conversation_2',
    user: users[1],
    lastMessage: 'That pizza looks amazing!',
    lastMessageTime: '2025-01-05T12:30:00Z',
    unreadCount: 0,
    messages: [
      {
        id: 'msg_3',
        senderId: 'user_3',
        text: 'That pizza looks amazing!',
        createdAt: '2025-01-05T12:30:00Z'
      }
    ]
  },
  {
    id: 'conversation_3',
    user: users[2],
    lastMessage: 'Love your style! Where did you get that outfit?',
    lastMessageTime: '2025-01-04T20:15:00Z',
    unreadCount: 1,
    messages: []
  }
];

export const notifications = [
  {
    id: 'notif_1',
    type: 'like',
    user: users[0],
    post: posts[0],
    text: 'liked your post',
    createdAt: '2025-01-05T14:30:00Z',
    read: false
  },
  {
    id: 'notif_2',
    type: 'comment',
    user: users[1],
    post: posts[1],
    text: 'commented: "Looks delicious! 🍕"',
    createdAt: '2025-01-05T13:00:00Z',
    read: false
  },
  {
    id: 'notif_3',
    type: 'follow',
    user: users[2],
    text: 'started following you',
    createdAt: '2025-01-05T10:00:00Z',
    read: true
  }
];
