import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Smile, MapPin, Video, Loader2 } from 'lucide-react';
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
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  // Debug log
  React.useEffect(() => {
    console.log('[CreatePostModal] Modal mounted and visible');
    return () => console.log('[CreatePostModal] Modal unmounted');
  }, []);

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
      // Convert images to base64 for persistent storage
      const imagePromises = selectedImages.map(img => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(img.file);
        });
      });

      const base64Images = await Promise.all(imagePromises);

      // Create post with base64 images
      const mockPost = {
        id: `post_${Date.now()}`,
        user: currentUser,
        images: base64Images,
        caption: caption,
        location: location || null,
        likes: 0,
        comments: 0,
        isLiked: false,
        isSaved: false,
        createdAt: new Date().toISOString()
      };

      // Store in localStorage
      const existingPosts = JSON.parse(localStorage.getItem('ishukart_posts') || '[]');
      existingPosts.unshift(mockPost);
      localStorage.setItem('ishukart_posts', JSON.stringify(existingPosts));

      toast({
        title: 'Post created! 🎉',
        description: 'Your post has been published successfully',
      });

      // Clean up blob URLs
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
      
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
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-xl font-semibold">Create New Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* DEBUG: Visible test element */}
          <div className="bg-red-500 text-white p-4 mb-4 text-center font-bold text-lg">
            ✅ MODAL IS LOADING! If you see this, modal works!
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3 mb-4 bg-blue-100 p-3 rounded">
            <Avatar className="w-10 h-10">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{currentUser?.username || 'Test User'}</p>
              <p className="text-sm text-gray-600">{currentUser?.fullName || 'Testing'}</p>
            </div>
          </div>

          {/* Image/Video Upload Buttons */}
          {selectedImages.length === 0 && (
            <div className="space-y-4 mb-4">
              {/* Photo Upload - SUPER VISIBLE */}
              <label 
                htmlFor="image-file-input"
                className="block w-full border-4 border-purple-500 bg-purple-50 rounded-xl p-8 text-center cursor-pointer active:bg-purple-100"
                style={{ minHeight: '120px' }}
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-10 h-10 text-white" />
                </div>
                <p className="text-2xl font-bold mb-2 text-purple-700">📸 TAP HERE FOR PHOTO</p>
                <p className="text-base text-purple-600">Select from your gallery</p>
              </label>

              {/* Video Upload - SUPER VISIBLE */}
              <label 
                htmlFor="video-file-input"
                className="block w-full border-4 border-blue-500 bg-blue-50 rounded-xl p-8 text-center cursor-pointer active:bg-blue-100"
                style={{ minHeight: '120px' }}
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="w-10 h-10 text-white" />
                </div>
                <p className="text-2xl font-bold mb-2 text-blue-700">🎥 TAP HERE FOR VIDEO</p>
                <p className="text-base text-blue-600">Select from your gallery</p>
              </label>

              {/* Hidden File Inputs */}
              <input
                id="image-file-input"
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                id="video-file-input"
                ref={videoInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>
          )}

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
                onClick={() => imageInputRef.current?.click()}
                className="w-full border-purple-300 hover:bg-purple-50"
                disabled={selectedImages.length >= 10}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add more ({selectedImages.length}/10)
              </Button>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3 bg-white dark:bg-gray-900 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            disabled={loading || selectedImages.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold"
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
