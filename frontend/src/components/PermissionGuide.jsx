import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { AlertCircle, Camera, Mic, Settings } from 'lucide-react';

const PermissionGuide = ({ isOpen, onClose, callType }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Camera & Microphone Access Required
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* What's Needed */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-semibold text-sm mb-2">To make {callType === 'video' ? 'video' : 'audio'} calls, we need:</p>
            <div className="space-y-2">
              {callType === 'video' && (
                <div className="flex items-center gap-2 text-sm">
                  <Camera className="h-4 w-4 text-blue-600" />
                  <span>Camera access for video</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Mic className="h-4 w-4 text-blue-600" />
                <span>Microphone access for audio</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <p className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              How to Allow Permissions:
            </p>
            
            <div className="space-y-3 text-sm">
              <div className="pl-4 border-l-2 border-gray-200">
                <p className="font-medium mb-1">1. Look for the permission popup</p>
                <p className="text-gray-600">When you start a call, your browser will ask for permission.</p>
              </div>

              <div className="pl-4 border-l-2 border-gray-200">
                <p className="font-medium mb-1">2. Click "Allow" or "Accept"</p>
                <p className="text-gray-600">Grant access to your camera and microphone.</p>
              </div>

              <div className="pl-4 border-l-2 border-gray-200">
                <p className="font-medium mb-1">3. Already blocked?</p>
                <p className="text-gray-600">
                  Click the <strong>🔒 lock icon</strong> in your browser's address bar, then change permissions to "Allow".
                </p>
              </div>
            </div>
          </div>

          {/* Browser Specific Hints */}
          <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
            <p className="font-medium mb-1">💡 Tip:</p>
            <p>The permission popup appears at the top of your browser window. Make sure to click "Allow" when you see it!</p>
          </div>

          {/* Action Button */}
          <Button onClick={onClose} className="w-full">
            Got it, Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionGuide;
