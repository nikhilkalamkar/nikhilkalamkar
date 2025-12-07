import { useState, useEffect, useContext } from 'react';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Stories() {
  const { token } = useContext(AuthContext);
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [groupedStories, setGroupedStories] = useState({});

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await axios.get(`${API}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(response.data);
      
      const grouped = response.data.reduce((acc, story) => {
        if (!acc[story.user_id]) {
          acc[story.user_id] = {
            user_id: story.user_id,
            username: story.username,
            user_avatar: story.user_avatar,
            stories: []
          };
        }
        acc[story.user_id].stories.push(story);
        return acc;
      }, {});
      setGroupedStories(grouped);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    }
  };

  const handleStoryClick = async (userStories) => {
    setSelectedStory({ ...userStories, currentIndex: 0 });
    try {
      await axios.put(`${API}/stories/${userStories.stories[0].story_id}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 px-4 pt-6 max-w-md mx-auto" data-testid="stories-page">
      <h1 className="text-4xl font-bold mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
        Stories
      </h1>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {Object.values(groupedStories).map((userStories) => (
          <motion.div
            key={userStories.user_id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStoryClick(userStories)}
            className="flex-shrink-0 cursor-pointer"
            data-testid="story-circle"
          >
            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-[rgb(37 99 235)] via-[#EC4899] to-[#8B5CF6]">
              <div className="w-full h-full rounded-full bg-white p-1">
                <img
                  src={userStories.user_avatar || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
                  alt={userStories.username}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
            <p className="text-xs text-center mt-2 font-medium truncate w-20">
              {userStories.username}
            </p>
          </motion.div>
        ))}
      </div>

      {stories.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">No stories yet</p>
          <p className="text-gray-400 text-sm mt-2">Add friends to see their stories</p>
        </div>
      )}

      {selectedStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" data-testid="story-viewer">
          <button
            onClick={() => setSelectedStory(null)}
            className="absolute top-6 right-6 z-10 text-white"
            data-testid="close-story-btn"
          >
            <X size={32} />
          </button>

          <div className="relative w-full max-w-md aspect-[9/16]">
            <div className="absolute top-4 left-4 right-4 flex gap-2 z-10">
              {selectedStory.stories.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-white transition-all duration-300 ${
                      idx === selectedStory.currentIndex ? 'w-full' : idx < selectedStory.currentIndex ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-12 left-4 flex items-center gap-3 z-10">
              <img
                src={selectedStory.user_avatar || 'https://images.unsplash.com/photo-1675526607070-f5cbd71dde92?w=200'}
                alt={selectedStory.username}
                className="w-10 h-10 rounded-full object-cover border-2 border-white"
              />
              <div>
                <p className="text-white font-bold">{selectedStory.username}</p>
                <p className="text-white/70 text-xs">2h ago</p>
              </div>
            </div>

            <img
              src={selectedStory.stories[selectedStory.currentIndex].image_url}
              alt="Story"
              className="w-full h-full object-cover"
            />

            {selectedStory.stories[selectedStory.currentIndex].text && (
              <div className="absolute bottom-20 left-4 right-4 text-white text-xl font-bold text-center"
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                {selectedStory.stories[selectedStory.currentIndex].text}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}