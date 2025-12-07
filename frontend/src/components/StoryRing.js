import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';

export default function StoryRing({ user, stories, index }) {
  const navigate = useNavigate();
  const hasUnread = stories.length > 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      data-testid={`story-ring-${user.user_id}`}
      onClick={() => navigate(`/story/${stories[0]?.story_id}`)}
      className="flex flex-col items-center gap-2 cursor-pointer"
    >
      <div className={`p-0.5 rounded-full ${hasUnread ? 'story-ring' : 'border-2 border-border'}`}>
        <Avatar className="w-16 h-16 border-2 border-background">
          <AvatarImage src={user.profile_picture} />
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      </div>
      <span className="text-xs max-w-[70px] truncate">{user.username}</span>
    </motion.div>
  );
}