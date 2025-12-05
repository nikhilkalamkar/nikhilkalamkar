import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, Mail } from 'lucide-react';

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Refund Policy
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Introduction */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <RefreshCw className="h-12 w-12 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Refund & Cancellation Policy</h2>
                <p className="text-gray-600 mb-2">
                  Last updated: December 2025
                </p>
                <p className="text-gray-700">
                  This Refund Policy explains our policies regarding refunds for Premium subscriptions and Advertisement payments on ishukart.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Premium Subscription Refunds */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-blue-600" />
              Premium Subscription Refunds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-lg">7-Day Money-Back Guarantee</h3>
              <p className="text-gray-700 mb-2">
                We offer a <strong>7-day money-back guarantee</strong> for first-time Premium subscribers. If you're not satisfied with Premium features, you can request a full refund within 7 days of purchase.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Eligible for Refund:
              </h4>
              <ul className="list-disc ml-6 space-y-1 text-green-800">
                <li>Request made within 7 days of purchase</li>
                <li>First-time Premium subscription</li>
                <li>Technical issues preventing service use</li>
                <li>Duplicate or accidental charges</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Not Eligible for Refund:
              </h4>
              <ul className="list-disc ml-6 space-y-1 text-red-800">
                <li>Requests after 7 days of purchase</li>
                <li>Renewal subscriptions (only new purchases)</li>
                <li>Change of mind after using Premium features</li>
                <li>Violation of Terms of Service</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Advertisement Refunds */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              Advertisement Payment Refunds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-lg">Ad Campaign Refunds</h3>
              <p className="text-gray-700 mb-3">
                Advertisement payments are generally non-refundable. However, refunds may be issued in the following cases:
              </p>
            </div>

            <div className="space-y-3">
              <div className="border-l-4 border-green-500 pl-4 py-2">
                <p className="font-semibold text-green-900">Ad Rejected by Admin</p>
                <p className="text-sm text-gray-700">Full refund if your ad is rejected during moderation due to content policy violations.</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="font-semibold text-blue-900">Technical Issues</p>
                <p className="text-sm text-gray-700">Refund for unspent budget if technical issues prevent ad delivery.</p>
              </div>

              <div className="border-l-4 border-orange-500 pl-4 py-2">
                <p className="font-semibold text-orange-900">Advertiser Cancellation</p>
                <p className="text-sm text-gray-700">Refund of remaining budget if you pause/cancel campaign before budget is spent (₹20 per impression already served will be deducted).</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-900">
                <strong>Note:</strong> Impressions already served (₹20 each) are non-refundable. Only the unspent portion of your budget is eligible for refund.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Refund Process */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" />
              How to Request a Refund
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal ml-6 space-y-3 text-gray-700">
              <li>
                <strong>Contact Support:</strong> Email us at <a href="mailto:refunds@ishukart.com" className="text-blue-600 hover:underline">refunds@ishukart.com</a> with your:
                <ul className="list-disc ml-6 mt-1 text-sm">
                  <li>Account email address</li>
                  <li>Transaction ID (Razorpay payment ID)</li>
                  <li>Reason for refund request</li>
                  <li>Date of purchase</li>
                </ul>
              </li>
              <li>
                <strong>Review Process:</strong> Our team will review your request within 2-3 business days.
              </li>
              <li>
                <strong>Approval:</strong> If approved, refund will be processed to your original payment method.
              </li>
              <li>
                <strong>Processing Time:</strong> Refunds take 5-7 business days to reflect in your account.
              </li>
            </ol>
          </CardContent>
        </Card>

        {/* Cancellation Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Subscription Cancellation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <p>
              You can cancel your Premium subscription at any time from your account settings. Upon cancellation:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>You'll retain Premium access until the end of your current billing period</li>
              <li>No further charges will be made</li>
              <li>Your account will revert to the free plan after expiration</li>
              <li>All your data and messages will be preserved</li>
            </ul>
            <p className="text-sm text-gray-600 mt-3">
              <strong>Note:</strong> Cancellation does not automatically trigger a refund. Refer to refund eligibility criteria above.
            </p>
          </CardContent>
        </Card>

        {/* Special Cases */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Special Circumstances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <div>
              <h4 className="font-semibold mb-1">Duplicate Charges</h4>
              <p className="text-sm">If you've been charged multiple times for the same transaction, contact us immediately for a full refund of duplicate charges.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Service Unavailability</h4>
              <p className="text-sm">If ishukart services are unavailable for more than 24 continuous hours, pro-rated refunds may be issued to Premium subscribers.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-1">Account Termination</h4>
              <p className="text-sm">No refunds are provided if your account is terminated due to violation of Terms of Service.</p>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Mail className="h-10 w-10 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Need Help with Refunds?</h3>
                <p className="text-gray-700 mb-3">
                  If you have questions about refunds or need assistance with a refund request, our support team is here to help.
                </p>
                <div className="space-y-2 text-gray-700 mb-4">
                  <p><strong>Refund Inquiries:</strong> <a href="mailto:refunds@ishukart.com" className="text-blue-600 hover:underline">refunds@ishukart.com</a></p>
                  <p><strong>General Support:</strong> <a href="mailto:support@ishukart.com" className="text-blue-600 hover:underline">support@ishukart.com</a></p>
                  <p><strong>Phone:</strong> +91 800 123 4567 (Mon-Fri, 9 AM - 6 PM IST)</p>
                </div>
                <Button onClick={() => navigate('/contact')} className="bg-blue-600 hover:bg-blue-700">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 ishukart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default RefundPolicy;