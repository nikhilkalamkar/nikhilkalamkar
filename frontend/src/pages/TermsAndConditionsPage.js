import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsAndConditionsPage() {
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
            <h1 className="text-xl font-heading font-bold">Terms and Conditions</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="font-heading">Terms and Conditions for ishukart</CardTitle>
              <p className="text-sm text-muted-foreground">Last updated: December 7, 2024</p>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
                <p className="text-muted-foreground">
                  By accessing and using ishukart, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">2. Use of Service</h3>
                <p className="text-muted-foreground">You agree to use ishukart only for lawful purposes. You are prohibited from:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Posting or transmitting any unlawful, threatening, abusive, or obscene content</li>
                  <li>Impersonating any person or entity</li>
                  <li>Violating any laws in your jurisdiction</li>
                  <li>Harassing, stalking, or threatening other users</li>
                  <li>Attempting to gain unauthorized access to our systems</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">3. User Account</h3>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account credentials. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">4. Content Ownership</h3>
                <p className="text-muted-foreground">
                  You retain ownership of any content you post on ishukart. By posting content, you grant us a non-exclusive, worldwide license to use, store, and display that content for the purpose of providing our services.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">5. Story Promotion and Payments</h3>
                <p className="text-muted-foreground">
                  Story promotion services are offered at ₹50/day (Basic) and ₹100/day (Premium). All payments are processed securely through Razorpay. Payments are non-refundable once a story promotion begins.
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                  <li>Promotion duration: 24 hours from payment confirmation</li>
                  <li>View estimates are approximate and not guaranteed</li>
                  <li>We reserve the right to reject or remove promoted content</li>
                  <li>Refunds not available for completed promotions</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">6. Disappearing Messages</h3>
                <p className="text-muted-foreground">
                  Messages may be set to disappear after a specified time (5 seconds to 24 hours). Once deleted, messages cannot be recovered. We are not responsible for any data loss resulting from the use of disappearing messages.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">7. Termination</h3>
                <p className="text-muted-foreground">
                  We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our sole discretion.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">8. Limitation of Liability</h3>
                <p className="text-muted-foreground">
                  ishukart is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including but not limited to data loss, service interruptions, or payment processing issues.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">9. Modifications to Terms</h3>
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">10. Governing Law</h3>
                <p className="text-muted-foreground">
                  These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
