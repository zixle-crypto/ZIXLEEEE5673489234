import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Crown, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  email: string;
  total_shards: number;
  rooms_completed: number;
  best_score: number;
  is_current_user: boolean;
}

interface LeaderboardProps {
  isVisible: boolean;
  onClose: () => void;
  currentUser?: any;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isVisible, onClose, currentUser }) => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);

  useEffect(() => {
    if (isVisible && currentUser) {
      fetchLeaderboard();
    }
  }, [isVisible, currentUser]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_leaderboard_with_context', {
          p_user_id: currentUser?.id || null
        });

      if (error) {
        console.error('Error fetching leaderboard:', error);
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive"
        });
        return;
      }

      setLeaderboardData(data || []);
      
      // Find current user's entry
      const userEntry = data?.find(entry => entry.is_current_user);
      setCurrentUserRank(userEntry || null);
      
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load leaderboard",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <Star className="w-4 h-4 text-game-text-dim" />;
    }
  };

  const getRankColor = (rank: number, isCurrentUser: boolean) => {
    if (isCurrentUser) return "bg-perception/20 border-perception";
    
    switch (rank) {
      case 1:
        return "bg-yellow-500/20 border-yellow-500/50";
      case 2:
        return "bg-gray-400/20 border-gray-400/50";
      case 3:
        return "bg-amber-600/20 border-amber-600/50";
      default:
        return "bg-game-surface border-game-border";
    }
  };

  const getDisplayName = (email: string) => {
    return email.split('@')[0];
  };

  const getUsersAroundCurrentUser = () => {
    if (!currentUserRank || !leaderboardData.length) return [];
    
    const currentRank = currentUserRank.rank;
    const rangeSize = 2; // Show 2 above and 2 below
    
    return leaderboardData.filter(entry => 
      entry.rank >= Math.max(1, currentRank - rangeSize) && 
      entry.rank <= currentRank + rangeSize
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-game-surface border-game-border">
        <CardHeader className="text-center bg-gradient-to-r from-perception/20 to-transparent">
          <CardTitle className="text-3xl font-black text-perception font-orbitron flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8" />
            GLOBAL LEADERBOARD
            <Trophy className="w-8 h-8" />
          </CardTitle>
          <p className="text-game-text-dim font-mono">
            Compete for the most shards across all dimensions
          </p>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-perception"></div>
              <p className="text-game-text-dim font-mono mt-4">Loading leaderboard...</p>
            </div>
          ) : (
            <>
              {/* Current User Stats */}
              {currentUserRank && (
                <Card className={`${getRankColor(currentUserRank.rank, true)} border-2`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRankIcon(currentUserRank.rank)}
                        <div>
                          <h3 className="font-bold text-perception font-mono">YOUR RANK</h3>
                          <p className="text-game-text-dim text-sm font-mono">
                            {getDisplayName(currentUserRank.email)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-perception font-mono">
                          #{currentUserRank.rank}
                        </div>
                        <div className="text-sm text-game-text-dim font-mono">
                          of {leaderboardData.length} players
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-game-text font-mono">
                          {currentUserRank.total_shards} ⬟
                        </div>
                        <div className="text-sm text-game-text-dim font-mono">
                          {currentUserRank.rooms_completed} rooms
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Players */}
                <div>
                  <h3 className="text-xl font-bold text-game-text font-mono mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    TOP PLAYERS
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {leaderboardData.slice(0, 10).map((entry) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${getRankColor(entry.rank, entry.is_current_user)}`}
                      >
                        <div className="flex items-center gap-3">
                          {getRankIcon(entry.rank)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-game-text font-mono">
                                #{entry.rank}
                              </span>
                              <span className={`font-mono ${entry.is_current_user ? 'text-perception font-bold' : 'text-game-text'}`}>
                                {getDisplayName(entry.email)}
                              </span>
                              {entry.is_current_user && (
                                <Badge variant="outline" className="text-xs border-perception text-perception">
                                  YOU
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-game-text-dim font-mono">
                              {entry.rooms_completed} rooms • {entry.best_score} best score
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-game-text font-mono">
                            {entry.total_shards} ⬟
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Players Around Current User */}
                {currentUserRank && currentUserRank.rank > 10 && (
                  <div>
                    <h3 className="text-xl font-bold text-game-text font-mono mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-perception" />
                      AROUND YOUR RANK
                    </h3>
                    <div className="space-y-2">
                      {getUsersAroundCurrentUser().map((entry) => (
                        <div
                          key={entry.user_id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${getRankColor(entry.rank, entry.is_current_user)}`}
                        >
                          <div className="flex items-center gap-3">
                            {entry.rank <= currentUserRank.rank - 1 ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : entry.rank >= currentUserRank.rank + 1 ? (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            ) : (
                              <Star className="w-4 h-4 text-perception" />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-game-text font-mono">
                                  #{entry.rank}
                                </span>
                                <span className={`font-mono ${entry.is_current_user ? 'text-perception font-bold' : 'text-game-text'}`}>
                                  {getDisplayName(entry.email)}
                                </span>
                                {entry.is_current_user && (
                                  <Badge variant="outline" className="text-xs border-perception text-perception">
                                    YOU
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-game-text-dim font-mono">
                                {entry.total_shards} ⬟ • {entry.rooms_completed} rooms
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-game-text-dim font-mono">
                            {entry.rank < currentUserRank.rank && `+${currentUserRank.rank - entry.rank} ahead`}
                            {entry.rank > currentUserRank.rank && `-${entry.rank - currentUserRank.rank} behind`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="bg-game-border" />

              <div className="flex justify-center gap-4">
                <Button
                  onClick={fetchLeaderboard}
                  variant="outline"
                  className="border-perception text-perception hover:bg-perception/10 font-mono"
                  disabled={isLoading}
                >
                  REFRESH
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-perception hover:bg-perception/90 text-white font-mono"
                >
                  CLOSE
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};