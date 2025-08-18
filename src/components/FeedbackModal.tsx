import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast.error('Please write your feedback before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-feedback', {
        body: {
          feedback: feedback.trim(),
          userEmail: email.trim() || 'Anonymous',
          timestamp: new Date().toISOString(),
        }
      });

      if (error) {
        console.error('Feedback submission error:', error);
        toast.error('Failed to send feedback. Please try again.');
        return;
      }

      toast.success('Thank you for your feedback! It has been sent successfully.');
      setFeedback('');
      setEmail('');
      onClose();
    } catch (error) {
      console.error('Feedback submission failed:', error);
      toast.error('Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-border max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-perception flex items-center gap-2 font-mono">
            <MessageSquare className="w-5 h-5" />
            Game Feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-game-text font-mono">
              Email (Optional)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="bg-game-bg border-game-border text-game-text font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback" className="text-game-text font-mono">
              Your Feedback *
            </Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think about the game, report bugs, suggest features..."
              rows={5}
              className="bg-game-bg border-game-border text-game-text font-mono resize-none"
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-game-border text-game-text hover:bg-game-bg font-mono"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !feedback.trim()}
              className="flex-1 bg-perception hover:bg-perception/90 text-white font-mono"
            >
              <Send className="w-4 h-4 mr-1" />
              {isSubmitting ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};