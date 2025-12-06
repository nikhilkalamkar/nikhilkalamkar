import React, { useState } from 'react';
import { posts as mockPosts } from '../../mock/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, Eye, Trash2, Star, Flag } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const PostsManagement = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredPosts = posts.filter(post =>
    post.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFeaturePost = (postId) => {
    toast({
      title: 'Post Featured',
      description: 'Post has been featured on explore page',
    });
  };

  const handleDeletePost = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
    toast({
      title: 'Post Deleted',
      description: 'Post has been permanently deleted',
      variant: 'destructive',
    });
  };

  const handleFlagPost = (postId) => {
    toast({
      title: 'Post Flagged',
      description: 'Post has been flagged for review',
      variant: 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Posts Management</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-gray-100 dark:bg-gray-900 relative group">
                <img
                  src={post.images[0]}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button variant="secondary" size="icon" title="View Post">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    title="Feature Post"
                    onClick={() => handleFeaturePost(post.id)}
                  >
                    <Star className="w-4 h-4 text-yellow-500" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    title="Flag Post"
                    onClick={() => handleFlagPost(post.id)}
                  >
                    <Flag className="w-4 h-4 text-orange-500" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    title="Delete Post"
                    onClick={() => handleDeletePost(post.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={post.user.avatar} />
                    <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-sm">{post.user.username}</span>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {post.caption}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{post.likes} likes</span>
                  <span>{post.comments} comments</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PostsManagement;
