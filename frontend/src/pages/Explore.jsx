import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posts as mockPosts } from '../mock/mockData';
import { Heart, MessageCircle } from 'lucide-react';

const Explore = () => {
  const navigate = useNavigate();
  const [explorePosts] = useState(mockPosts);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-6">Explore</h1>
      
      <div className="grid grid-cols-3 gap-1">
        {explorePosts.map((post, index) => {
          // Create varied grid layout
          const isLarge = index % 7 === 0;
          const gridClass = isLarge ? 'col-span-2 row-span-2' : '';

          return (
            <div
              key={post.id}
              className={`relative aspect-square bg-gray-100 dark:bg-gray-900 cursor-pointer group overflow-hidden ${gridClass}`}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <img
                src={post.images[0]}
                alt="Explore post"
                className="w-full h-full object-cover"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Heart className="w-6 h-6 fill-white" />
                  {post.likes}
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <MessageCircle className="w-6 h-6 fill-white" />
                  {post.comments}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Explore;
