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
      // Create FormData for file upload
      const formData = new FormData();
      selectedImages.forEach((img, index) => {
        formData.append('images', img.file);
      });
      formData.append('caption', caption);
      formData.append('location', location);

      // Upload post
      const response = await axios.post(
        `${BACKEND_URL}/api/posts/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          withCredentials: true
        }
      );

      toast({
        title: 'Post created! 🎉',
        description: 'Your post has been published successfully',
      });

      // Clean up
      selectedImages.forEach(img => URL.revokeObjectURL(img.preview));
      
      if (onPostCreated) {
        onPostCreated(response.data);
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Failed to create post',
        description: error.response?.data?.detail || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
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

          {/* Caption */}
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            className="min-h-[100px] mb-4 resize-none"
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

          {/* Image Upload Area */}
          {selectedImages.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center cursor-pointer hover:border-purple-400 transition-colors"
            >
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-semibold mb-2">Select photos</p>
              <p className="text-sm text-gray-500">or drag and drop</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selectedImages.map((img, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={img.preview}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={selectedImages.length >= 10}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Add more photos ({selectedImages.length}/10)
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            disabled={loading || selectedImages.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
