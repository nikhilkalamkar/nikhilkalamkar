import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from '../hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import axiosInstance from '../api/axios';

const CreateAdModal = ({ open, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [adData, setAdData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    budget: 100
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (adData.budget < 100) {
      toast({
        title: "Invalid Budget",
        description: "Minimum budget is ₹100",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await axiosInstance.post('/advertiser/ads', adData);
      toast({
        title: "Success",
        description: "Advertisement created and submitted for approval"
      });
      setAdData({ title: '', description: '', imageUrl: '', targetUrl: '', budget: 100 });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create advertisement",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Advertisement</DialogTitle>
          <DialogDescription>
            Create a banner ad to promote your business. Minimum budget: ₹100. Cost: ₹20 per impression.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-orange-800">
              <p className="font-semibold mb-1">Content Guidelines:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>No nudity or sexually explicit content</li>
                <li>No violence or graphic content</li>
                <li>No misleading or false claims</li>
                <li>Family-friendly content only</li>
                <li>All ads are reviewed before approval</li>
              </ul>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Ad Title</Label>
            <Input
              id="title"
              placeholder="e.g., Premium Coffee Beans - 20% Off"
              value={adData.title}
              onChange={(e) => setAdData({ ...adData, title: e.target.value })}
              required
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">{adData.title.length}/60 characters</p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your product or service"
              value={adData.description}
              onChange={(e) => setAdData({ ...adData, description: e.target.value })}
              required
              maxLength={150}
              rows={3}
            />
            <p className="text-xs text-gray-500 mt-1">{adData.description.length}/150 characters</p>
          </div>

          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/banner-image.jpg"
              value={adData.imageUrl}
              onChange={(e) => setAdData({ ...adData, imageUrl: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Recommended size: 1200x300px</p>
          </div>

          <div>
            <Label htmlFor="targetUrl">Target URL (Where users will be redirected)</Label>
            <Input
              id="targetUrl"
              type="url"
              placeholder="https://yourbusiness.com"
              value={adData.targetUrl}
              onChange={(e) => setAdData({ ...adData, targetUrl: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="budget">Budget (₹)</Label>
            <Input
              id="budget"
              type="number"
              min="100"
              step="20"
              value={adData.budget}
              onChange={(e) => setAdData({ ...adData, budget: parseInt(e.target.value) })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Estimated impressions: {Math.floor(adData.budget / 20)} (₹20 per impression)
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Advertisement'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAdModal;