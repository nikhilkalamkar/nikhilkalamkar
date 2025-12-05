import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Crown, Check, Zap, Upload, Star, Palette, Users, Shield } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const PremiumModal = ({ open, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    { icon: Zap, text: 'Ad-Free Experience' },
    { icon: Upload, text: 'Upload files up to 2GB' },
    { icon: Star, text: 'Premium Badge' },
    { icon: Palette, text: 'Custom Themes' },
    { icon: Users, text: 'Priority Support' },
    { icon: Shield, text: 'Advanced Privacy' }
  ];

  const handlePayment = () => {
    setIsProcessing(true);
    
    // Mock Razorpay payment
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Payment Successful! 🎉",
        description: "Welcome to ishukart Premium! Your subscription is now active.",
      });
      onClose();
    }, 2000);

    // In real implementation, this would be:
    // const options = {
    //   key: 'YOUR_RAZORPAY_KEY_ID',
    //   amount: 10000, // 100 INR in paise
    //   currency: 'INR',
    //   name: 'ishukart',
    //   description: 'Premium Subscription',
    //   handler: function (response) {
    //     // Handle successful payment
    //     toast({ title: "Payment Successful!", description: "Welcome to Premium!" });
    //     onClose();
    //   },
    //   prefill: {
    //     name: 'User Name',
    //     email: 'user@example.com'
    //   },
    //   theme: {
    //     color: '#2563eb'
    //   }
    // };
    // const rzp = new window.Razorpay(options);
    // rzp.open();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <Crown className="h-12 w-12 text-yellow-500" />
          </div>
          <DialogTitle className="text-center text-3xl">
            Upgrade to <span className="bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">Premium</span>
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Unlock exclusive features for just <span className="font-bold text-black">₹100/month</span>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-2 hover:border-blue-300 transition-all">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <p className="font-medium text-sm">{feature.text}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pricing Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mb-2">
                  Limited Time Offer
                </Badge>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold">₹100</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-gray-600">Cancel anytime, no commitment</p>
              </div>

              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-6 text-lg"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-5 w-5" />
                    Subscribe Now
                  </>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  Secure Payment
                </div>
                <div className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  Instant Activation
                </div>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-gray-500 mt-4">
            Powered by Razorpay - Secure payment gateway
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;