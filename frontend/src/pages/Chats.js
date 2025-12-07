import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { motion } from 'framer-motion';
import { MessageCircle, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function Chats() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API}/friends`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(`${API}/friends/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFriendRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const response = await axios.get(`${API}/users/search?q=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(response.data);
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      await axios.post(`${API}/friends/request?recipient_id=${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend request sent!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send request');
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      await axios.post(`${API}/friends/accept/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend request accepted!');
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      await axios.post(`${API}/friends/decline/${requestId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Friend request declined');
      fetchFriendRequests();
    } catch (error) {
      toast.error('Failed to decline request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 max-w-md mx-auto" data-testid="chats-page">
      <div className="px-6 pt-6 pb-4 bg-white border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Chats
          </h1>
          <Button
            onClick={() => setShowAddFriend(true)}
            className="bg-[#F5E618] text-black rounded-full w-12 h-12 p-0"
            data-testid="add-friend-btn"
          >
            <UserPlus size={20} />
          </Button>
        </div>
      </div>

      {friendRequests.length > 0 && (
        <div className="px-6 py-4 bg-yellow-50 border-b">
          <h2 className="font-bold mb-3">Friend Requests</h2>
          {friendRequests.map(request => (
            <div key={request.request_id} className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={request.sender_avatar || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
                  alt={request.sender_username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold">{request.sender_username}</p>
                  <p className="text-xs text-gray-500">wants to be friends</p>
                </div>
              </div>
              <Button
                onClick={() => acceptFriendRequest(request.request_id)}
                className="bg-[#F5E618] text-black rounded-full h-9 px-4 text-sm font-bold"
                data-testid={`accept-request-btn-${request.request_id}`}
              >
                Accept
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-4">
        {friends.length === 0 ? (
          <div className="text-center py-20">
            <MessageCircle size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 text-lg font-medium">No friends yet</p>
            <p className="text-gray-400 text-sm mt-2">Add friends to start chatting</p>
          </div>
        ) : (
          friends.map((friend) => (
            <motion.div
              key={friend.user_id}
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              onClick={() => navigate(`/chat/${friend.user_id}`)}
              className="flex items-center gap-4 p-4 hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
              data-testid={`chat-row-${friend.user_id}`}
            >
              <img
                src={friend.avatar_url || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
                alt={friend.username}
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-bold text-lg">{friend.username}</p>
                <p className="text-gray-500 text-sm">Tap to chat</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="max-w-md" data-testid="add-friend-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Add Friends
            </DialogTitle>
            <DialogDescription>Search for friends by username or email to connect with them.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by username or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="h-12 rounded-xl flex-1 bg-white border-2 border-gray-200 px-4"
                data-testid="search-users-input"
              />
              <Button
                onClick={handleSearch}
                className="bg-blue-600 text-white rounded-full h-12 w-12 p-0 hover:bg-blue-700"
                data-testid="search-btn"
              >
                <Search size={20} />
              </Button>
            </div>

            {searchResults.map(result => (
              <div key={result.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <img
                    src={result.avatar_url || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
                    alt={result.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold">{result.username}</p>
                    <p className="text-xs text-gray-500">{result.email}</p>
                  </div>
                </div>
                <Button
                  onClick={() => sendFriendRequest(result.user_id)}
                  className="bg-[#F5E618] text-black rounded-full h-9 px-4 text-sm font-bold"
                  data-testid={`send-request-btn-${result.user_id}`}
                >
                  Add
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}