import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../hooks/use-toast';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signup(email, password, username, fullName);
      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-4">
        {/* Main Signup Box */}
        <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 p-10">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
            Instagram
          </h1>
          <p className="text-center text-gray-500 font-semibold mb-6">
            Sign up to see photos and videos from your friends.
          </p>

          <Button className="w-full bg-blue-500 hover:bg-blue-600 mb-4">
            Log in with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-black text-gray-500">OR</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-xs"
            />
            <Input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full text-xs"
            />
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full text-xs"
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-xs"
            />

            <p className="text-xs text-gray-500 text-center py-3">
              People who use our service may have uploaded your contact information to Instagram.
            </p>

            <p className="text-xs text-gray-500 text-center py-2">
              By signing up, you agree to our Terms , Privacy Policy and Cookies Policy.
            </p>

            <Button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600">
              {loading ? 'Signing up...' : 'Sign up'}
            </Button>
          </form>
        </div>

        {/* Log In Box */}
        <div className="bg-white dark:bg-black border border-gray-300 dark:border-gray-800 p-6 text-center">
          <p className="text-sm">
            Have an account?{' '}
            <Link to="/login" className="text-blue-500 font-semibold">
              Log in
            </Link>
          </p>
        </div>

        {/* Get the app */}
        <div className="text-center">
          <p className="text-sm mb-4">Get the app.</p>
          <div className="flex gap-2 justify-center">
            <img
              src="https://www.instagram.com/static/images/appstore-install-badges/badge_ios_english-en.png/180ae7a0bcf7.png"
              alt="Download on App Store"
              className="h-10"
            />
            <img
              src="https://www.instagram.com/static/images/appstore-install-badges/badge_android_english-en.png/e9cd846dc274.png"
              alt="Get it on Google Play"
              className="h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
