import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, MessageCircle, Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/stories', icon: Sparkles, label: 'Stories' },
    { path: '/chats', icon: MessageCircle, label: 'Chats' },
    { path: '/', icon: Camera, label: 'Camera', isCenter: true },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav 
      className="fixed bottom-6 left-4 right-4 max-w-md mx-auto bg-black/90 backdrop-blur-xl text-white rounded-full h-16 flex items-center justify-around shadow-2xl z-50"
      data-testid="bottom-nav"
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-14 h-14 bg-[rgb(37 99 235)] rounded-full -mt-8 shadow-lg"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <Icon size={28} className="text-black" strokeWidth={2.5} />
            </motion.button>
          );
        }

        return (
          <motion.button
            key={item.path}
            onClick={() => navigate(item.path)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
            data-testid={`nav-${item.label.toLowerCase()}`}
          >
            <Icon 
              size={24} 
              className={isActive ? 'text-[rgb(37 99 235)]' : 'text-white'} 
              strokeWidth={2}
            />
          </motion.button>
        );
      })}
    </nav>
  );
}