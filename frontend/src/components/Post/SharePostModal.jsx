import React, { useState } from 'react';
import { X, Link as LinkIcon, Copy, Share2, Facebook, Twitter, MessageCircle, Mail, Download } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../../hooks/use-toast';

const SharePostModal = ({ post, onClose }) => {
  const { toast } = useToast();
  const postUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({
        title: 'Link copied! 📋',
        description: 'Post link copied to clipboard',
      });
      onClose();
    } catch (error) {
      console.error('Error copying:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadImage = async () => {
    try {
      const imageUrl = post.images[0];
      
      // For mobile devices, try to open image in new tab
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // Open image in new tab - user can long press to save
        const newWindow = window.open(imageUrl, '_blank');
        if (newWindow) {
          toast({
            title: 'Image opened! 📱',
            description: 'Long press the image to save to your gallery',
          });
        } else {
          // Fallback: download
          const a = document.createElement('a');
          a.href = imageUrl;
          a.download = `ishukart_${post.user.username}_${Date.now()}.jpg`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          toast({
            title: 'Downloading... 💾',
            description: 'Check your downloads folder',
          });
        }
      } else {
        // Desktop: download directly
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ishukart_${post.user.username}_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Downloaded! 💾',
          description: 'Image saved to your downloads',
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error downloading:', error);
      
      // Final fallback: just open in new tab
      window.open(post.images[0], '_blank');
      toast({
        title: 'Image opened',
        description: 'Right-click or long press to save',
      });
    }
  };

  const handleSaveToDevice = async () => {
    try {
      const imageUrl = post.images[0];
      
      // Create canvas to convert image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            handleDownloadImage();
            return;
          }
          
          // For mobile: use share API to save
          if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            const file = new File([blob], `ishukart_${Date.now()}.jpg`, { type: 'image/jpeg' });
            navigator.share({
              files: [file],
              title: `Post by ${post.user.username}`,
              text: post.caption || 'Check out this post on IshukArt'
            }).then(() => {
              toast({
                title: 'Shared! 📱',
                description: 'You can now save to gallery from share menu',
              });
              onClose();
            }).catch((error) => {
              if (error.name !== 'AbortError') {
                handleDownloadImage();
              }
            });
          } else {
            // Desktop: download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ishukart_${post.user.username}_${Date.now()}.jpg`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast({
              title: 'Downloaded! 💾',
              description: 'Saved to your downloads',
            });
            onClose();
          }
        }, 'image/jpeg', 0.95);
      };
      
      img.onerror = () => {
        handleDownloadImage();
      };
    } catch (error) {
      console.error('Error saving:', error);
      handleDownloadImage();
    }
  };

  const handleShareVia = (platform) => {
    let shareUrl = '';
    const text = `Check out this post by ${post.user.username} on IshukArt: ${post.caption}`;
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + postUrl)}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Check out this post on IshukArt')}&body=${encodeURIComponent(text + '\n\n' + postUrl)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
    toast({
      title: 'Opening share dialog...',
      description: `Sharing via ${platform}`,
    });
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.user.username}'s post on IshukArt`,
          text: post.caption,
          url: postUrl
        });
        toast({
          title: 'Shared successfully!',
          description: 'Post shared via your device',
        });
        onClose();
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold">Share Post</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img 
              src={post.images[0]} 
              alt="Post preview" 
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{post.user.username}</p>
              <p className="text-sm text-gray-500 truncate">{post.caption}</p>
            </div>
          </div>
        </div>

        {/* Copy Link */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Input
              value={postUrl}
              readOnly
              className="flex-1 text-sm"
            />
            <Button onClick={handleCopyLink} variant="outline" size="icon">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Share Options */}
        <div className="p-4 space-y-2">
          <p className="text-sm font-medium text-gray-500 mb-3">Share via</p>
          
          {/* Native Share (Mobile) */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">Share via...</p>
                <p className="text-xs text-gray-500">Use device share menu</p>
              </div>
            </button>
          )}

          {/* WhatsApp */}
          <button
            onClick={() => handleShareVia('whatsapp')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">WhatsApp</p>
              <p className="text-xs text-gray-500">Share via WhatsApp</p>
            </div>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleShareVia('facebook')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Facebook</p>
              <p className="text-xs text-gray-500">Share on Facebook</p>
            </div>
          </button>

          {/* Twitter */}
          <button
            onClick={() => handleShareVia('twitter')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
              <Twitter className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Twitter</p>
              <p className="text-xs text-gray-500">Share on Twitter</p>
            </div>
          </button>

          {/* Telegram */}
          <button
            onClick={() => handleShareVia('telegram')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Telegram</p>
              <p className="text-xs text-gray-500">Share on Telegram</p>
            </div>
          </button>

          {/* Email */}
          <button
            onClick={() => handleShareVia('email')}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Email</p>
              <p className="text-xs text-gray-500">Share via email</p>
            </div>
          </button>

          {/* Download Image */}
          <button
            onClick={handleDownloadImage}
            className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Download Image</p>
              <p className="text-xs text-gray-500">Save to your device</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;
