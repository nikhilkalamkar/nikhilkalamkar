import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MessageCircle, Users, Shield, Zap, Star, Upload, Palette, Crown, LogOut, Menu, X, TrendingUp, DollarSign } from 'lucide-react';
import { mockPremiumFeatures } from '../mock';
import PremiumModal from '../components/PremiumModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleChatClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      navigate('/chat');
    }
  };

  const iconMap = {
    Zap: Zap,
    Upload: Upload,
    Star: Star,
    Palette: Palette,
    Users: Users,
    Shield: Shield
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ishukart
            </h1>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex gap-3 items-center">
            {user ? (
              <>
                <span className="text-sm text-gray-600 flex items-center">
                  Welcome, {user.name}
                  {user.isPremium && <Crown className="h-4 w-4 ml-1 text-yellow-500" />}
                </span>
                <Button variant="ghost" onClick={() => navigate('/chat')}>Launch App</Button>
                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setShowAuthModal(true)}>Login</Button>
                <Button onClick={() => setShowPremiumModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Go Premium
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white p-4 space-y-2">
            {user ? (
              <>
                <div className="text-sm text-gray-600 flex items-center mb-2">
                  Welcome, {user.name}
                  {user.isPremium && <Crown className="h-4 w-4 ml-1 text-yellow-500" />}
                </div>
                <Button className="w-full" onClick={() => { navigate('/chat'); setMobileMenuOpen(false); }}>Launch App</Button>
                <Button variant="outline" className="w-full" onClick={() => { logout(); setMobileMenuOpen(false); }}>Logout</Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={() => { setShowAuthModal(true); setMobileMenuOpen(false); }}>Login</Button>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => { setShowPremiumModal(true); setMobileMenuOpen(false); }}>Go Premium</Button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100" variant="secondary">
          <Crown className="h-3 w-3 mr-1" />
          Premium Plan Available
        </Badge>
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
          Connect with Everyone,
          <br />Anywhere, Anytime
        </h2>
        <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto px-4">
          Experience seamless messaging with ishukart. Chat, share, and collaborate with powerful features and premium benefits.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
          <Button 
            size="lg" 
            onClick={handleChatClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Start Chatting
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => setShowPremiumModal(true)}
            className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all w-full sm:w-auto"
          >
            <Crown className="mr-2 h-5 w-5" />
            View Premium
          </Button>
        </div>
      </section>

      {/* Advertiser Section */}
      <section className="bg-gradient-to-r from-orange-50 to-yellow-50 border-y border-orange-200 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <Badge className="mb-3 bg-orange-100 text-orange-800 hover:bg-orange-100">
                <TrendingUp className="h-3 w-3 mr-1" />
                For Businesses
              </Badge>
              <h3 className="text-2xl md:text-4xl font-bold mb-3">
                Advertise Your Business on ishukart
              </h3>
              <p className="text-base md:text-lg text-gray-600 mb-6">
                Reach thousands of active users with banner ads. Starting from just ₹100
              </p>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="border-2 border-orange-200 hover:shadow-lg transition-all text-center">
                <CardContent className="pt-6">
                  <DollarSign className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Affordable Pricing</h4>
                  <p className="text-sm text-gray-600">₹20 per impression</p>
                  <p className="text-xs text-gray-500 mt-1">Min. budget: ₹100</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-orange-200 hover:shadow-lg transition-all text-center">
                <CardContent className="pt-6">
                  <Users className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Wide Reach</h4>
                  <p className="text-sm text-gray-600">Thousands of users</p>
                  <p className="text-xs text-gray-500 mt-1">Active engagement</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-orange-200 hover:shadow-lg transition-all text-center">
                <CardContent className="pt-6">
                  <Shield className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Safe & Moderated</h4>
                  <p className="text-sm text-gray-600">Content approval</p>
                  <p className="text-xs text-gray-500 mt-1">Family-friendly</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setShowAuthModal(true)}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-lg w-full sm:w-auto"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Register as Advertiser
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => {
                  if (user && user.role === 'advertiser') {
                    navigate('/advertiser');
                  } else {
                    setShowAuthModal(true);
                  }
                }}
                className="text-base md:text-lg px-6 md:px-8 py-5 md:py-6 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 w-full sm:w-auto"
              >
                Advertiser Login
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">Why Choose ishukart?</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
            <CardHeader>
              <MessageCircle className="h-10 w-10 md:h-12 md:w-12 text-blue-600 mb-2" />
              <CardTitle className="text-lg md:text-xl">Instant Messaging</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Send messages, photos, videos, and files instantly to anyone in the world
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
            <CardHeader>
              <Users className="h-10 w-10 md:h-12 md:w-12 text-indigo-600 mb-2" />
              <CardTitle className="text-lg md:text-xl">Group Chats & Channels</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Create groups with unlimited members and broadcast channels for your community
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-lg sm:col-span-2 md:col-span-1">
            <CardHeader>
              <Shield className="h-10 w-10 md:h-12 md:w-12 text-purple-600 mb-2" />
              <CardTitle className="text-lg md:text-xl">Secure & Private</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Your conversations are encrypted and private. We value your security
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <Badge className="mb-4 bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
              <Crown className="h-3 w-3 mr-1" />
              Premium Features
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Upgrade to Premium</h3>
            <p className="text-lg md:text-xl text-blue-100 mb-4 md:mb-6">Just ₹100/month for exclusive features</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            {mockPremiumFeatures.map((feature, index) => {
              const Icon = iconMap[feature.icon];
              return (
                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
                  <CardHeader>
                    <Icon className="h-8 w-8 md:h-10 md:w-10 mb-2" />
                    <CardTitle className="text-white text-base md:text-lg">{feature.title}</CardTitle>
                    <CardDescription className="text-blue-100 text-sm md:text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
          <div className="text-center">
            <Button 
              size="lg" 
              onClick={() => setShowPremiumModal(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 shadow-xl w-full sm:w-auto"
            >
              <Crown className="mr-2 h-5 w-5" />
              Get Premium Now - ₹100/month
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center">
        <h3 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Ready to Get Started?</h3>
        <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8">Join thousands of users on ishukart today</p>
        <Button 
          size="lg" 
          onClick={handleChatClick}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto"
        >
          Launch ishukart
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-6 md:py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm md:text-base">
          <p>© 2025 ishukart. All rights reserved.</p>
        </div>
      </footer>

      {/* Modals */}
      <PremiumModal open={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
      <AuthModal open={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

export default Landing;