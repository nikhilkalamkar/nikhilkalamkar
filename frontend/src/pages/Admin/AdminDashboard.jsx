import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Image, Flag, TrendingUp, Eye, Heart, MessageSquare, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import UsersManagement from '../../components/Admin/UsersManagement';
import PostsManagement from '../../components/Admin/PostsManagement';
import Analytics from '../../components/Admin/Analytics';
import ContentModeration from '../../components/Admin/ContentModeration';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Check admin auth
  React.useEffect(() => {
    const admin = localStorage.getItem('ishukart_admin');
    if (!admin) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Mock statistics
  const stats = [
    {
      title: 'Total Users',
      value: '12,543',
      change: '+12.5%',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Total Posts',
      value: '45,231',
      change: '+8.2%',
      icon: Image,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Total Likes',
      value: '1.2M',
      change: '+23.1%',
      icon: Heart,
      color: 'from-pink-500 to-pink-600'
    },
    {
      title: 'Flagged Content',
      value: '23',
      change: '-5.4%',
      icon: Flag,
      color: 'from-red-500 to-red-600'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Admin Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your IshukArt platform</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview">
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="border-none shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                          <h3 className="text-3xl font-bold">{stat.value}</h3>
                          <p className={`text-sm mt-1 ${
                            stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {stat.change} from last month
                          </p>
                        </div>
                        <div className={`bg-gradient-to-br ${stat.color} p-4 rounded-full`}>
                          <stat.icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { action: 'New user registered', user: 'sarah_artist', time: '2 minutes ago' },
                        { action: 'Post flagged', user: 'john_doe', time: '15 minutes ago' },
                        { action: 'User blocked', user: 'spam_user', time: '1 hour ago' },
                        { action: 'New art posted', user: 'emma_painter', time: '2 hours ago' },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-gray-500">@{activity.user} • {activity.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Popular Art Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { name: 'Digital Art', count: 12543, percentage: 85 },
                        { name: 'Photography', count: 8921, percentage: 65 },
                        { name: 'Paintings', count: 6234, percentage: 55 },
                        { name: 'Illustrations', count: 4567, percentage: 40 },
                      ].map((category, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{category.name}</span>
                            <span className="text-sm text-gray-500">{category.count}</span>
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
              </div>
            </TabsContent>

            <TabsContent value="users">
              <UsersManagement />
            </TabsContent>

            <TabsContent value="posts">
              <PostsManagement />
            </TabsContent>

            <TabsContent value="analytics">
              <Analytics />
            </TabsContent>

            <TabsContent value="moderation">
              <ContentModeration />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
