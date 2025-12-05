import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { UserCheck, UserX, X, Clock, Users } from 'lucide-react';
import axiosInstance from '../api/axios';
import { toast } from '../hooks/use-toast';

const FriendRequests = ({ open, onClose, onRequestHandled }) => {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRequests();
    }
  }, [open]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [receivedRes, sentRes] = await Promise.all([
        axiosInstance.get('/friends/requests/received'),
        axiosInstance.get('/friends/requests/sent')
      ]);
      
      setReceivedRequests(receivedRes.data);
      setSentRequests(sentRes.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load friend requests',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId, senderName) => {
    try {
      await axiosInstance.put(`/friends/request/${requestId}/accept`);
      
      toast({
        title: 'Request Accepted',
        description: `You are now friends with ${senderName}`
      });
      
      // Remove from list
      setReceivedRequests(receivedRequests.filter(req => req.id !== requestId));
      
      if (onRequestHandled) {
        onRequestHandled();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to accept request',
        variant: 'destructive'
      });
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axiosInstance.put(`/friends/request/${requestId}/reject`);
      
      toast({
        title: 'Request Rejected',
        description: 'Friend request rejected'
      });
      
      // Remove from list
      setReceivedRequests(receivedRequests.filter(req => req.id !== requestId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject request',
        variant: 'destructive'
      });
    }
  };

  const handleCancel = async (requestId) => {
    try {
      await axiosInstance.delete(`/friends/request/${requestId}`);
      
      toast({
        title: 'Request Cancelled',
        description: 'Friend request cancelled'
      });
      
      // Remove from list
      setSentRequests(sentRequests.filter(req => req.id !== requestId));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel request',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Friend Requests
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="received" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              Received
              {receivedRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {receivedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          {/* Received Requests */}
          <TabsContent value="received" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : receivedRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                  >
                    {/* Avatar */}
                    {request.senderAvatar ? (
                      <img
                        src={request.senderAvatar}
                        alt={request.senderName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                        {request.senderName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{request.senderName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(request.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request.id, request.senderName)}
                        className="bg-green-600 hover:bg-green-700 h-8"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        className="h-8"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent" className="flex-1 overflow-y-auto mt-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                  >
                    {/* Avatar */}
                    {request.receiverAvatar ? (
                      <img
                        src={request.receiverAvatar}
                        alt={request.receiverName}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold">
                        {request.receiverName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{request.receiverName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Sent {formatTime(request.createdAt)}
                      </p>
                    </div>

                    {/* Cancel Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancel(request.id)}
                      className="h-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default FriendRequests;
