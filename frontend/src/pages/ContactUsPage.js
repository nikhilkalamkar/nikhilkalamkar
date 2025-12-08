import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ContactUsPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate sending (you can implement actual email sending later)
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSending(false);
    }, 1000);
  };

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
            <h1 className="text-xl font-heading font-bold">Contact Us</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="font-heading">Get in Touch</CardTitle>
              <p className="text-sm text-muted-foreground">
                Have questions, feedback, or need support? We'd love to hear from you!
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-secondary">
                  <Mail className="w-6 h-6 mb-2 text-primary" />
                  <h4 className="font-semibold mb-1">Email Us</h4>
                  <p className="text-sm text-muted-foreground">support@ishukart.com</p>
                </div>

                <div className="p-4 rounded-xl bg-secondary">
                  <MessageSquare className="w-6 h-6 mb-2 text-primary" />
                  <h4 className="font-semibold mb-1">Response Time</h4>
                  <p className="text-sm text-muted-foreground">Within 24-48 hours</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name</label>
                  <Input
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <Input
                    required
                    type="email"
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Subject</label>
                  <Input
                    required
                    placeholder="What is your message about?"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    required
                    placeholder="Tell us more..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="min-h-32 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full"
                  disabled={sending}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>

              <div className="mt-8 p-4 rounded-xl bg-muted/30 border border-border/50">
                <h4 className="font-semibold mb-2">Payment & Refund Support</h4>
                <p className="text-xs text-muted-foreground">
                  For issues related to story promotions, payments, or refunds, please include your transaction ID and registered email address in your message. Our team will assist you within 24 hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
