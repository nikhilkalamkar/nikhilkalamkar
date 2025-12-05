import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { TrendingUp, DollarSign, ArrowLeft, Eye, MousePointer, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
import { toast } from '../hooks/use-toast';
import CreateAdModal from '../components/CreateAdModal';

const Advertiser = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [ads, setAds] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'advertiser')) {
      toast({
        title: "Access Denied",
        description: "Advertiser access required",
        variant: "destructive"
      });
      navigate('/');
    } else if (user && user.role === 'advertiser') {
      fetchData();
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    try {
      const [statsRes, adsRes] = await Promise.all([
        axiosInstance.get('/advertiser/stats'),
        axiosInstance.get('/advertiser/ads')
      ]);
      setStats(statsRes.data);
      setAds(adsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handlePauseAd = async (adId) => {
    try {
      await axiosInstance.put(`/advertiser/ads/${adId}/pause`);
      toast({ title: "Success", description: "Advertisement paused" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.detail, variant: "destructive" });
    }
  };

  const handleResumeAd = async (adId) => {
    try {
      await axiosInstance.put(`/advertiser/ads/${adId}/resume`);
      toast({ title: "Success", description: "Advertisement resumed" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.detail, variant: "destructive" });
    }
  };

  if (loading || !stats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      paused: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-purple-100 text-purple-800'
    };
    return <Badge className={variants[status] || 'bg-gray-100'}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Advertiser Dashboard
            </h1>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600">
            Create Ad
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Ads</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.totalAds}</div>
              <p className="text-xs text-gray-600 mt-1">{stats.activeAds} active</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">₹{stats.totalSpent}</div>
              <p className="text-xs text-gray-600 mt-1">Ad spend</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Impressions</CardTitle>
              <Eye className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.totalImpressions}</div>
              <p className="text-xs text-gray-600 mt-1">Total views</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">CTR</CardTitle>
              <MousePointer className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats.ctr.toFixed(2)}%</div>
              <p className="text-xs text-gray-600 mt-1">{stats.totalClicks} clicks</p>
            </CardContent>
          </Card>
        </div>

        {/* Content Moderation Warning */}
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">Content Guidelines</h3>
                <p className="text-sm text-orange-800">
                  All advertisements are subject to moderation. Content containing nudity, violence, or inappropriate material will be rejected. Minimum budget: ₹100. Cost: ₹20 per impression.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ads Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Advertisements</CardTitle>
            <CardDescription>Manage and track your ad campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px]">Title</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[100px]">Budget</TableHead>
                    <TableHead className="min-w-[100px]">Spent</TableHead>
                    <TableHead className="min-w-[100px]">Impressions</TableHead>
                    <TableHead className="min-w-[100px]">Clicks</TableHead>
                    <TableHead className="min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>{getStatusBadge(ad.status)}</TableCell>
                      <TableCell className="font-semibold">₹{ad.budget}</TableCell>
                      <TableCell>₹{ad.spent}</TableCell>
                      <TableCell>{ad.impressions}</TableCell>
                      <TableCell>{ad.clicks}</TableCell>
                      <TableCell>
                        {ad.status === 'active' && (
                          <Button size="sm" variant="outline" onClick={() => handlePauseAd(ad.id)}>
                            Pause
                          </Button>
                        )}
                        {ad.status === 'paused' && (
                          <Button size="sm" variant="outline" onClick={() => handleResumeAd(ad.id)}>
                            Resume
                          </Button>
                        )}
                        {ad.status === 'rejected' && (
                          <span className="text-xs text-red-600">{ad.moderationNote}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <CreateAdModal open={showCreateModal} onClose={() => { setShowCreateModal(false); fetchData(); }} />
    </div>
  );
};

export default Advertiser;