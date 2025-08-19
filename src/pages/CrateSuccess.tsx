import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Package, Gem, ArrowRight, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CratePurchaseResult {
  success: boolean;
  cubes: Array<{ cube_id: string; quantity: number }>;
  bonusShards: number;
  message: string;
}

export const CrateSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState<CratePurchaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');
  const crateType = searchParams.get('crate_type');

  useEffect(() => {
    const processPurchase = async () => {
      if (!sessionId) {
        setError('Missing session information');
        setProcessing(false);
        return;
      }

      try {
        console.log('Processing crate purchase with session:', sessionId);

        const { data, error } = await supabase.functions.invoke('process-crate-purchase', {
          body: { sessionId }
        });

        if (error) {
          console.error('Purchase processing failed:', error);
          setError(error.message || 'Failed to process purchase');
          return;
        }

        console.log('Purchase processed successfully:', data);
        setResult(data);
        
        toast({
          title: "🎉 Crate Opened Successfully!",
          description: data.message,
        });

      } catch (error) {
        console.error('Purchase processing error:', error);
        setError('An unexpected error occurred');
      } finally {
        setProcessing(false);
      }
    };

    processPurchase();
  }, [sessionId]);

  const getCrateTypeDisplay = () => {
    const displays = {
      basic: { name: 'Starter Crate', color: 'text-blue-400' },
      rare: { name: 'Adventure Crate', color: 'text-purple-400' },
      epic: { name: 'Hero Crate', color: 'text-orange-400' },
      legendary: { name: 'Champion Bundle', color: 'text-yellow-400' },
      premium: { name: 'Ultimate Collection', color: 'text-pink-400' }
    };
    
    return displays[crateType as keyof typeof displays] || { name: 'Premium Crate', color: 'text-green-400' };
  };

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center">
        <Card className="w-full max-w-md bg-game-surface border-game-border">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 border-4 border-perception border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-perception mb-2">Processing Your Purchase</h2>
            <p className="text-game-text-dim">Opening your crate and adding rewards to your inventory...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg flex items-center justify-center">
        <Card className="w-full max-w-md bg-game-surface border-red-500">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-red-500 mb-2">Purchase Failed</h2>
            <p className="text-game-text-dim mb-6">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const crateDisplay = getCrateTypeDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-game-bg via-game-surface to-game-bg p-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-perception font-orbitron mb-2">
            PURCHASE SUCCESSFUL!
          </h1>
          <p className="text-game-text-dim">
            Your {crateDisplay.name} has been opened and rewards added to your inventory
          </p>
        </div>

        {/* Results Display */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cubes Received */}
            <Card className="bg-game-surface border-game-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-perception">
                  <Gem className="w-5 h-5" />
                  Cubes Received ({result.cubes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {result.cubes.map((cube, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-game-bg rounded-lg border border-game-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Gem className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-game-text">
                            {cube.cube_id.split('_').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </div>
                          <div className="text-xs text-game-text-dim">
                            Quantity: {cube.quantity}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bonus Rewards */}
            <Card className="bg-game-surface border-game-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-perception">
                  <Package className="w-5 h-5" />
                  Bonus Rewards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                    <div className="flex items-center justify-between">
                      <span className="text-game-text font-bold">Bonus Shards</span>
                      <span className="text-2xl font-black text-yellow-400">
                        +{result.bonusShards.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-green-500/30">
                    <div className="text-center">
                      <div className="text-sm text-game-text-dim mb-1">Purchased</div>
                      <div className={`text-lg font-bold ${crateDisplay.color}`}>
                        {crateDisplay.name}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={() => navigate('/')}
            className="bg-perception hover:bg-perception/80 text-white px-8 py-3"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Game
          </Button>
          
          <Button 
            onClick={() => navigate('/shop')}
            variant="outline"
            className="border-game-border text-game-text hover:bg-game-surface px-8 py-3"
          >
            <Package className="w-4 h-4 mr-2" />
            Shop More Crates
          </Button>
        </div>

        {/* Success Message */}
        {result?.message && (
          <div className="mt-8 p-6 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
            <p className="text-green-400 font-bold">
              {result.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};