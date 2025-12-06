import React, { useState } from 'react';
import { X, TrendingUp, Users, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import axios from 'axios';
import { useToast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BoostPostModal = ({ post, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const boostPlans = [
    {
      id: 'basic',
      name: 'Basic Boost',
      reach: 10000,
      price: 100,
      duration: '7 days',
      features: ['10,000 users reach', 'Priority in feeds', '7 days active', 'Analytics dashboard']
    },
    {
      id: 'pro',
      name: 'Pro Boost',
      reach: 50000,
      price: 450,
      duration: '7 days',
      features: ['50,000 users reach', 'Top priority', '7 days active', 'Advanced analytics', 'Featured badge'],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Boost',
      reach: 100000,
      price: 850,
      duration: '7 days',
      features: ['100,000 users reach', 'Maximum priority', '7 days active', 'Premium analytics', 'Featured badge', 'Explore page feature']
    }
  ];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleBoost = async () => {
    if (!selectedPlan) {
      toast({
        title: 'Error',
        description: 'Please select a boost plan',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) {
        toast({
          title: 'Error',
          description: 'Razorpay SDK failed to load',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Create order
      const orderResponse = await axios.post(
        `${BACKEND_URL}/api/payments/create-boost-order`,
        {
          post_id: post.id,
          amount: selectedPlan.price * 100, // Convert to paise
          reach: selectedPlan.reach
        },
        { withCredentials: true }
      );

      const { order_id, amount, currency, key_id } = orderResponse.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: 'IshukArt',
        description: `Boost Post - ${selectedPlan.name}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              `${BACKEND_URL}/api/payments/verify-payment`,
              {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                post_id: post.id
              },
              { withCredentials: true }
            );

            toast({
              title: 'Success! 🎉',
              description: verifyResponse.data.message,
            });

            onClose();
            window.location.reload(); // Refresh to show boosted status
          } catch (error) {
            toast({
              title: 'Verification Failed',
              description: error.response?.data?.detail || 'Payment verification failed',
              variant: 'destructive'
            });
          }
        },
        prefill: {
          name: post.user.fullName || post.user.username,
          email: post.user.email || '',
          contact: ''
        },
        theme: {
          color: '#9333EA'
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast({
              title: 'Payment Cancelled',
              description: 'You cancelled the payment'
            });
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create order',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Boost Your Post</h2>
            <p className="text-sm text-gray-500 mt-1">Reach more users and grow your audience</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <img src={post.images[0]} alt="Post" className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <p className="font-semibold">{post.user.username}</p>
              <p className="text-sm text-gray-500 line-clamp-2">{post.caption}</p>
            </div>
          </div>
        </div>

        {/* Boost Plans */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Choose Your Boost Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {boostPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative p-6 cursor-pointer transition-all hover:shadow-lg ${
                  selectedPlan?.id === plan.id
                    ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-900/10'
                    : 'hover:border-purple-300'
                } ${plan.popular ? 'border-purple-400' : ''}`}
                onClick={() => setSelectedPlan(plan)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                      POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-4">
                  <h4 className="text-lg font-bold mb-2">{plan.name}</h4>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-bold">₹{plan.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{plan.duration}</p>
                </div>

                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{plan.reach.toLocaleString()} reach</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-lg p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Why Boost Your Post?
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✓ Reach thousands of targeted users</li>
              <li>✓ Increase engagement and followers</li>
              <li>✓ Appear in top feeds and explore page</li>
              <li>✓ Detailed analytics and insights</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleBoost}
            disabled={!selectedPlan || loading}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? 'Processing...' : selectedPlan ? `Pay ₹${selectedPlan.price}` : 'Select Plan'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BoostPostModal;
