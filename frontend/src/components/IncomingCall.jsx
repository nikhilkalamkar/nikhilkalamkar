import React from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Phone, PhoneOff, Video } from 'lucide-react';

const IncomingCall = ({ isOpen, callData, onAccept, onReject }) => {
  if (!callData) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-sm">
        <div className="text-center py-6">
          {/* Caller Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 animate-pulse">
            {callData.callerName?.charAt(0).toUpperCase()}
          </div>

          {/* Caller Name */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {callData.callerName}
          </h2>

          {/* Call Type */}
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
            {callData.callType === 'video' ? (
              <>
                <Video className="h-5 w-5" />
                <p>Incoming Video Call</p>
              </>
            ) : (
              <>
                <Phone className="h-5 w-5" />
                <p>Incoming Audio Call</p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={onReject}
              size="lg"
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>

            <Button
              onClick={onAccept}
              size="lg"
              className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-700 animate-bounce"
            >
              <Phone className="h-6 w-6" />
            </Button>
          </div>

          {/* Ringing Animation */}
          <div className="mt-6">
            <div className="flex justify-center gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCall;
