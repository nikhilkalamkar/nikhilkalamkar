import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Upload, DollarSign, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function CreateStoryDialog({ onStoryCreated }) {
  const { token } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadedStories, setUploadedStories] = useState([]);
  const [selectedTier, setSelectedTier] = useState('free');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [], 'video/*': [] },
    multiple: true,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFiles(acceptedFiles);
      }
    },
  });
  
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUploadAll = async () => {
    for (let i = 0; i < selectedFiles.length; i++) {
      setUploadingIndex(i);
      await uploadSingleStory(selectedFiles[i], i);
    }
    setUploadingIndex(null);
    toast.success(`${selectedFiles.length} ${selectedFiles.length === 1 ? 'story' : 'stories'} uploaded!`);
  };
  
  const uploadSingleStory = async (file, index) => {
    const formData = new FormData();
    formData.append('media', file);
    
    try {
      const response = await axios.post(`${API_URL}/stories`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setUploadedStories(prev => [...prev, response.data.story_id]);
      onStoryCreated();
      return response.data.story_id;
    } catch (error) {
      toast.error(`Failed to upload story ${index + 1}`);
      return null;
    }
  };
  
  const handlePromote = async (storyId) => {
    if (!razorpayLoaded) {
      toast.error('Payment system loading...');
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_URL}/stories/${storyId}/promote`,
        { tier: selectedTier },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const options = {
        key: response.data.key,
        amount: response.data.amount,
        currency: 'INR',
        name: 'ishukart',
        description: 'Story Promotion',
        order_id: response.data.order_id,
        handler: async (paymentResponse) => {
          try {
            await axios.post(
              `${API_URL}/stories/${storyId}/promote/verify`,
              {
                payment_id: paymentResponse.razorpay_payment_id,
                order_id: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Story promoted successfully!');
            onStoryCreated();
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
  
  const handleFinish = () => {
    setOpen(false);
    setSelectedFiles([]);
    setUploadedStories([]);
    setUploadingIndex(null);
    if (uploadedStories.length > 0) {
      toast.success('Stories published! Visible to your friends.');
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
      <DialogContent className="glass-effect max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Create Story</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {selectedFiles.length === 0 ? (
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
                {isDragActive ? 'Drop the files here' : 'Drag & drop or click to select'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Images or videos • Multiple files supported</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-3 bg-secondary rounded-xl p-3">
                    {file.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt="Preview" 
                        className="h-12 w-12 object-cover rounded-lg"
                      />
                    ) : (
                      <video 
                        src={URL.createObjectURL(file)} 
                        className="h-12 w-12 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    {uploadingIndex === index ? (
                      <div className="text-primary">Uploading...</div>
                    ) : uploadedStories.length > index ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="rounded-full h-8 w-8 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {uploadedStories.length === 0 ? (
                <>
                  <Button
                    data-testid="upload-stories-button"
                    onClick={handleUploadAll}
                    disabled={uploadingIndex !== null}
                    className="w-full rounded-full h-12 font-bold uppercase tracking-wide neon-shadow"
                  >
                    {uploadingIndex !== null ? `Uploading ${uploadingIndex + 1}/${selectedFiles.length}...` : `Upload ${selectedFiles.length} ${selectedFiles.length === 1 ? 'Story' : 'Stories'}`}
                  </Button>
                  
                  <Button
                    data-testid="cancel-upload-button"
                    onClick={() => setSelectedFiles([])}
                    variant="ghost"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-3 py-2">
                    <p className="text-sm font-semibold text-center">Promote Your Stories?</p>
                    
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
                            <p className="font-bold text-base">Keep Free</p>
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
                          <p className="text-xs text-muted-foreground mb-1">Basic</p>
                          <p className="font-bold text-lg">₹50<span className="text-xs font-normal">/day</span></p>
                          <p className="text-xs text-muted-foreground">~10k views</p>
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
                          <p className="text-xs text-muted-foreground mb-1">Premium</p>
                          <p className="font-bold text-lg">₹100<span className="text-xs font-normal">/day</span></p>
                          <p className="text-xs text-muted-foreground">~20k views</p>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {selectedTier === 'free' ? (
                    <Button
                      data-testid="finish-button"
                      onClick={handleFinish}
                      className="w-full rounded-full h-12 font-bold uppercase tracking-wide neon-shadow"
                    >
                      Finish & Publish
                    </Button>
                  ) : (
                    <>
                      <p className="text-sm text-center text-muted-foreground">
                        Total: ₹{(selectedTier === 'basic' ? 50 : 100) * uploadedStories.length} for {uploadedStories.length} {uploadedStories.length === 1 ? 'story' : 'stories'}
                      </p>
                      <div className="space-y-2">
                        {uploadedStories.map((storyId, index) => (
                          <Button
                            key={storyId}
                            data-testid={`promote-story-${index}-button`}
                            onClick={() => handlePromote(storyId)}
                            variant="outline"
                            className="w-full rounded-full"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Promote Story {index + 1} (₹{selectedTier === 'basic' ? '50' : '100'})
                          </Button>
                        ))}
                      </div>
                      <Button
                        data-testid="skip-promotion-button"
                        onClick={handleFinish}
                        variant="ghost"
                        className="w-full"
                      >
                        Skip & Publish Free
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}