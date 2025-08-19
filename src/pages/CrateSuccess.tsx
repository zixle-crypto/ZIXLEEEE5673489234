/**
 * Crate Success Page - Shows crate opening results
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Gift, Sparkles, Star, Gem } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CrateReward {
  cube_id: string;
  quantity: number;
}

interface ProcessResult {
  success: boolean;
  cubes: CrateReward[];
  bonusShards: number;
  message: string;
}

export const CrateSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [rewards, setRewards] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const crateType = searchParams.get('crate_type');

  useEffect(() => {
    const processPayment = async () => {
      if (!sessionId) {
        setError('Invalid session - missing session ID');
        setProcessing(false);
        return;
      }

      try {
        console.log('Processing crate purchase with session:', sessionId);
        
        const { data, error: processError } = await supabase.functions.invoke('process-crate-purchase', {
          body: { sessionId }
        });

        if (processError) {
          console.error('Process error:', processError);
          setError(processError.message || 'Failed to process crate purchase');
          return;
        }

        if (data?.success) {
          setRewards(data as ProcessResult);
          toast({
            title: "Crate Opened Successfully! 🎉",
            description: data.message,
          });
        } else {
          setError(data?.error || 'Unknown error occurred');
        }
      } catch (err) {
        console.error('Payment processing error:', err);
        setError('Failed to process your crate purchase');
      } finally {
        setProcessing(false);
      }
    };

    processPayment();
  }, [sessionId]);

  const getCrateIcon = (type: string) => {
    switch (type) {
      case 'basic': return Sparkles;
      case 'rare': return Star;
      case 'epic': return Gem;
      case 'legendary': return Gift;
      case 'premium': return Gift;
      default: return Sparkles;
    }
  };

  const getCrateColor = (type: string) => {
    switch (type) {
      case 'basic': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-yellow-600';
      case 'premium': return 'from-pink-400 to-pink-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center p-4">
        <Card className="bg-game-surface border-game-border max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="animate-spin w-12 h-12 border-4 border-perception border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-perception mb-2">Opening Your Crate...</h2>
            <p className="text-game-text-dim">Processing your purchase and generating rewards</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center p-4">
        <Card className="bg-game-surface border-game-border max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Purchase Failed</h2>
            <p className="text-game-text-dim mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="bg-perception hover:bg-perception/90">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = getCrateIcon(crateType || 'basic');

  return (
    <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mb-4"
          >
            <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${getCrateColor(crateType || 'basic')} flex items-center justify-center shadow-lg`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-perception mb-2"
          >
            Crate Opened Successfully!
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-game-text-dim"
          >
            {rewards?.message || 'Your crate has been processed successfully!'}
          </motion.p>
        </div>

        {/* Rewards Display */}
        {rewards && (
          <div className="grid gap-6">
            {/* Bonus Shards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="bg-game-surface border-game-border">
                <CardHeader>
                  <CardTitle className="text-perception flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Bonus Shards Awarded
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-400">
                    +{rewards.bonusShards} ⬟
                  </div>
                  <p className="text-game-text-dim">Added to your collection</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cubes Received */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card className="bg-game-surface border-game-border">
                <CardHeader>
                  <CardTitle className="text-perception flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Cubes Received ({rewards.cubes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rewards.cubes.map((cube, index) => (
                      <motion.div
                        key={`${cube.cube_id}-${index}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="bg-game-bg rounded-lg p-3 border border-game-border"
                      >
                        <div className="text-sm font-medium text-game-text">
                          {cube.cube_id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </div>
                        <div className="text-xs text-game-text-dim">
                          Quantity: {cube.quantity}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8 space-y-4"
        >
          <div className="space-x-4">
            <Button 
              onClick={() => navigate('/')}
              className="bg-perception hover:bg-perception/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
            
            <Button 
              onClick={() => navigate('/?screen=inventory')}
              variant="outline"
              className="border-game-border text-game-text hover:bg-game-surface"
            >
              View Inventory
            </Button>
          </div>
          
          <p className="text-xs text-game-text-dim">
            Your rewards have been automatically added to your account
          </p>
        </motion.div>
      </div>
    </div>
  );
};