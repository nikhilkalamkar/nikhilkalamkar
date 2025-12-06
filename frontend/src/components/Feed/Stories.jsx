import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Plus } from 'lucide-react';

const Stories = ({ stories, onStoryClick, currentUser }) => {
  return (
    <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 py-4 px-4 overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {/* Add Story */}
        <div className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-gray-300">
              <AvatarImage src={currentUser?.avatar} />
              <AvatarFallback>{currentUser?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-0.5 border-2 border-white dark:border-black">
              <Plus className="w-3 h-3 text-white" />
            </div>
          </div>
          <span className="text-xs">Your story</span>
        </div>

        {/* Stories from other users */}
        {stories.map((story) => (
          <div
            key={story.id}
            className="flex flex-col items-center gap-1 cursor-pointer"
            onClick={() => onStoryClick(story)}
          >
            <div
              className={`p-0.5 rounded-full ${
                story.hasUnviewed
                  ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-pink-500'
                  : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              <div className="bg-white dark:bg-black rounded-full p-0.5">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={story.user.avatar} />
                  <AvatarFallback>{story.user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs max-w-[60px] truncate">{story.user.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
