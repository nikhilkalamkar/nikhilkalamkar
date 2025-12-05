import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  X, 
  Mail, 
  Phone, 
  Users, 
  Crown, 
  MessageCircle,
  UserPlus,
  UserCheck,
  Loader2
} from 'lucide-react';
import axiosInstance from '../api/axios';
import { toast } from '../hooks/use-toast';

const UserProfile = ({ open, onClose, userId, onSendRequest, onStartChat }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/users/profile/${userId}`);
      setProfile(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive'
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    try {
      await axiosInstance.post('/friends/request', { receiverId: userId });
      
      toast({
        title: 'Request Sent',
        description: `Friend request sent to ${profile.name}`
      });
      
      // Update profile status
      setProfile({ ...profile, friendshipStatus: 'request_sent' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send friend request',
        variant: 'destructive'
      });
    }
  };

  const handleChat = () => {
    if (onStartChat) {
      onStartChat({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        status: profile.status,
        isPremium: profile.isPremium
      });
    }
    onClose();
  };

  const getActionButton = () => {
    if (!profile) return null;

    if (profile.friendshipStatus === 'self') {
      return null;
    } else if (profile.friendshipStatus === 'friends') {
      return (
        <Button onClick={handleChat} className="w-full bg-blue-600 hover:bg-blue-700">
          <MessageCircle className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      );
    } else if (profile.friendshipStatus === 'request_sent') {
      return (
        <Button disabled className="w-full" variant="secondary">
          <UserCheck className="h-4 w-4 mr-2" />
          Request Sent
        </Button>
      );
    } else if (profile.friendshipStatus === 'request_received') {
      return (
        <Button className="w-full bg-green-600 hover:bg-green-700">
          <UserCheck className="h-4 w-4 mr-2" />
          Accept Request
        </Button>
      );
    } else {
      return (
        <Button onClick={handleSendRequest} className="w-full bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Friend
        </Button>
      );
    }
  };

  if (loading || !profile) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        {/* Header with Avatar */}
        <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-t-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-col items-center text-white">
            {/* Avatar */}
            {profile.avatar ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg mb-3"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-3xl font-bold mb-3">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Name and Status */}
            <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
            <div className="flex items-center gap-2">
              <Badge
                variant={profile.status === 'online' ? 'default' : 'secondary'}
                className={profile.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}
              >
                {profile.status}
              </Badge>
              {profile.isPremium && (
                <Badge className="bg-yellow-500">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-4">
          {/* Friend Count */}
          <div className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-lg">
            <Users className="h-5 w-5 text-blue-600" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile.friendCount}</p>
              <p className="text-sm text-gray-600">Friends</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            {profile.email && profile.friendshipStatus !== 'not_friends' && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{profile.email}</span>
              </div>
            )}

            {profile.mobile && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{profile.mobile}</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="pt-4">
            {getActionButton()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
