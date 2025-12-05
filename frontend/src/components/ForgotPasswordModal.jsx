import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from '../hooks/use-toast';
import { Loader2, Mail, Key } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ForgotPasswordModal = ({ open, onClose }) => {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP, 3: New password
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!identifier || identifier.trim() === '') {
      toast({
        title: "Error",
        description: "Please enter your email or mobile number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { identifier: identifier.trim() });
      
      if (response.data && response.data.resetToken) {
        setResetToken(response.data.resetToken);
        // For demo, auto-fill the OTP
        if (response.data.otp) {
          setOtp(response.data.otp);
        }
        toast({
          title: "✅ Reset Code Generated",
          description: `Your verification code: ${response.data.otp}`,
          duration: 10000
        });
        setStep(2);
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      let errorMessage = "Failed to send reset code";
      
      if (error.response) {
        // Server responded with error
        if (error.response.status === 404) {
          errorMessage = "Account not found. Please check your email/mobile number or register first.";
        } else {
          errorMessage = error.response.data?.detail || error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        // Request made but no response
        errorMessage = "Cannot connect to server. Please check your internet connection.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post(`${API}/auth/verify-otp`, {
        identifier,
        otp,
        resetToken
      });
      toast({
        title: "Code Verified",
        description: "Please enter your new password"
      });
      setStep(3);
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Invalid or expired code",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post(`${API}/auth/reset-password`, {
        identifier,
        otp,
        resetToken,
        newPassword
      });
      toast({
        title: "Password Reset Successful",
        description: "You can now login with your new password"
      });
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to reset password",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setIdentifier('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter your email or mobile number to receive a reset code"}
            {step === 2 && "Enter the 6-digit code sent to your account"}
            {step === 3 && "Create a new password for your account"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Enter Email/Mobile */}
        {step === 1 && (
          <form onSubmit={handleRequestReset} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="identifier">Email or Mobile Number</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="email@example.com or +919876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4" />
                A 6-digit verification code will be generated
              </p>
              <p className="text-xs text-blue-700">
                <strong>Test accounts:</strong> rahul@example.com, +919876543211, priya@example.com
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Reset Code'
              )}
            </Button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-4 mt-4">
            {/* Demo OTP Display */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-2">📧 Verification Code (Demo Mode)</p>
              <div className="flex items-center justify-between bg-white rounded p-3 border border-green-200">
                <span className="text-2xl font-mono font-bold text-green-700 tracking-wider">{otp || '------'}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(otp);
                    toast({ title: "Copied!", description: "Code copied to clipboard" });
                  }}
                  className="text-xs"
                >
                  Copy
                </Button>
              </div>
              <p className="text-xs text-green-700 mt-2">
                In production, this code would be sent to your email/mobile
              </p>
            </div>
            
            <div>
              <Label htmlFor="otp">Enter 6-Digit Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                className="text-center text-lg tracking-widest font-mono"
              />
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <p>⏱️ Code expires in 10 minutes</p>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
              <p className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Password must be at least 6 characters
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;