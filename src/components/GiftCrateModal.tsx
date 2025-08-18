/**
 * Gift Crate Modal - Gift premium crates to other users
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Gift, Gem, Star, Sparkles, Zap } from 'lucide-react';
import { CrateType } from '@/lib/crateSystem';

interface GiftCrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  crate: CrateType | null;
  onSend: (recipient: string, message: string) => Promise<void>;
  senderShards?: number;
}

export const GiftCrateModal: React.FC<GiftCrateModalProps> = ({
  isOpen,
  onClose,
  crate,
  onSend,
  senderShards = 0
}) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!crate) return null;

  const getCrateIcon = (price: number) => {
    if (price <= 500) return Sparkles;
    if (price <= 2000) return Star;
    if (price <= 10000) return Zap;
    return Gem;
  };

  const Icon = getCrateIcon(crate.price);

  const handleSend = async () => {
    if (!recipient.trim()) return;
    
    setIsSending(true);
    try {
      await onSend(recipient.trim(), message.trim());
      setRecipient('');
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Gift sending failed:', error);
    } finally {
      setIsSending(false);
    }
  };

  const isValidRecipient = recipient.includes('@') || recipient.length > 0;
  const canAfford = senderShards >= crate.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-game-surface border-game-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-perception font-orbitron text-center flex items-center gap-2 justify-center">
            <Gift className="w-5 h-5" />
            Gift Premium Crate
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Crate Preview */}
          <div className="text-center p-4 bg-game-bg rounded-lg border border-game-border">
            <div className={`mx-auto mb-3 p-3 rounded-xl border-2 border-game-border ${crate.visual.gradient} ${crate.visual.glow} w-fit`}>
              <Icon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
            <h3 className="font-bold text-perception mb-2">{crate.name}</h3>
            <p className="text-game-text-dim text-sm mb-3">{crate.description}</p>
            
            <div className="flex items-center justify-center gap-4 text-sm">
              <Badge variant="outline" className="border-green-500 text-green-500">
                ${(crate.price / 100).toFixed(2)} USD
              </Badge>
              <Badge variant="outline" className="border-perception text-perception">
                {crate.spinCount} Spins
              </Badge>
            </div>
          </div>

          {/* Recipient Input */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-game-text">
              Recipient (Email or Username)
            </Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="friend@example.com or username"
              className="bg-game-bg border-game-border text-game-text"
            />
            <p className="text-xs text-game-text-dim">
              Enter an email address or username to send this crate to
            </p>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-game-text">
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hope you enjoy this premium crate! 🎁"
              className="bg-game-bg border-game-border text-game-text resize-none h-20"
              maxLength={200}
            />
            <p className="text-xs text-game-text-dim">
              {message.length}/200 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-game-border text-game-text hover:bg-game-surface"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isValidRecipient || !canAfford || isSending}
              className={`flex-1 ${
                canAfford && isValidRecipient
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Send Gift
                </>
              )}
            </Button>
          </div>

          {!canAfford && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              <p className="text-red-400 text-sm">
                Insufficient funds. This crate costs ${(crate.price / 100).toFixed(2)} USD.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};