import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, TrendingUp, Eye, DollarSign, Sparkles, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import FloatingNav from '@/components/FloatingNav';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export default function MyStoriesPage() {
  const { token, user } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [selectedTier, setSelectedTier] = useState('basic');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    loadMyStories();
    
    // Load Razorpay script
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
  
  const loadMyStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filter only user's own stories
      const myStories = response.data.filter(story => story.user_id === user?.user_id);
      setStories(myStories);
    } catch (error) {
      toast.error('Failed to load stories');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePromoteClick = (story) => {
    setSelectedStory(story);
    setShowPromoteDialog(true);
  };
  
  const handleDeleteClick = (story) => {
    setStoryToDelete(story);
    setShowDeleteDialog(true);
  };
  
  const handleDelete = async () => {
    if (!storyToDelete) return;
    
    try {
      await axios.delete(`${API_URL}/stories/${storyToDelete.story_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Story deleted successfully');
      setShowDeleteDialog(false);
      setStoryToDelete(null);
      loadMyStories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete story');
    }
  };
  
  const handlePromote = async () => {
    if (!selectedStory || !razorpayLoaded) {
      toast.error('Payment system loading...');
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_URL}/stories/${selectedStory.story_id}/promote`,
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
              `${API_URL}/stories/${selectedStory.story_id}/promote/verify`,
              {
                payment_id: paymentResponse.razorpay_payment_id,
                order_id: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Story promoted successfully!');
            setShowPromoteDialog(false);
            setSelectedStory(null);
            loadMyStories();
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
  
  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m left`;
  };
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              data-testid="back-button"
              onClick={() => navigate('/')}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-heading font-bold">My Stories</h1>
          </div>
        </header>
        
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : stories.length === 0 ? (
            <Card className="glass-effect border-border/50">
              <CardContent className="py-12">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No stories yet</p>
                  <Button
                    onClick={() => navigate('/')}
                    className="mt-4 rounded-full"
                  >
                    Create Your First Story
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {stories.map((story, index) => (
                <motion.div
                  key={story.story_id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid={`story-${story.story_id}`}
                >
                  <Card className="glass-effect border-border/50 overflow-hidden">
                    <div className="relative">
                      {story.media_type === 'image' ? (
                        <img
                          src={story.media_url.startsWith('http') ? story.media_url : `${process.env.REACT_APP_BACKEND_URL}${story.media_url}`}
                          alt="Story"
                          className="w-full h-48 object-cover cursor-pointer"
                          onClick={() => navigate(`/story/${story.story_id}`)}
                        />
                      ) : (
                        <video
                          src={story.media_url.startsWith('http') ? story.media_url : `${process.env.REACT_APP_BACKEND_URL}${story.media_url}`}
                          className="w-full h-48 object-cover cursor-pointer"
                          onClick={() => navigate(`/story/${story.story_id}`)}
                        />
                      )}
                      
                      <div className="absolute top-2 right-2 flex items-center gap-2">
                        {story.is_promoted && (
                          <Badge className="bg-primary text-primary-foreground">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Promoted
                          </Badge>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              data-testid={`story-menu-${story.story_id}`}
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-full bg-black/60 hover:bg-black/80"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-effect">
                            <DropdownMenuItem
                              data-testid={`delete-story-${story.story_id}`}
                              onClick={() => handleDeleteClick(story)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Story
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatTimeRemaining(story.expires_at)}
                        </span>
                      </div>
                      
                      {!story.is_promoted && (
                        <Button
                          data-testid={`promote-button-${story.story_id}`}
                          onClick={() => handlePromoteClick(story)}
                          size="sm"
                          className="w-full rounded-full text-xs h-8"
                          variant="outline"
                        >
                          <TrendingUp className="w-3 h-3 mr-1" />
                          Promote Story
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <AlertDialogContent className="glass-effect max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">Promote Your Story</AlertDialogTitle>
            <AlertDialogDescription>
              Choose a promotion plan to boost your story&apos;s visibility
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 my-4">
            <div
              data-testid="tier-basic"
              onClick={() => setSelectedTier('basic')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTier === 'basic'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-heading font-bold text-lg">Basic Plan</h3>
                  <p className="text-sm text-muted-foreground">Perfect for starting out</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">₹50</p>
                  <p className="text-xs text-muted-foreground">per day</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <strong>10,000 views</strong>
                </p>
                <p className="text-muted-foreground">• Standard visibility boost</p>
                <p className="text-muted-foreground">• 24-hour promotion</p>
              </div>
            </div>
            
            <div
              data-testid="tier-premium"
              onClick={() => setSelectedTier('premium')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedTier === 'premium'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                    Premium Plan
                    <Badge className="bg-accent text-accent-foreground">Popular</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground">Maximum reach & engagement</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">₹100</p>
                  <p className="text-xs text-muted-foreground">per day</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <strong>20,000 views</strong>
                </p>
                <p className="text-muted-foreground">• Maximum visibility boost</p>
                <p className="text-muted-foreground">• Priority placement</p>
                <p className="text-muted-foreground">• 24-hour promotion</p>
              </div>
            </div>
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-promote-button"
              onClick={handlePromote}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Pay ₹{selectedTier === 'basic' ? '50' : '100'} & Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-effect max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this story? This action cannot be undone and the story will be removed immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-delete-button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Story
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <FloatingNav />
    </div>
  );
}