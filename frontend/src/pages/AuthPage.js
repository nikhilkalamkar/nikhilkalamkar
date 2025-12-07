import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Zap, Sparkles } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = isLogin
      ? await login({ email: formData.email, password: formData.password })
      : await register(formData);
    
    setLoading(false);
    
    if (result.success) {
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/');
    } else {
      toast.error(result.error);
    }
  };
  
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Reset token generated! Check the response below.');
        if (data.reset_token) {
          setResetToken(data.reset_token);
          setShowResetForm(true);
          toast.info(`Your reset token: ${data.reset_token}`, { duration: 10000 });
        }
      } else {
        toast.error('Failed to generate reset token');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      toast.error('Please fill all fields');
      return;
    }
    
    setLoading(true);
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          reset_token: resetToken,
          new_password: newPassword
        })
      });
      
      if (response.ok) {
        toast.success('Password reset successfully! You can now login.');
        setShowForgotPassword(false);
        setShowResetForm(false);
        setResetToken('');
        setResetEmail('');
        setNewPassword('');
        setIsLogin(true);
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 noise-texture">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4 neon-shadow"
          >
            <Zap className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          <h1 className="text-4xl font-heading font-black tracking-tight text-foreground mb-2">
            SnapClone
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Ephemeral moments, forever memories
          </p>
        </div>
        
        <Card className="glass-effect border-border/50" data-testid="auth-card">
          <CardHeader>
            <CardTitle className="font-heading text-2xl">
              {showForgotPassword ? 'Reset Password' : isLogin ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription>
              {showForgotPassword 
                ? 'Enter your email to receive a reset token' 
                : isLogin ? 'Sign in to your account' : 'Start sharing your stories'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showForgotPassword ? (
              <div className="space-y-4">
                {!showResetForm ? (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input
                        id="reset-email"
                        data-testid="reset-email-input"
                        type="email"
                        placeholder="you@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="h-12 bg-secondary border-transparent focus:border-primary"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      data-testid="request-reset-button"
                      disabled={loading}
                      className="w-full h-12 rounded-full font-bold uppercase tracking-wide neon-shadow hover:scale-105 transition-transform"
                    >
                      {loading ? 'Please wait...' : 'Get Reset Token'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-token">Reset Token</Label>
                      <Input
                        id="reset-token"
                        data-testid="reset-token-input"
                        placeholder="Enter the reset token"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        required
                        className="h-12 bg-secondary border-transparent focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        data-testid="new-password-input"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="h-12 bg-secondary border-transparent focus:border-primary"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      data-testid="reset-password-button"
                      disabled={loading}
                      className="w-full h-12 rounded-full font-bold uppercase tracking-wide neon-shadow hover:scale-105 transition-transform"
                    >
                      {loading ? 'Please wait...' : 'Reset Password'}
                    </Button>
                  </form>
                )}
                
                <Button
                  data-testid="back-to-login-button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowResetForm(false);
                    setResetToken('');
                    setResetEmail('');
                    setNewPassword('');
                  }}
                  variant="ghost"
                  className="w-full"
                >
                  Back to login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      data-testid="username-input"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="h-12 bg-secondary border-transparent focus:border-primary"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="email-input"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="h-12 bg-secondary border-transparent focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        data-testid="forgot-password-link"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    data-testid="password-input"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    className="h-12 bg-secondary border-transparent focus:border-primary"
                  />
                </div>
                
                <Button
                  type="submit"
                  data-testid="submit-button"
                  disabled={loading}
                  className="w-full h-12 rounded-full font-bold uppercase tracking-wide neon-shadow hover:scale-105 transition-transform"
                >
                  {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            )}
            
            {!showForgotPassword && (
              <div className="mt-6 text-center">
                <button
                  data-testid="toggle-auth-mode"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}