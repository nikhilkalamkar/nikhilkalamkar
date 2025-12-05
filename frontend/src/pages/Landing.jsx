import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { MessageCircle, Users, Shield, Zap, Star, Upload, Palette, Crown, LogOut } from 'lucide-react';
import { mockPremiumFeatures } from '../mock';
import PremiumModal from '../components/PremiumModal';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ishukart
            </h1>
          </div>
          <div className="flex gap-3">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100" variant="secondary">
          <Crown className="h-3 w-3 mr-1" />
          Premium Plan Available
        </Badge>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
          Connect with Everyone,
          <br />Anywhere, Anytime
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Experience seamless messaging with ishukart. Chat, share, and collaborate with powerful features and premium benefits.
        </p>
        <div className="flex gap-4 justify-center">
          <Button 
            size="lg" 
            onClick={handleChatClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Start Chatting
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => setShowPremiumModal(true)}
            className="text-lg px-8 py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all"
          >
            <Crown className="mr-2 h-5 w-5" />
            View Premium
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Why Choose ishukart?</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-blue-300 transition-all hover:shadow-lg">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-blue-600 mb-2" />
              <CardTitle>Instant Messaging</CardTitle>
              <CardDescription>
                Send messages, photos, videos, and files instantly to anyone in the world
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-indigo-300 transition-all hover:shadow-lg">
            <CardHeader>
              <Users className="h-12 w-12 text-indigo-600 mb-2" />
              <CardTitle>Group Chats & Channels</CardTitle>
              <CardDescription>
                Create groups with unlimited members and broadcast channels for your community
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-purple-300 transition-all hover:shadow-lg">
            <CardHeader>
              <Shield className="h-12 w-12 text-purple-600 mb-2" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your conversations are encrypted and private. We value your security
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
              <Crown className="h-3 w-3 mr-1" />
              Premium Features
            </Badge>
            <h3 className="text-4xl font-bold mb-4">Upgrade to Premium</h3>
            <p className="text-xl text-blue-100 mb-6">Just ₹100/month for exclusive features</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {mockPremiumFeatures.map((feature, index) => {
              const Icon = iconMap[feature.icon];
              return (
                <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
                  <CardHeader>
                    <Icon className="h-10 w-10 mb-2" />
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-blue-100">
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
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 shadow-xl"
            >
              <Crown className="mr-2 h-5 w-5" />
              Get Premium Now - ₹100/month
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-4xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-xl text-gray-600 mb-8">Join thousands of users on ishukart today</p>
        <Button 
          size="lg" 
          onClick={handleChatClick}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 py-6"
        >
          Launch ishukart
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
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