import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { posts as mockPosts } from '../mock/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Grid, Bookmark } from 'lucide-react';

const Saved = () => {
  const navigate = useNavigate();
  const [savedPosts] = useState(mockPosts.filter(p => p.isSaved));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Saved</h1>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="all" className="flex-1">
            <Grid className="w-4 h-4 mr-2" />
            All Posts
          </TabsTrigger>
          <TabsTrigger value="collections" className="flex-1">
            <Bookmark className="w-4 h-4 mr-2" />
            Collections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {savedPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1">
              {savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square bg-gray-100 dark:bg-gray-900 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <img
                    src={post.images[0]}
                    alt="Saved post"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="border-2 border-black dark:border-white rounded-full p-6 mb-4">
                <Bookmark className="w-12 h-12" />
              </div>
              <p className="text-2xl font-light mb-1">Save</p>
              <p className="text-sm text-gray-500 text-center max-w-xs">
                Save photos and videos that you want to see again. No one is notified, and only you can see what you've saved.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="collections">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="border-2 border-black dark:border-white rounded-full p-6 mb-4">
              <Bookmark className="w-12 h-12" />
            </div>
            <p className="text-2xl font-light mb-1">Collections</p>
            <p className="text-sm text-gray-500 text-center max-w-xs">
              Organize your saved posts into collections.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Saved;
