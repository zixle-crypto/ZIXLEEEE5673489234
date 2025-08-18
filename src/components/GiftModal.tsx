/**
 * Gift Modal Component - Send cubes as gifts to friends
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, Mail, Github, X, Star } from 'lucide-react';
import { CubeItem } from '@/stores/shopStore';

interface GiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: CubeItem | null;
  onSend: (recipient: string, message: string) => void;
  senderShards: number;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  isOpen,
  onClose,
  item,
  onSend,
  senderShards
}) => {
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<'email' | 'github'>('email');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !item) return null;

  const canAfford = senderShards >= item.cost;

  const handleSend = async () => {
    if (!recipient.trim()) return;
    
    setIsLoading(true);
    try {
      await onSend(recipient.trim(), message.trim());
      setRecipient('');
      setMessage('');
    } catch (error) {
      console.error('Failed to send gift:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      case 'prismatic': return 'text-pink-400';
      default: return 'text-gray-400';
    }
  };

  const getPlaceholder = () => {
    return recipientType === 'email' 
      ? 'friend@example.com' 
      : 'github-username';
  };

  const getValidationMessage = () => {
    if (!recipient.trim()) return '';
    
    if (recipientType === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient)) {
        return 'Please enter a valid email address';
      }
    } else {
      const githubRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]){0,38}$/;
      if (!githubRegex.test(recipient)) {
        return 'Please enter a valid GitHub username';
      }
    }
    
    return '';
  };

  const validationError = getValidationMessage();
  const isValidRecipient = recipient.trim() && !validationError;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-game-surface border-game-border">
        <CardHeader className="relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 text-game-text-dim hover:text-game-text"
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="text-center">
            <Gift className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <CardTitle className="text-xl font-bold text-perception font-mono">
              SEND GIFT
            </CardTitle>
            <p className="text-sm text-game-text-dim mt-1">
              Gift a cube to a friend
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Gift Item Display */}
          <div className="bg-game-bg border border-game-border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold font-mono ${getRarityColor(item.rarity)}`}>
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-perception">⬟</span>
                  <span className="text-game-text font-bold">{item.cost}</span>
                  <span className="text-game-text-dim">shards</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Type Selection */}
          <div>
            <Label className="text-game-text font-mono mb-2 block">SEND TO:</Label>
            <div className="flex gap-2 mb-3">
              <Button
                variant={recipientType === 'email' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('email')}
                className={recipientType === 'email' ? 'bg-perception text-white' : 'border-game-border text-game-text'}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant={recipientType === 'github' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('github')}
                className={recipientType === 'github' ? 'bg-perception text-white' : 'border-game-border text-game-text'}
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub
              </Button>
            </div>
          </div>

          {/* Recipient Input */}
          <div>
            <Label htmlFor="recipient" className="text-game-text font-mono mb-2 block">
              {recipientType === 'email' ? 'EMAIL ADDRESS' : 'GITHUB USERNAME'}
            </Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={getPlaceholder()}
              className="bg-game-bg border-game-border text-game-text font-mono"
            />
            {validationError && (
              <p className="text-red-400 text-xs mt-1 font-mono">{validationError}</p>
            )}
          </div>

          {/* Gift Message */}
          <div>
            <Label htmlFor="message" className="text-game-text font-mono mb-2 block">
              GIFT MESSAGE (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={3}
              maxLength={200}
              className="bg-game-bg border-game-border text-game-text font-mono resize-none"
            />
            <p className="text-xs text-game-text-dim mt-1 font-mono">
              {message.length}/200 characters
            </p>
          </div>

          {/* Balance Check */}
          {!canAfford && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-3">
              <p className="text-red-400 text-sm font-mono">
                Insufficient shards! You need {item.cost} ⬟ but only have {senderShards} ⬟
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-game-border text-game-text hover:bg-game-surface font-mono"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleSend}
              disabled={!isValidRecipient || !canAfford || isLoading}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-mono font-bold"
            >
              {isLoading ? 'SENDING...' : 'SEND GIFT'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};