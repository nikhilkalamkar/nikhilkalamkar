import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Users, Crown, TrendingUp, DollarSign, ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import AuthModal from '../components/AuthModal';
import { toast } from '../hooks/use-toast';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ads, setAds] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true);
    } else if (user) {
      fetchAdminData();
    }
  }, [user, loading, navigate]);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, paymentsRes, adsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/payments'),
        axiosInstance.get('/ads/pending')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setPayments(paymentsRes.data);
      setAds(adsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      
      let errorMessage = "Failed to load admin data";
      if (error.response?.status === 403) {
        errorMessage = "Access denied. Admin privileges required. Please logout and login again.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 8000
      });
      
      // Redirect to home after showing error
      setTimeout(() => navigate('/'), 3000);
    }
  };

  const handleApproveAd = async (adId) => {
    try {
      await axiosInstance.put(`/ads/${adId}/approve`);
      toast({
        title: "Success",
        description: "Advertisement approved and activated"
      });
      fetchAdminData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to approve ad",
        variant: "destructive"
      });
    }
  };

  const handleRejectAd = async (adId, reason) => {
    if (!reason || reason.trim() === '') {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive"
      });
      return;
    }

    try {
      await axiosInstance.put(`/ads/${adId}/reject?reason=${encodeURIComponent(reason)}`);
      toast({
        title: "Success",
        description: "Advertisement rejected"
      });
      setRejectReason('');
      fetchAdminData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to reject ad",
        variant: "destructive"
      });
    }
  };

  if (!user && !loading) {
    return <AuthModal open={showAuthModal} onClose={() => navigate('/')} />;
  }

  if (loading || !stats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN');
  };

  const formatTime = (date) => {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/chat')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <Button onClick={() => navigate('/')} variant="outline" size="sm" className="text-xs md:text-sm">
            <span className="hidden sm:inline">Go to Landing</span>
            <span className="sm:hidden">Home</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-gray-600 mt-1">+{stats.recentSignups} this month</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Premium Users</CardTitle>
              <Crown className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.premiumUsers}</div>
              <p className="text-xs text-gray-600 mt-1">{Math.round((stats.premiumUsers / stats.totalUsers) * 100)}% of total</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">₹{stats.monthlyRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-gray-600 mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Users, Payments, and Ads */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full md:w-[600px] grid-cols-3">
            <TabsTrigger value="users" className="text-xs md:text-sm">Users</TabsTrigger>
            <TabsTrigger value="payments" className="text-xs md:text-sm">Payments</TabsTrigger>
            <TabsTrigger value="ads" className="text-xs md:text-sm">Advertisements</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage and view all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">Name</TableHead>
                        <TableHead className="min-w-[180px]">Email</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[120px]">Subscription</TableHead>
                        <TableHead className="min-w-[100px]">Last Active</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          {user.isPremium ? (
                            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                              <Crown className="h-3 w-3 mr-1" />
                              Premium
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Free</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.subscriptionDate ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(user.subscriptionDate)}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatTime(user.lastActive)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View all premium subscription payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[120px]">User</TableHead>
                        <TableHead className="min-w-[100px]">Amount</TableHead>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[150px]">Razorpay ID</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.userName}</TableCell>
                        <TableCell className="font-semibold text-green-600">₹{payment.amount}</TableCell>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 font-mono">{payment.razorpayId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advertisements Tab */}
          <TabsContent value="ads">
            <Card>
              <CardHeader>
                <CardTitle>Pending Advertisements</CardTitle>
                <CardDescription>Review and moderate advertisement submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {ads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pending advertisements</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {ads.map((ad) => (
                      <Card key={ad.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            {/* Ad Preview */}
                            <div className="flex-shrink-0">
                              {ad.imageUrl && (
                                <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden border-2">
                                  <img 
                                    src={ad.imageUrl} 
                                    alt={ad.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src = 'https://via.placeholder.com/300x300?text=Ad+Image';
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Ad Details */}
                            <div className="flex-1 space-y-3">
                              <div>
                                <h3 className="text-xl font-bold mb-1">{ad.title}</h3>
                                <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Advertiser:</span>
                                  <p className="font-medium">{ad.advertiserName}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Budget:</span>
                                  <p className="font-medium">₹{ad.budget}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Target URL:</span>
                                  <a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                    {ad.targetUrl.length > 30 ? ad.targetUrl.substring(0, 30) + '...' : ad.targetUrl}
                                  </a>
                                </div>
                                <div>
                                  <span className="text-gray-500">Submitted:</span>
                                  <p className="font-medium">{new Date(ad.createdAt).toLocaleDateString()}</p>
                                </div>
                              </div>

                              {/* Content Guidelines Warning */}
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                                <p className="font-semibold text-yellow-900 mb-1">⚠️ Content Review Required</p>
                                <p className="text-yellow-800">Check for: nudity, violence, misleading claims, inappropriate content</p>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                  onClick={() => handleApproveAd(ad.id)}
                                  className="bg-green-600 hover:bg-green-700 flex-1"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Approve & Activate
                                </Button>
                                
                                <div className="flex-1">
                                  <div className="flex gap-2">
                                    <Input
                                      placeholder="Rejection reason (required)"
                                      value={rejectReason}
                                      onChange={(e) => setRejectReason(e.target.value)}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => handleRejectAd(ad.id, rejectReason)}
                                      variant="destructive"
                                    >
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;