import React, { useState } from 'react';
import { X, TrendingUp, Users, Clock, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';

const BoostPostModal = ({ post, onClose }) => {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  const boostPlans = [
    {
      id: 'basic',
      name: 'Basic Boost',
      price: 99,
      duration: '3 days',
      reach: '1,000-2,000',
      features: [
        'Appear in Explore page',
        'Priority in follower feeds',
        '3 days promotion'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Boost',
      price: 249,
      duration: '7 days',
      reach: '5,000-10,000',
      features: [
        'Featured in Explore',
        'Top of follower feeds',
        'Suggested to similar users',
        '7 days promotion'
      ],
      popular: true
    },
    {
      id: 'premium',
      name: 'Premium Boost',
      price: 499,
      duration: '14 days',
      reach: '15,000-30,000',
      features: [
        'Premium placement',
        'Maximum visibility',
        'Targeted recommendations',
        'Analytics dashboard',
        '14 days promotion'
      ]
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
        title: 'Select a plan',
        description: 'Please choose a boost plan to continue',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const plan = boostPlans.find(p => p.id === selectedPlan);
      
      // Create Razorpay order (this should come from backend in production)
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_dummy_key',
        amount: plan.price * 100, // Amount in paise
        currency: 'INR',
        name: 'IshukArt',
        description: `${plan.name} - ${plan.duration}`,
        image: '/logo.png',
        handler: function (response) {
          // Payment successful
          console.log('Payment successful:', response);
          
          // Store boost info in localStorage
          const boostData = {
            postId: post.id,
            planId: plan.id,
            planName: plan.name,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + (parseInt(plan.duration) * 24 * 60 * 60 * 1000)).toISOString(),
            paymentId: response.razorpay_payment_id,
            amount: plan.price
          };
          
          const boostedPosts = JSON.parse(localStorage.getItem('ishukart_boosted_posts') || '[]');
          boostedPosts.push(boostData);
          localStorage.setItem('ishukart_boosted_posts', JSON.stringify(boostedPosts));
          
          toast({
            title: 'Post Boosted! 🚀',
            description: `Your post will be promoted for ${plan.duration}`,
          });
          
          onClose();
        },
        prefill: {
          name: post.user.username,
          email: post.user.email || 'user@ishukart.com'
        },
        theme: {
          color: '#8B5CF6'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast({
        title: 'Payment Error',
        description: 'Failed to initiate payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Boost Post</h2>
                <p className="text-sm text-gray-500">Get more reach & engagement</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Post Preview */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-500 mb-2">Your Post</p>
          <div className="flex items-center gap-3">
            <img 
              src={post.images[0]} 
              alt="Post preview" 
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{post.user.username}</p>
              <p className="text-sm text-gray-500 truncate">{post.caption}</p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="p-4">
          <p className="text-sm font-medium text-gray-500 mb-4">Choose Your Plan</p>
          <div className="space-y-3">
            {boostPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                } ${plan.popular ? 'ring-2 ring-purple-500 ring-offset-2' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    MOST POPULAR
                  </div>
                )}
                
                {selectedPlan === plan.id && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {plan.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {plan.reach} reach
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{plan.price}
                    </div>
                    <div className="text-xs text-gray-500">one-time</div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleBoost}
              disabled={!selectedPlan || loading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? 'Processing...' : selectedPlan ? `Pay ₹${boostPlans.find(p => p.id === selectedPlan)?.price}` : 'Select a Plan'}
            </Button>
          </div>
          <p className="text-xs text-center text-gray-500 mt-2">
            Secure payment powered by Razorpay 🔒
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoostPostModal;