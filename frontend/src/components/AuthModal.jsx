import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import ForgotPasswordModal from './ForgotPasswordModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthModal = ({ open, onClose }) => {
  const { login, register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', mobile: '', password: '' });
  const [advertiserData, setAdvertiserData] = useState({ businessName: '', email: '', mobile: '', password: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(loginData.identifier, loginData.password);
    setIsLoading(false);
    
    if (result.success) {
      toast({ title: 'Success', description: 'Logged in successfully!' });
      onClose();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await register(registerData.name, registerData.email, registerData.password, registerData.mobile);
    setIsLoading(false);
    
    if (result.success) {
      toast({ title: 'Success', description: 'Account created successfully!' });
      onClose();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  };

  const handleAdvertiserRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/advertiser/register`, advertiserData);
      localStorage.setItem('token', response.data.token);
      toast({ title: 'Success', description: 'Advertiser account created!' });
      window.location.href = '/advertiser';
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Registration failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome to ishukart</DialogTitle>
          <DialogDescription>Login or create an account to continue</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="advertiser">Advertiser</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="login-identifier">Email or Mobile Number</Label>
                <Input
                  id="login-identifier"
                  type="text"
                  placeholder="email@example.com or +919876543211"
                  value={loginData.identifier}
                  onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center justify-between mb-4">
                <Button 
                  type="button" 
                  variant="link" 
                  className="p-0 h-auto text-blue-600 text-sm"
                  onClick={() => {
                    onClose();
                    setShowForgotPassword(true);
                  }}
                >
                  Forgot Password?
                </Button>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</> : 'Login'}
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-4">Demo: +919876543211 / password123</p>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="register-name">Name</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Your Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-mobile">Mobile Number</Label>
                <Input
                  id="register-mobile"
                  type="tel"
                  placeholder="+919876543210"
                  value={registerData.mobile}
                  onChange={(e) => setRegisterData({ ...registerData, mobile: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="your@email.com"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...</> : 'Register'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="advertiser">
            <form onSubmit={handleAdvertiserRegister} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="advertiser-business">Business Name</Label>
                <Input
                  id="advertiser-business"
                  type="text"
                  placeholder="Your Business Name"
                  value={advertiserData.businessName}
                  onChange={(e) => setAdvertiserData({ ...advertiserData, businessName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="advertiser-mobile">Mobile Number</Label>
                <Input
                  id="advertiser-mobile"
                  type="tel"
                  placeholder="+919876543210"
                  value={advertiserData.mobile}
                  onChange={(e) => setAdvertiserData({ ...advertiserData, mobile: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="advertiser-email">Email</Label>
                <Input
                  id="advertiser-email"
                  type="email"
                  placeholder="business@example.com"
                  value={advertiserData.email}
                  onChange={(e) => setAdvertiserData({ ...advertiserData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="advertiser-password">Password</Label>
                <Input
                  id="advertiser-password"
                  type="password"
                  placeholder="••••••••"
                  value={advertiserData.password}
                  onChange={(e) => setAdvertiserData({ ...advertiserData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Advertiser Benefits:</strong> Promote your business with banner ads. Minimum budget ₹100. Cost ₹20 per impression. All ads are moderated for content quality.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Advertiser Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
