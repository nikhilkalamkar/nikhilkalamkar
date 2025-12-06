import React, { useState } from 'react';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BoostPostModal from '../Post/BoostPostModal';

const Post = ({ post, onLike, onSave, onComment }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [liked, setLiked] = useState(post.isLiked);
  const [saved, setSaved] = useState(post.isSaved);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    onLike?.(post.id, newLiked);
  };

  const handleSave = () => {
    const newSaved = !saved;
    setSaved(newSaved);
    onSave?.(post.id, newSaved);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => (prev > 0 ? prev - 1 : post.images.length - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => (prev < post.images.length - 1 ? prev + 1 : 0));
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 mb-4">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/profile/${post.user.username}`)}>
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.user.avatar} />
            <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1">
            <span className="font-semibold text-sm">{post.user.username}</span>
            {post.user.isVerified && (
              <svg className="w-3 h-3 text-blue-500 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            )}
            {post.location && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-gray-500">{post.location}</span>
              </>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Post Image(s) */}
      <div className="relative">
        <img
          src={post.images[currentImageIndex]}
          alt="Post"
          className="w-full aspect-square object-cover"
        />
        
        {/* Carousel Controls */}
        {post.images.length > 1 && (
          <>
            <button
              onClick={handlePrevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 rounded-full p-1 hover:bg-white dark:hover:bg-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/80 rounded-full p-1 hover:bg-white dark:hover:bg-black transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Dots Indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {post.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-blue-500' : 'bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Post Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="hover:opacity-70 transition-opacity">
              <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 stroke-red-500' : ''}`} />
            </button>
            <button onClick={() => navigate(`/post/${post.id}`)} className="hover:opacity-70 transition-opacity">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button className="hover:opacity-70 transition-opacity">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button onClick={handleSave} className="hover:opacity-70 transition-opacity">
            <Bookmark className={`w-6 h-6 ${saved ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="font-semibold text-sm mb-1">
          {likesCount.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div className="text-sm">
          <span className="font-semibold mr-2">{post.user.username}</span>
          <span className="whitespace-pre-wrap">{post.caption}</span>
        </div>

        {/* View Comments */}
        {post.comments > 0 && (
          <button
            onClick={() => navigate(`/post/${post.id}`)}
            className="text-sm text-gray-500 mt-1 hover:text-gray-700 dark:hover:text-gray-300"
          >
            View all {post.comments} comments
          </button>
        )}

        {/* Time */}
        <div className="text-xs text-gray-400 mt-1 uppercase">
          {formatTimeAgo(post.createdAt)} ago
        </div>

        {/* Boost Button - Only for post owner */}
        {currentUser?.username === post.user.username && (
          <Button
            onClick={() => setShowBoostModal(true)}
            variant="outline"
            size="sm"
            className="mt-3 w-full gap-2 border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/10"
          >
            <TrendingUp className="w-4 h-4" />
            Boost this post
          </Button>
        )}
      </div>

      {/* Boost Modal */}
      {showBoostModal && (
        <BoostPostModal
          post={post}
          onClose={() => setShowBoostModal(false)}
        />
      )}
    </div>
  );
};

export default Post;
