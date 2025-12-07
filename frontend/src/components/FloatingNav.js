import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, User, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  const navItems = [
    { icon: Home, path: '/', label: 'Home', testId: 'nav-home' },
    { icon: MessageCircle, path: '/', label: 'Chats', testId: 'nav-chats' },
    { icon: Plus, path: '/', label: 'Add', testId: 'nav-add' },
    { icon: User, path: '/profile', label: 'Profile', testId: 'nav-profile' },
  ];
  
  return (
    <nav
      data-testid="floating-nav"
      className="fixed bottom-6 left-4 right-4 h-16 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-around shadow-2xl z-50"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <motion.button
            key={item.label}
            data-testid={item.testId}
            onClick={() => navigate(item.path)}
            className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all ${
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon className="w-6 h-6" />
            {active && (
              <motion.div
                layoutId="active-nav"
                className="absolute inset-0 bg-primary rounded-full -z-10"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
}