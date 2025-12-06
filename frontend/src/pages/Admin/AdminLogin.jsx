import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';
import { Shield } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Mock admin login - will be replaced with actual API call
      if (email === 'admin@ishukart.com' && password === 'admin123') {
        localStorage.setItem('ishukart_admin', JSON.stringify({ email, role: 'admin' }));
        toast({
          title: 'Success',
          description: 'Logged in as admin successfully!',
        });
        navigate('/admin/dashboard');
      } else {
        toast({
          title: 'Error',
          description: 'Invalid admin credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log in. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-md w-full space-y-4">
        <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 rounded-lg p-10 shadow-lg">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-4 mb-4">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              IshukArt
            </h1>
            <p className="text-sm text-gray-500 mt-2">Admin Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
            <Input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />

            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              {loading ? 'Logging in...' : 'Login as Admin'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Demo Credentials: admin@ishukart.com / admin123
            </p>
          </div>
        </div>

        <div className="text-center">
          <a href="/login" className="text-sm text-purple-500 hover:text-purple-600">
            ← Back to User Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
