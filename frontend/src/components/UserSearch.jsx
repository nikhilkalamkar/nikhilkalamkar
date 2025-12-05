import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, User, Phone, Loader2, UserPlus, X, Check, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import axiosInstance from '../api/axios';
import { toast } from '../hooks/use-toast';
import UserProfile from './UserProfile';

const UserSearch = ({ open, onClose, onUserSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [friendshipStatuses, setFriendshipStatuses] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      toast({
        title: 'Invalid Search',
        description: 'Please enter at least 2 characters to search',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await axiosInstance.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(response.data);
      
      // Fetch friendship status for each user
      if (response.data.length > 0) {
        const statuses = {};
        await Promise.all(
          response.data.map(async (user) => {
            try {
              const statusRes = await axiosInstance.get(`/friends/status/${user.id}`);
              statuses[user.id] = statusRes.data.status;
            } catch (err) {
              statuses[user.id] = 'not_friends';
            }
          })
        );
        setFriendshipStatuses(statuses);
      }
      
      if (response.data.length === 0) {
        toast({
          title: 'No Results',
          description: 'No users found matching your search'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to search users',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (user) => {
    try {
      await axiosInstance.post('/friends/request', { receiverId: user.id });
      
      // Update status
      setFriendshipStatuses({
        ...friendshipStatuses,
        [user.id]: 'request_sent'
      });
      
      toast({
        title: 'Request Sent',
        description: `Friend request sent to ${user.name}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send friend request',
        variant: 'destructive'
      });
    }
  };

  const handleChatWithFriend = (user) => {
    onUserSelect(user);
    setSearchQuery('');
    setSearchResults([]);
    setFriendshipStatuses({});
    onClose();
  };

  const handleViewProfile = (userId) => {
    setSelectedUserId(userId);
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
    setSelectedUserId(null);
    // Refresh search results to update status
    if (searchResults.length > 0) {
      handleSearch();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getActionButton = (user) => {
    const status = friendshipStatuses[user.id];
    
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewProfile(user.id)}
          className="h-8"
        >
          <Eye className="h-4 w-4" />
        </Button>
        
        {status === 'friends' ? (
          <Button
            size="sm"
            onClick={() => handleChatWithFriend(user)}
            className="bg-blue-600 hover:bg-blue-700 h-8"
          >
            Chat
          </Button>
        ) : status === 'request_sent' ? (
          <Badge variant="secondary" className="text-xs flex items-center h-8 px-3">
            Sent
          </Badge>
        ) : status === 'request_received' ? (
          <Badge variant="default" className="text-xs bg-green-600 flex items-center h-8 px-3">
            Accept
          </Badge>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendRequest(user)}
            className="h-8"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
              autoFocus
            />
          </div>
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {searchResults.length === 0 && !isSearching && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Search users by name or mobile number</p>
              <p className="text-xs text-gray-400 mt-1">Enter at least 2 characters</p>
            </div>
          )}

          {searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              {/* Avatar */}
              <div className="relative">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {/* Online Status */}
                {user.status === 'online' && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{user.name}</p>
                  {user.isPremium && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-1.5 py-0">
                      Premium
                    </Badge>
                  )}
                </div>
                {user.mobile && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Phone className="h-3 w-3" />
                    <span>{user.mobile}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {getActionButton(user)}
            </div>
          ))}
        </div>

        </div>

        {/* User Profile Modal */}
        <UserProfile
          open={showProfile}
          onClose={handleCloseProfile}
          userId={selectedUserId}
          onStartChat={handleChatWithFriend}
        />
      </DialogContent>
    </Dialog>
  );
};

export default UserSearch;
