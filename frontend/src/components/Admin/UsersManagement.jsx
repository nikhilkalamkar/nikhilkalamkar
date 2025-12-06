import React, { useState } from 'react';
import { users as mockUsers } from '../../mock/mockData';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Search, UserX, Eye, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const UsersManagement = () => {
  const [users, setUsers] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBlockUser = (userId) => {
    toast({
      title: 'User Blocked',
      description: 'User has been blocked successfully',
    });
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
    toast({
      title: 'User Deleted',
      description: 'User has been permanently deleted',
      variant: 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>User Management</span>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg font-semibold text-sm">
            <div className="col-span-4">User</div>
            <div className="col-span-2 text-center">Posts</div>
            <div className="col-span-2 text-center">Followers</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Actions</div>
          </div>

          {filteredUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="col-span-4 flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold">{user.username}</p>
                    {user.isVerified && (
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{user.fullName}</p>
                </div>
              </div>
              
              <div className="col-span-2 text-center">
                <p className="font-medium">{user.postsCount}</p>
              </div>
              
              <div className="col-span-2 text-center">
                <p className="font-medium">{user.followersCount}</p>
              </div>
              
              <div className="col-span-2 text-center">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                  user.isBlocked ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                }`}>
                  {user.isBlocked ? <XCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                  {user.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              
              <div className="col-span-2 flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" title="View Profile">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Block User"
                  onClick={() => handleBlockUser(user.id)}
                >
                  <UserX className="w-4 h-4 text-orange-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete User"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UsersManagement;
