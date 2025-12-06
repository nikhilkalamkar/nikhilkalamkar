import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, Users, Image, Heart, MessageSquare, Eye } from 'lucide-react';

const Analytics = () => {
  // Mock data for charts
  const userGrowth = [
    { month: 'Jan', users: 1200 },
    { month: 'Feb', users: 1800 },
    { month: 'Mar', users: 2400 },
    { month: 'Apr', users: 3200 },
    { month: 'May', users: 4500 },
    { month: 'Jun', users: 6200 },
  ];

  const topPosts = [
    { id: 1, user: 'emma_watson', likes: 12543, image: 'https://images.unsplash.com/photo-1707343848552-893e05dba6ac' },
    { id: 2, user: 'mike_foodie', likes: 8921, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38' },
    { id: 3, user: 'sarah_style', likes: 7654, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f' },
    { id: 4, user: 'alex_adventure', likes: 6234, image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552' },
    { id: 5, user: 'lisa_yoga', likes: 5432, image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773' },
  ];

  const engagement = [
    { metric: 'Total Views', value: '2.4M', icon: Eye, color: 'from-blue-500 to-blue-600' },
    { metric: 'Total Likes', value: '1.2M', icon: Heart, color: 'from-pink-500 to-pink-600' },
    { metric: 'Total Comments', value: '456K', icon: MessageSquare, color: 'from-purple-500 to-purple-600' },
    { metric: 'Avg. Engagement', value: '8.5%', icon: TrendingUp, color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {engagement.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{item.metric}</p>
                  <h3 className="text-3xl font-bold">{item.value}</h3>
                </div>
                <div className={`bg-gradient-to-br ${item.color} p-4 rounded-full`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-4">
            {userGrowth.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${(data.users / 6200) * 100}%` }}
                ></div>
                <div className="text-center">
                  <p className="text-xs font-semibold">{data.month}</p>
                  <p className="text-xs text-gray-500">{data.users}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div key={post.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-full">
                  {index + 1}
                </div>
                <img
                  src={post.image}
                  alt="Post"
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <p className="font-semibold">@{post.user}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {post.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Digital Art', posts: 12543, percentage: 85 },
                { name: 'Photography', posts: 8921, percentage: 65 },
                { name: 'Paintings', posts: 6234, percentage: 55 },
                { name: 'Illustrations', posts: 4567, percentage: 40 },
                { name: 'Sculptures', posts: 2345, percentage: 25 },
              ].map((category, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500">{category.posts.toLocaleString()} posts</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '00:00 - 06:00', activity: 'Low', percentage: 15, color: 'bg-blue-200' },
                { time: '06:00 - 12:00', activity: 'Medium', percentage: 45, color: 'bg-blue-400' },
                { time: '12:00 - 18:00', activity: 'High', percentage: 85, color: 'bg-blue-600' },
                { time: '18:00 - 24:00', activity: 'Very High', percentage: 95, color: 'bg-blue-800' },
              ].map((slot, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{slot.time}</span>
                    <span className="text-sm text-gray-500">{slot.activity}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`${slot.color} h-2 rounded-full`}
                      style={{ width: `${slot.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
