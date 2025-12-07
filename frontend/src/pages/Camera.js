import { useState, useContext, useRef } from 'react';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import { Camera as CameraIcon, Image as ImageIcon, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const placeholderImages = [
  'https://images.unsplash.com/photo-1758275557473-6e6359ced762?w=800',
  'https://images.unsplash.com/photo-1758275557784-39516582a05d?w=800',
  'https://images.unsplash.com/photo-1660214332007-d0f2612f0632?w=800',
  'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=800',
];

export default function Camera() {
  const { user, token } = useContext(AuthContext);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [text, setText] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('snap');
  const fileInputRef = useRef(null);

  const handleCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          setSelectedImage(dataUrl);
          setImageUrl(dataUrl);
          fetchFriends();
          setShowDialog(true);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error('Please select an image or video file');
      }
    }
  };

  const handleUsePlaceholder = () => {
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    setSelectedImage(randomImage);
    setImageUrl(randomImage);
    fetchFriends();
    setShowDialog(true);
  };

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

  const handleSend = async () => {
    if (!imageUrl) {
      toast.error('Please select an image');
      return;
    }

    if (type === 'snap' && !selectedFriend) {
      toast.error('Please select a friend');
      return;
    }

    setLoading(true);
    try {
      if (type === 'snap') {
        await axios.post(`${API}/snaps`, {
          recipient_id: selectedFriend,
          image_url: imageUrl,
          text
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Snap sent!');
      } else {
        await axios.post(`${API}/stories`, {
          image_url: imageUrl,
          text
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Story posted!');
      }
      setShowDialog(false);
      setSelectedImage('');
      setImageUrl('');
      setText('');
      setSelectedFriend('');
    } catch (error) {
      toast.error('Failed to send');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-40" data-testid="camera-page">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />
      
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#F5E618] rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#EC4899] rounded-full blur-3xl" />
          </div>
        </div>
        
        <div className="relative text-center z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CameraIcon size={80} className="text-white mx-auto mb-6" strokeWidth={1.5} />
            <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Ready to Snap?
            </h2>
            <p className="text-gray-300 mb-8">Capture a moment or share a story</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleCapture}
                className="bg-[#F5E618] text-black font-bold rounded-full h-14 px-8 hover:scale-105 transition-transform shadow-2xl"
                data-testid="capture-btn"
              >
                <ImageIcon className="mr-2" size={20} />
                Choose Photo
              </Button>
              <Button
                onClick={handleUsePlaceholder}
                className="bg-[#EC4899] text-white font-bold rounded-full h-14 px-8 hover:scale-105 transition-transform shadow-2xl"
                data-testid="placeholder-btn"
              >
                <Upload className="mr-2" size={20} />
                Use Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" data-testid="send-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Send Your Snap
            </DialogTitle>
            <DialogDescription>Choose to send a snap to a friend or post a story for everyone.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedImage && (
              <img src={selectedImage} alt="Selected" className="w-full aspect-[9/16] object-cover rounded-2xl" />
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={() => setType('snap')}
                className={`flex-1 rounded-full font-bold ${
                  type === 'snap' ? 'bg-[#F5E618] text-black' : 'bg-gray-100 text-gray-600'
                }`}
                data-testid="snap-type-btn"
              >
                Send Snap
              </Button>
              <Button
                onClick={() => setType('story')}
                className={`flex-1 rounded-full font-bold ${
                  type === 'story' ? 'bg-[#EC4899] text-white' : 'bg-gray-100 text-gray-600'
                }`}
                data-testid="story-type-btn"
              >
                Post Story
              </Button>
            </div>

            <Input
              placeholder="Image URL (or use placeholder)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="image-url-input"
            />

            <Input
              placeholder="Add a caption..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-12 rounded-xl"
              data-testid="caption-input"
            />

            {type === 'snap' && (
              <select
                value={selectedFriend}
                onChange={(e) => setSelectedFriend(e.target.value)}
                className="w-full h-12 rounded-xl border bg-gray-50 px-4 font-medium"
                data-testid="friend-select"
              >
                <option value="">Select a friend</option>
                {friends.map(friend => (
                  <option key={friend.user_id} value={friend.user_id}>
                    {friend.username}
                  </option>
                ))}
              </select>
            )}

            <Button
              onClick={handleSend}
              disabled={loading}
              className="w-full bg-[#F5E618] text-black font-bold rounded-full h-12 hover:scale-105 transition-transform"
              data-testid="send-btn"
            >
              {loading ? 'Sending...' : type === 'snap' ? 'Send Snap' : 'Post Story'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}