import React from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { X, Crown, Bell, Image as ImageIcon, File, Link2, Shield, LogOut } from 'lucide-react';
import { mockUsers } from '../mock';

const ChatInfo = ({ chatDetails, chatType, onClose }) => {
  return (
    <div className="w-80 border-l bg-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Chat Info</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Profile Section */}
        <div className="p-6 text-center border-b">
          <Avatar className="h-24 w-24 mx-auto mb-3">
            <AvatarImage src={chatDetails?.avatar} alt={chatDetails?.name} />
            <AvatarFallback className="text-2xl">{chatDetails?.name?.[0]}</AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{chatDetails?.name}</h3>
          {chatType === 'direct' && chatDetails?.isPremium && (
            <Badge className="mt-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              <Crown className="h-3 w-3 mr-1" />
              Premium Member
            </Badge>
          )}
          {chatType === 'group' && (
            <p className="text-sm text-gray-600 mt-1">{chatDetails?.members} members</p>
          )}
        </div>

        {/* Group Members (if group) */}
        {chatType === 'group' && (
          <div className="p-4 border-b">
            <h4 className="font-semibold mb-3 text-sm text-gray-700">Members</h4>
            <div className="space-y-2">
              {mockUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.status}</p>
                  </div>
                  {user.isPremium && (
                    <Crown className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            Media, Links
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <File className="h-4 w-4 mr-2" />
            Shared Files
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Link2 className="h-4 w-4 mr-2" />
            Shared Links
          </Button>
        </div>

        <Separator />

        {/* Privacy & Support */}
        <div className="p-4 space-y-2">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Privacy & Safety
          </Button>
          {chatType === 'group' && (
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Leave Group
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatInfo;