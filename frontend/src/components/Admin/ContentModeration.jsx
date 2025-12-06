import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const ContentModeration = () => {
  const { toast } = useToast();
  
  const [flaggedPosts] = useState([
    {
      id: 1,
      user: { username: 'user123', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde' },
      image: 'https://images.unsplash.com/photo-1707343848552-893e05dba6ac',
      reason: 'Inappropriate content',
      reports: 5,
      date: '2025-01-05'
    },
    {
      id: 2,
      user: { username: 'artist456', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330' },
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
      reason: 'Spam',
      reports: 3,
      date: '2025-01-04'
    },
  ]);

  const [reportedUsers] = useState([
    {
      id: 1,
      username: 'spammer123',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6',
      reason: 'Spam behavior',
      reports: 12,
      date: '2025-01-05'
    },
    {
      id: 2,
      username: 'fake_user',
      avatar: 'https://images.unsplash.com/photo-1663250743287-f1979c44f741',
      reason: 'Impersonation',
      reports: 8,
      date: '2025-01-04'
    },
  ]);

  const handleApprove = (type, id) => {
    toast({
      title: 'Content Approved',
      description: `${type} has been approved and reports cleared`,
    });
  };

  const handleReject = (type, id) => {
    toast({
      title: 'Content Removed',
      description: `${type} has been removed from the platform`,
      variant: 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Moderation</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="posts">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="posts">Flagged Posts ({flaggedPosts.length})</TabsTrigger>
            <TabsTrigger value="users">Reported Users ({reportedUsers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            <div className="space-y-4">
              {flaggedPosts.map((post) => (
                <div key={post.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex gap-4">
                    <img
                      src={post.image}
                      alt="Flagged post"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.user.avatar} />
                          <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{post.user.username}</span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-500">{post.reason}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {post.reports} reports • Reported on {post.date}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove('Post', post.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject('Post', post.id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {flaggedPosts.length === 0 && (
                <div className="text-center py-16">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No flagged posts to review</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-4">
              {reportedUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{user.username}</h3>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2">
                          <Flag className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-500">{user.reason}</span>
                        </div>
                        <p className="text-sm text-gray-500">
                          {user.reports} reports • Reported on {user.date}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Eye className="w-4 h-4" />
                          View Profile
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => handleApprove('User', user.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                          Clear Reports
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleReject('User', user.id)}
                        >
                          <XCircle className="w-4 h-4" />
                          Ban User
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {reportedUsers.length === 0 && (
                <div className="text-center py-16">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500">No reported users to review</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ContentModeration;
