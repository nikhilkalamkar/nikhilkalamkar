import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const NewMessageModal = ({ onClose, onSelectUser }) => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setFilteredUsers([]);
        return;
      }

      setSearching(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/users/search`, {
          params: { q: searchQuery },
          withCredentials: true
        });
        
        setFilteredUsers(response.data.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setFilteredUsers([]);
      } finally {
        setSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelectUser = (user) => {
    if (selectedUsers.find(u => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleNext = () => {
    if (selectedUsers.length > 0) {
      onSelectUser(selectedUsers[0]); // For now, just use first selected user
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full mx-4 max-h-[600px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-semibold">New Message</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-500 font-semibold"
            onClick={handleNext}
            disabled={selectedUsers.length === 0}
          >
            Next
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {selectedUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-sm">
                  <span>{user.username}</span>
                  <button onClick={() => handleSelectUser(user)}>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length > 0 ? (
            <div>
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedUsers.find(u => u.id === user.id) ? 'bg-gray-50 dark:bg-gray-800' : ''
                  }`}
                  onClick={() => handleSelectUser(user)}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold">{user.username}</p>
                      {user.isVerified && (
                        <svg className="w-4 h-4 text-blue-500 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{user.fullName}</p>
                  </div>
                  {selectedUsers.find(u => u.id === user.id) && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-16">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewMessageModal;
