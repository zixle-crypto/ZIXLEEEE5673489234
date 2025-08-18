import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare, Send, X, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useUserDataStore } from '@/stores/userDataStore';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUserDataStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      toast.error('Please write your feedback before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          user_id: user?.id || null,
          user_email: email.trim() || user?.email || 'Anonymous',
          feedback_text: feedback.trim(),
          category,
          rating: rating || null,
        });

      if (error) {
        console.error('Feedback submission error:', error);
        toast.error('Failed to save feedback. Please try again.');
        return;
      }

      toast.success('Thank you for your feedback! It helps me improve the game.');
      setFeedback('');
      setEmail('');
      setRating(0);
      setCategory('general');
      onClose();
    } catch (error) {
      console.error('Feedback submission failed:', error);
      toast.error('Failed to save feedback. Please try again.');
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
            <Label htmlFor="category" className="text-game-text font-mono">
              Category
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 py-2 bg-game-bg border border-game-border rounded-md text-game-text font-mono focus:outline-none focus:ring-2 focus:ring-perception"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="gameplay">Gameplay</option>
              <option value="performance">Performance</option>
              <option value="ui">User Interface</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-game-text font-mono">
              Rating (Optional)
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-8 h-8 ${
                    star <= rating 
                      ? 'text-yellow-400' 
                      : 'text-game-border hover:text-yellow-200'
                  } transition-colors`}
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-current' : ''}`} />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-game-text font-mono">
              Email (Optional)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={user?.email || "your@email.com"}
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