import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { posts as mockPosts, comments as mockComments } from '../mock/mockData';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likedComments, setLikedComments] = useState({});

  useEffect(() => {
    // Load user posts from localStorage
    const userPosts = JSON.parse(localStorage.getItem('ishukart_posts') || '[]');
    
    // Combine with mock posts
    const allPosts = [...userPosts, ...mockPosts];
    
    // Find the post
    const foundPost = allPosts.find(p => p.id === postId);
    if (foundPost) {
      setPost(foundPost);
      setLiked(foundPost.isLiked || false);
      setSaved(foundPost.isSaved || false);
      setLikesCount(foundPost.likes || 0);
      
      // Get comments from localStorage
      const allComments = JSON.parse(localStorage.getItem('ishukart_comments') || '[]');
      const postComments = allComments.filter(c => c.postId === postId);
      
      // Merge with mock comments
      const mockPostComments = mockComments.filter(c => c.postId === postId);
      setComments([...postComments, ...mockPostComments]);
    }
  }, [postId]);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
  };

  const handleSave = () => {
    setSaved(!saved);
    toast({
      title: saved ? 'Post unsaved' : 'Post saved',
      description: saved ? 'Removed from your saved posts' : 'Added to your saved posts',
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      const newComment = {
        id: `comment_${Date.now()}`,
        postId: postId,
        user: currentUser,
        text: commentText,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      
      // Update state
      setComments([...comments, newComment]);
      setCommentText('');
      
      // Save to localStorage for persistence
      const allComments = JSON.parse(localStorage.getItem('ishukart_comments') || '[]');
      allComments.push(newComment);
      localStorage.setItem('ishukart_comments', JSON.stringify(allComments));
      
      toast({
        title: 'Comment posted',
        description: 'Your comment has been added',
      });
    }
  };

  const handleCommentLike = (commentId) => {
    const isLiked = likedComments[commentId];
    
    // Update liked state
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !isLiked
    }));
    
    // Update comment likes count
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: isLiked ? comment.likes - 1 : comment.likes + 1
        };
      }
      return comment;
    }));
    
    // Show feedback
    if (!isLiked) {
      toast({
        title: '❤️ Liked',
        description: 'You liked this comment',
      });
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now - postDate) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Post not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        {/* Post Image/Video */}
        <div className="bg-black flex items-center justify-center">
          {post.images[0]?.startsWith('data:video/') ? (
            <video
              src={post.images[0]}
              controls
              className="w-full h-full object-contain max-h-[600px]"
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={post.images[0]}
              alt="Post"
              className="w-full h-full object-contain max-h-[600px]"
            />
          )}
        </div>

        {/* Post Details and Comments */}
        <div className="flex flex-col h-[600px]">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
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
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Caption */}
            <div className="flex gap-3 mb-4">
              <Avatar className="w-8 h-8">
                <AvatarImage src={post.user.avatar} />
                <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <span className="font-semibold mr-2">{post.user.username}</span>
                <span className="whitespace-pre-wrap">{post.caption}</span>
                <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(post.createdAt)}</p>
              </div>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => {
                const isCommentLiked = likedComments[comment.id];
                return (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={comment.user.avatar} />
                      <AvatarFallback>{comment.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div>
                        <span className="font-semibold mr-2">{comment.user.username}</span>
                        <span className="whitespace-pre-wrap">{comment.text}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{formatTimeAgo(comment.createdAt)}</span>
                        <button 
                          className={`hover:text-gray-700 dark:hover:text-gray-300 font-semibold ${
                            isCommentLiked ? 'text-red-500' : ''
                          }`}
                        >
                          {comment.likes} {comment.likes === 1 ? 'like' : 'likes'}
                        </button>
                        <button className="hover:text-gray-700 dark:hover:text-gray-300 font-semibold">Reply</button>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCommentLike(comment.id)}
                      className={`transition-all duration-200 hover:scale-110 ${
                        isCommentLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isCommentLiked ? 'fill-red-500' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Post Actions */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <button onClick={handleLike} className="hover:opacity-70 transition-opacity">
                  <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 stroke-red-500' : ''}`} />
                </button>
                <button className="hover:opacity-70 transition-opacity">
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

            <div className="font-semibold text-sm mb-2">
              {likesCount.toLocaleString()} likes
            </div>

            <div className="text-xs text-gray-400 uppercase">
              {formatTimeAgo(post.createdAt)}
            </div>
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} className="border-t border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <button type="button" className="text-gray-400 hover:text-gray-600">
                <Smile className="w-6 h-6" />
              </button>
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border-none focus-visible:ring-0 p-0"
              />
              {commentText.trim() && (
                <Button type="submit" variant="ghost" className="text-blue-500 font-semibold p-0">
                  Post
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
