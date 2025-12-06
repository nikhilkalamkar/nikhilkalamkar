import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Type, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 50MB',
        variant: 'destructive'
      });
      return;
    }

    const fileType = file.type.startsWith('image/') ? 'image' : 'video';
    setSelectedMedia({
      file,
      preview: URL.createObjectURL(file),
      type: fileType
    });
  };

  const handleCreateStory = async () => {
    if (!selectedMedia) {
      toast({
        title: 'No media selected',
        description: 'Please select an image or video',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Try to upload to backend first
      try {
        const formData = new FormData();
        formData.append('media', selectedMedia.file);
        formData.append('type', selectedMedia.type);

        await axios.post(
          `${BACKEND_URL}/api/stories/create`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            withCredentials: true
          }
        );

        toast({
          title: 'Story posted! 🎉',
          description: 'Your story is now live for 24 hours',
        });
      } catch (apiError) {
        // Fallback to localStorage if API fails
        console.log('API failed, using localStorage:', apiError);
        
        const mockStory = {
          id: `story_${Date.now()}`,
          user: currentUser,
          items: [{
            id: `item_${Date.now()}`,
            type: selectedMedia.type,
            url: selectedMedia.preview,
            createdAt: new Date().toISOString(),
            viewed: false
          }],
          hasUnviewed: true
        };

        const existingStories = JSON.parse(localStorage.getItem('ishukart_stories') || '[]');
        existingStories.unshift(mockStory);
        localStorage.setItem('ishukart_stories', JSON.stringify(existingStories));

        toast({
          title: 'Story posted! 🎉',
          description: 'Your story is now live (saved locally)',
        });
      }
      
      if (onStoryCreated) {
        onStoryCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating story:', error);
      toast({
        title: 'Failed to create story',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold">Create Story</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedMedia ? (
            <div className="space-y-4">
              <label
                htmlFor="story-image-input"
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer active:scale-95"
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold mb-2">Add Photo</p>
                <p className="text-sm text-gray-500">Tap to select a photo</p>
                <input
                  id="story-image-input"
                  ref={(el) => {
                    if (el && !fileInputRef.current) fileInputRef.current = el;
                  }}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
              </label>

              <label
                htmlFor="story-video-input"
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-purple-400 transition-colors cursor-pointer active:scale-95"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold mb-2">Add Video</p>
                <p className="text-sm text-gray-500">Tap to select a video</p>
                <input
                  id="story-video-input"
                  type="file"
                  accept="video/*"
                  capture="environment"
                  onChange={handleMediaSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.preview}
                    alt="Story preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedMedia.preview}
                    className="w-full h-full object-contain"
                    controls
                  />
                )}
                <button
                  onClick={() => {
                    URL.revokeObjectURL(selectedMedia.preview);
                    setSelectedMedia(null);
                  }}
                  className="absolute top-4 right-4 bg-white/80 dark:bg-black/80 text-gray-800 dark:text-white rounded-full p-2 hover:bg-white dark:hover:bg-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                <p className="text-sm text-center">
                  <strong>Note:</strong> Your story will be visible for 24 hours
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleMediaSelect}
            className="hidden"
          />
        </div>

        {/* Footer */}
        {selectedMedia && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                URL.revokeObjectURL(selectedMedia.preview);
                setSelectedMedia(null);
              }}
              className="flex-1"
            >
              Change
            </Button>
            <Button
              onClick={handleCreateStory}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Share Story'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStoryModal;
