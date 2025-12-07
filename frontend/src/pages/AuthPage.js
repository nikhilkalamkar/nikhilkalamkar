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
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
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
              {isLogin ? 'Welcome back' : 'Create account'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'Sign in to your account' : 'Start sharing your stories'}
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <Label htmlFor="password">Password</Label>
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
            
            <div className="mt-6 text-center">
              <button
                data-testid="toggle-auth-mode"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}