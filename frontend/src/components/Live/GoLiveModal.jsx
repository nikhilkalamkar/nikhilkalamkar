import React, { useState } from 'react';
import { X, Video } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoLiveModal = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleGoLive = () => {
    if (!title.trim()) {
      alert('Please enter a title for your live stream');
      return;
    }

    // Create live stream session
    const liveSession = {
      id: `live_${Date.now()}`,
      userId: currentUser?.id || currentUser?.user_id,
      username: currentUser?.username,
      avatar: currentUser?.avatar,
      title: title.trim(),
      viewerCount: 0,
      startedAt: new Date().toISOString(),
      isActive: true,
      comments: []
    };

    // Store in localStorage (would be backend in production)
    const activeLives = JSON.parse(localStorage.getItem('ishukart_live_streams') || '[]');
    activeLives.push(liveSession);
    localStorage.setItem('ishukart_live_streams', JSON.stringify(activeLives));

    // Navigate to live broadcast page
    navigate(`/live/${liveSession.id}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Go Live</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
            <Video className="w-16 h-16 text-white" />
          </div>
          <p className="text-sm text-gray-500 text-center mb-4">
            Ready to go live? Your followers will be notified.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Live Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your live about?"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              onClick={handleGoLive}
            >
              Go Live
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoLiveModal;
