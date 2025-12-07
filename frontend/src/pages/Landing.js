import { useState, useContext } from 'react';
import { AuthContext, API } from '@/App';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Landing() {
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      login(response.data.token, response.data.user);
      toast.success(`Welcome ${response.data.user.username}!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
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
      const response = await axios.post(`${API}/auth/forgot-password`, { email: resetEmail });
      toast.success(response.data.message);
      setShowForgotPassword(false);
      setShowResetPassword(true);
    } catch (error) {
      toast.error('Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!formData.password) {
      toast.error('Please enter a new password');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/auth/reset-password`, {
        email: resetEmail,
        new_password: formData.password
      });
      toast.success('Password reset successfully! Please login.');
      setShowResetPassword(false);
      setResetEmail('');
      setFormData({ username: '', email: '', password: '' });
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 bg-[rgb(37 99 235)] rounded-3xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Camera size={40} className="text-black" strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Forgot Password
            </h1>
            <p className="text-gray-600 font-medium">Enter your email to reset password</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black focus:bg-white transition-all"
                data-testid="forgot-email-input"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[rgb(37 99 235)] text-black font-bold rounded-full h-12 hover:scale-105 transition-transform shadow-lg"
                data-testid="verify-email-btn"
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full bg-gray-100 text-gray-700 font-bold rounded-full h-12 hover:bg-gray-200"
                data-testid="back-to-login-btn"
              >
                Back to Login
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 bg-[rgb(37 99 235)] rounded-3xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Camera size={40} className="text-black" strokeWidth={2.5} />
            </motion.div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Reset Password
            </h1>
            <p className="text-gray-600 font-medium">Enter your new password</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Resetting password for: <strong>{resetEmail}</strong>
              </div>
              <Input
                type="password"
                placeholder="New Password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black focus:bg-white transition-all"
                data-testid="new-password-input"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[rgb(37 99 235)] text-black font-bold rounded-full h-12 hover:scale-105 transition-transform shadow-lg"
                data-testid="reset-password-btn"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl mb-4 shadow-lg"
            whileHover={{ scale: 1.05, rotate: 5 }}
          >
            <Camera size={40} className="text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 
            className="text-5xl font-bold mb-2" 
            style={{ fontFamily: 'Outfit, sans-serif' }}
            data-testid="app-title"
          >
            ishukart
          </h1>
          <p className="text-gray-600 font-medium">Share moments that disappear</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-full font-bold h-12 ${
                isLogin 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid="login-tab-btn"
            >
              Login
            </Button>
            <Button
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-full font-bold h-12 ${
                !isLogin 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              data-testid="signup-tab-btn"
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <Input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black focus:bg-white transition-all"
                data-testid="username-input"
              />
            )}
            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black focus:bg-white transition-all"
              data-testid="email-input"
            />
            <Input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="h-12 rounded-xl bg-gray-50 border-transparent focus:border-black focus:bg-white transition-all"
              data-testid="password-input"
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold rounded-full h-12 hover:scale-105 transition-transform shadow-lg hover:bg-blue-700"
              data-testid="auth-submit-btn"
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
            </Button>
            
            {isLogin && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gray-600 hover:text-black font-medium transition-colors"
                  data-testid="forgot-password-link"
                >
                  Forgot Password?
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
}