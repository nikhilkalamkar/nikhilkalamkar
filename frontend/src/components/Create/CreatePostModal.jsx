import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Smile, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 10) {
      toast({
        title: 'Too many images',
        description: 'You can upload maximum 10 images',
        variant: 'destructive'
      });
      return;
    }

    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setSelectedImages([...selectedImages, ...newImages]);
  };

  const removeImage = (index) => {
    const newImages = [...selectedImages];
    URL.revokeObjectURL(newImages[index].preview);
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const handleCreatePost = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please select at least one image',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // For now, create a mock post since backend needs proper auth
      // This will be replaced with actual API call when auth is set up
      const mockPost = {
        id: `post_${Date.now()}`,
        user: currentUser,
        images: selectedImages.map(img => img.preview),
        caption: caption,
        location: location || null,
        likes: 0,
        comments: 0,
        isLiked: false,
        isSaved: false,
        createdAt: new Date().toISOString()
      };

      // Store in localStorage for now
      const existingPosts = JSON.parse(localStorage.getItem('ishukart_posts') || '[]');
      existingPosts.unshift(mockPost);
      localStorage.setItem('ishukart_posts', JSON.stringify(existingPosts));

      toast({
        title: 'Post created! 🎉',
        description: 'Your post has been published successfully',
      });

      // Clean up previews but keep data URLs for mock
      
      if (onPostCreated) {
        onPostCreated(mockPost);
      }
      
      onClose();
      window.location.reload(); // Refresh to show new post
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Failed to create post',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold">Create New Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{currentUser?.username}</p>
              <p className="text-xs text-gray-500">{currentUser?.fullName}</p>
            </div>
          </div>

          {/* Image/Video Upload Buttons - Like Story Modal */}
          {selectedImages.length === 0 ? (
            <div className="space-y-4 mb-4">
              <label
                htmlFor="post-image-input"
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors active:scale-[0.98] block"
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold mb-1">Add Photo</p>
                <p className="text-sm text-gray-500">Share a photo to your feed</p>
              </label>

              <label
                htmlFor="post-video-input"
                className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 transition-colors active:scale-[0.98] block"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-semibold mb-1">Add Video</p>
                <p className="text-sm text-gray-500">Share a video to your feed</p>
              </label>

              <input
                id="post-image-input"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                id="post-video-input"
                type="file"
                multiple
                accept="video/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          ) : null}

          {/* Caption */}
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="min-h-[80px] mb-4 resize-none"
          />

          {/* Location */}
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="flex-1"
            />
          </div>

          {/* Selected Images Preview */}
          {selectedImages.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold mb-2">Selected Media ({selectedImages.length}/10)</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={img.preview}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-purple-200"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 shadow-lg active:scale-90"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-purple-300 hover:bg-purple-50"
                disabled={selectedImages.length >= 10}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add more ({selectedImages.length}/10)
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2 sm:gap-3 bg-white dark:bg-gray-900">
          <Button variant="outline" onClick={onClose} className="flex-1 h-11">
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            disabled={loading || selectedImages.length === 0}
            className="flex-1 h-11 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              '✨ Share Post'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
