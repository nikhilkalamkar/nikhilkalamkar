import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        {/* Introduction */}
        <Card className="mb-6 border-2 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Shield className="h-12 w-12 text-blue-600 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Your Privacy Matters</h2>
                <p className="text-gray-600">
                  Last updated: December 2025
                </p>
                <p className="mt-3 text-gray-700">
                  At ishukart, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and safeguard your data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Personal Information:</h3>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Name and email address</li>
                <li>Mobile phone number</li>
                <li>Profile picture (if provided)</li>
                <li>Payment information (processed securely through Razorpay)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Usage Information:</h3>
              <ul className="list-disc ml-6 space-y-1 text-gray-700">
                <li>Messages and chat history</li>
                <li>Login timestamps and activity logs</li>
                <li>Device information and IP address</li>
                <li>Advertisement interactions (for advertisers)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-blue-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-2 text-gray-700">
              <li>To provide and maintain our messaging services</li>
              <li>To process premium subscriptions and advertisement payments</li>
              <li>To improve user experience and app functionality</li>
              <li>To send important notifications about your account</li>
              <li>To display relevant advertisements to free users</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To comply with legal obligations</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-6 w-6 text-blue-600" />
              Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <p>
              We implement industry-standard security measures to protect your personal information:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure password storage using bcrypt hashing</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication systems</li>
              <li>Secure payment processing through Razorpay</li>
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              While we strive to protect your data, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-6 w-6 text-blue-600" />
              Data Sharing and Third Parties
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-gray-700">
            <p>
              We do not sell your personal information to third parties. We may share your data with:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li><strong>Payment Processors:</strong> Razorpay for processing premium subscriptions and ad payments</li>
              <li><strong>Service Providers:</strong> Cloud hosting and database services (MongoDB)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Advertisement Partners:</strong> Anonymous analytics for ad performance (no personal data shared)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Your Rights and Choices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-gray-700">
            <p>You have the right to:</p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of promotional communications</li>
              <li>Upgrade to Premium for ad-free experience</li>
              <li>Export your data in a portable format</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, please contact us at <a href="mailto:privacy@ishukart.com" className="text-blue-600 hover:underline">privacy@ishukart.com</a>
            </p>
          </CardContent>
        </Card>

        {/* Cookies and Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p className="mb-2">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Keep you logged in</li>
              <li>Remember your preferences</li>
              <li>Analyze app usage and performance</li>
              <li>Track advertisement impressions and clicks</li>
            </ul>
            <p className="mt-3">
              You can control cookies through your browser settings, but some features may not work properly if cookies are disabled.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>
              ishukart is not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of ishukart after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-2 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-3">Contact Us</h3>
            <p className="text-gray-700 mb-3">
              If you have questions or concerns about this Privacy Policy, please contact us:
            </p>
            <div className="space-y-2 text-gray-700">
              <p><strong>Email:</strong> <a href="mailto:privacy@ishukart.com" className="text-blue-600 hover:underline">privacy@ishukart.com</a></p>
              <p><strong>Support:</strong> <a href="mailto:support@ishukart.com" className="text-blue-600 hover:underline">support@ishukart.com</a></p>
            </div>
            <Button onClick={() => navigate('/contact')} className="mt-4 bg-blue-600 hover:bg-blue-700">
              Contact Support
            </Button>
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

export default PrivacyPolicy;