import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Zap, Shield, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AboutUsPage() {
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
            <h1 className="text-xl font-heading font-bold">About Us</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-2xl">Welcome to ishukart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <p className="text-muted-foreground text-base">
                ishukart is a modern social media platform that brings people together through stories, instant messaging, and real-time connections. We're building a community where moments matter and privacy is respected.
              </p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Zap className="w-8 h-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Lightning Fast</h4>
                  <p className="text-muted-foreground text-xs">
                    Real-time messaging and instant story updates keep you connected with what matters most.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Shield className="w-8 h-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Privacy First</h4>
                  <p className="text-muted-foreground text-xs">
                    Disappearing messages, story expiry, and granular privacy controls put you in charge of your data.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Heart className="w-8 h-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Built with Care</h4>
                  <p className="text-muted-foreground text-xs">
                    Every feature is designed with user experience and meaningful connections in mind.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <Users className="w-8 h-8 mb-3 text-primary" />
                  <h4 className="font-semibold mb-2">Community Driven</h4>
                  <p className="text-muted-foreground text-xs">
                    Connect with friends, share your moments, and discover new people around the world.
                  </p>
                </div>
              </div>

              <section className="mt-8">
                <h3 className="font-semibold text-base mb-3">Our Mission</h3>
                <p className="text-muted-foreground">
                  At ishukart, we believe in creating authentic connections in a digital world. Our mission is to provide a platform where you can share your moments, connect with friends, and express yourself freely while maintaining control over your privacy.
                </p>
              </section>

              <section className="mt-6">
                <h3 className="font-semibold text-base mb-3">What We Offer</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>✓ Real-time messaging with text, images, and videos</li>
                  <li>✓ 24-hour stories with optional promotion</li>
                  <li>✓ Disappearing messages for enhanced privacy</li>
                  <li>✓ User blocking and privacy controls</li>
                  <li>✓ Secure payment processing via Razorpay</li>
                  <li>✓ Dark mode interface for comfortable viewing</li>
                </ul>
              </section>

              <section className="mt-6">
                <h3 className="font-semibold text-base mb-3">Our Values</h3>
                <p className="text-muted-foreground">
                  <strong>Privacy:</strong> Your data belongs to you. We implement features like disappearing messages and give you full control over your content.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>Security:</strong> We use industry-standard encryption and secure payment processing to protect your information.
                </p>
                <p className="text-muted-foreground mt-2">
                  <strong>Community:</strong> We're committed to fostering a positive, respectful community where everyone feels welcome.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
