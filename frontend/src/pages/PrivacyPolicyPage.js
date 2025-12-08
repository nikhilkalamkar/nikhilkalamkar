import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="sticky top-0 z-10 glass-effect border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-heading font-bold">Privacy Policy</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="font-heading">Privacy Policy for ishukart</CardTitle>
              <p className="text-sm text-muted-foreground">Last updated: December 7, 2024</p>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
                <p className="text-muted-foreground">
                  We collect information you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Account information (username, email, password)</li>
                  <li>Profile information (bio, profile picture)</li>
                  <li>Content you create (messages, stories, media files)</li>
                  <li>Payment information (processed securely through Razorpay)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
                <p className="text-muted-foreground">We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Enable real-time chat and story sharing features</li>
                  <li>Process payments for story promotions via Razorpay</li>
                  <li>Send you technical notices and updates</li>
                  <li>Respond to your comments and questions</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. Information Sharing</h3>
                <p className="text-muted-foreground">
                  We do not sell your personal information. We may share your information with:
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Service providers (Razorpay for payment processing)</li>
                  <li>Other users when you send messages or share stories</li>
                  <li>Law enforcement when required by law</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Data Storage and Security</h3>
                <p className="text-muted-foreground">
                  We implement appropriate security measures to protect your personal information. Your messages and stories are stored securely on our servers. Disappearing messages are automatically deleted based on your timer settings.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Your Rights</h3>
                <p className="text-muted-foreground">You have the right to:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Access and update your personal information</li>
                  <li>Delete your account and associated data</li>
                  <li>Control who can see your stories and messages</li>
                  <li>Block and unblock users</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Payment Information</h3>
                <p className="text-muted-foreground">
                  All payment processing is handled securely by Razorpay. We do not store your credit card or debit card information. Please refer to Razorpay's privacy policy for information about how they handle your payment data.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Children's Privacy</h3>
                <p className="text-muted-foreground">
                  Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. Changes to This Policy</h3>
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">9. Contact Us</h3>
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please contact us through our Contact Us page.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
