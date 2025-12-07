import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function CreateStoryDialog({ onStoryCreated }) {
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [createdStoryId, setCreatedStoryId] = useState(null);
  const [selectedTier, setSelectedTier] = useState('basic');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
  });
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('media', selectedFile);
    
    try {
      const response = await axios.post(`${API_URL}/stories`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setCreatedStoryId(response.data.story_id);
      toast.success('Story created! Choose a promotion plan below to boost visibility.');
      onStoryCreated();
    } catch (error) {
      toast.error('Failed to create story');
    } finally {
      setUploading(false);
    }
  };
  
  const handlePromote = async () => {
    if (!createdStoryId || !razorpayLoaded) {
      toast.error('Payment system loading...');
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_URL}/stories/${createdStoryId}/promote`,
        { tier: selectedTier },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const options = {
        key: response.data.key,
        amount: response.data.amount,
        currency: 'INR',
        name: 'SnapClone',
        description: 'Story Promotion',
        order_id: response.data.order_id,
        handler: async (paymentResponse) => {
          try {
            await axios.post(
              `${API_URL}/stories/${createdStoryId}/promote/verify`,
              {
                payment_id: paymentResponse.razorpay_payment_id,
                order_id: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Story promoted successfully!');
            setOpen(false);
            setCreatedStoryId(null);
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        theme: { color: '#CCFF00' },
      };
      
      if (window.Razorpay) {
        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.open();
      } else {
        toast.error('Payment system not available');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to initiate promotion');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          data-testid="create-story-button"
          className="flex flex-col items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center neon-shadow">
            <Plus className="w-8 h-8 text-primary-foreground" />
          </div>
          <span className="text-xs">Add Story</span>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="glass-effect">
        <DialogHeader>
          <DialogTitle className="font-heading">Create Story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedFile ? (
            <div
              {...getRootProps()}
              data-testid="dropzone"
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {isDragActive ? 'Drop the file here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Images or videos only</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-sm truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              
              <Button
                data-testid="upload-story-button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full rounded-full h-12 font-bold uppercase tracking-wide neon-shadow"
              >
                {uploading ? 'Uploading...' : 'Upload Story'}
              </Button>
              
              {createdStoryId && (
                <>
                  <div className="space-y-3 py-2">
                    <p className="text-sm font-semibold text-center">Choose Publishing Option:</p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        data-testid="tier-free"
                        onClick={() => setSelectedTier('free')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedTier === 'free'
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <p className="font-bold text-base">Publish Free</p>
                            <p className="text-xs text-muted-foreground">Share with friends only</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">FREE</p>
                          </div>
                        </div>
                      </button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          data-testid="tier-basic"
                          onClick={() => setSelectedTier('basic')}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedTier === 'basic'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">Basic</p>
                          <p className="font-bold">₹50</p>
                          <p className="text-xs text-muted-foreground">10k views</p>
                        </button>
                        <button
                          data-testid="tier-premium"
                          onClick={() => setSelectedTier('premium')}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selectedTier === 'premium'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <p className="text-xs text-muted-foreground">Premium</p>
                          <p className="font-bold">₹100</p>
                          <p className="text-xs text-muted-foreground">20k views</p>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTier === 'free' ? (
                    <Button
                      data-testid="publish-free-button"
                      onClick={() => {
                        setOpen(false);
                        setSelectedFile(null);
                        setCreatedStoryId(null);
                        toast.success('Story published! Visible to your friends.');
                      }}
                      className="w-full rounded-full h-12 font-bold uppercase tracking-wide neon-shadow"
                    >
                      Publish Story
                    </Button>
                  ) : (
                    <Button
                      data-testid="promote-story-button"
                      onClick={handlePromote}
                      className="w-full rounded-full h-12 font-bold uppercase tracking-wide neon-shadow"
                    >
                      <DollarSign className="w-5 h-5 mr-2" />
                      Promote Story (₹{selectedTier === 'basic' ? '50' : '100'})
                    </Button>
                  )}
                </>
              )}
              
              {!createdStoryId && (
                <Button
                  data-testid="cancel-upload-button"
                  onClick={() => {
                    setSelectedFile(null);
                    setCreatedStoryId(null);
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}