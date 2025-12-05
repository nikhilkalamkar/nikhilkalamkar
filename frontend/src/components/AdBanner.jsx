import React, { useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import axiosInstance from '../api/axios';

const AdBanner = ({ ad, onClose }) => {
  useEffect(() => {
    // Record impression when ad is shown
    recordImpression();
  }, [ad.id]);

  const recordImpression = async () => {
    try {
      await axiosInstance.post('/ads/impression', { adId: ad.id });
    } catch (error) {
      console.error('Error recording impression:', error);
    }
  };

  const handleClick = async () => {
    try {
      await axiosInstance.post('/ads/click', { adId: ad.id });
      window.open(ad.targetUrl, '_blank');
    } catch (error) {
      console.error('Error recording click:', error);
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:shadow-lg transition-all cursor-pointer group"
      onClick={handleClick}
    >
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-white/80 hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-4 p-4">
        {ad.imageUrl && (
          <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden">
            <img 
              src={ad.imageUrl} 
              alt={ad.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/300x300?text=Ad';
              }}
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
              Sponsored
            </Badge>
          </div>
          <h3 className="font-bold text-base md:text-lg mb-1 truncate group-hover:text-blue-600 transition-colors">
            {ad.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ad.description}</p>
          <div className="flex items-center gap-2 text-xs text-blue-600">
            <span>Learn more</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AdBanner;