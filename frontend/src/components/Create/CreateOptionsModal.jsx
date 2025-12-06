import React from 'react';
import { X, Image, Video, Radio } from 'lucide-react';

const CreateOptionsModal = ({ onClose, onSelectPost, onSelectStory, onSelectLive }) => {
  const options = [
    {
      icon: Image,
      label: 'Post',
      description: 'Share a photo or video',
      color: 'from-blue-500 to-cyan-500',
      onClick: onSelectPost
    },
    {
      icon: Video,
      label: 'Story',
      description: 'Share to your story',
      color: 'from-purple-500 to-pink-500',
      onClick: onSelectStory
    },
    {
      icon: Radio,
      label: 'Go Live',
      description: 'Start a live video',
      color: 'from-red-500 to-orange-500',
      onClick: onSelectLive
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">{option.label}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateOptionsModal;
