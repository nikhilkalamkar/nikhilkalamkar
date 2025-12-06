import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Search as SearchIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Search = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setSearching(true);
      try {
        // Call backend API to search users
        const response = await axios.get(`${BACKEND_URL}/api/users/search`, {
          params: { q: query },
          withCredentials: true
        });
        
        setSearchResults(response.data.users || []);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleUserClick = (user) => {
    // Add to recent searches
    setRecentSearches(prev => {
      const filtered = prev.filter(u => u.id !== user.id);
      return [user, ...filtered].slice(0, 10);
    });
    navigate(`/profile/${user.username}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeRecentSearch = (userId) => {
    setRecentSearches(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Search Input */}
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results or Recent */}
      <div>
        {searchQuery ? (
          // Search Results
          <div>
            <h2 className="text-sm font-semibold text-gray-500 mb-4">RESULTS</h2>
            {searching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                    onClick={() => handleUserClick(user)}
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
                      <p className="text-xs text-gray-400">{user.followersCount} followers</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No results found</p>
            )}
          </div>
        ) : (
          // Recent Searches
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Recent</h2>
              {recentSearches.length > 0 && (
                <button
                  onClick={() => setRecentSearches([])}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Clear all
                </button>
              )}
            </div>
            {recentSearches.length > 0 ? (
              <div className="space-y-2">
                {recentSearches.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900"
                  >
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{user.username}</p>
                        <p className="text-sm text-gray-500">{user.fullName}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeRecentSearch(user.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No recent searches</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
